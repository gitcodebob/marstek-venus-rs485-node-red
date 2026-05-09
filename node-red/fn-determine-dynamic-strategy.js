// logger, usage: log(this, "");
const log = global.get('logger');

// 1.  Input
const minDeltaCents = parseInt(RED.util.getMessageProperty(msg, "dynamic.min_delta_cents")) || 0;
const dataAll = RED.util.getMessageProperty(msg, "dynamic.data_all");

if (!dataAll || !Array.isArray(dataAll.list) || dataAll.list.length === 0) {
    log(this, "Price list missing or empty", "warn");
    node.status({ fill: "red", shape: "ring", text: "No price data" });
    return null;
}

const STRATEGY = {
    HIGH: RED.util.getMessageProperty(msg, "dynamic.strategy_expensive") || "Self-consumption",
    LOW: RED.util.getMessageProperty(msg, "dynamic.strategy_cheapest") || "Charge",
    NEUTRAL: RED.util.getMessageProperty(msg, "dynamic.strategy_default") || "Charge PV",
};

// 2.  Build interval timestamps
// Each datapoint covers (hours / datapoints) hours.
const prices = dataAll.list; // cents/kWh — already converted by "Convert price" node
const n = prices.length;
const startTime = new Date(dataAll.start);
const intervalMs = (dataAll.hours / dataAll.datapoints) * 3_600_000;

// 3.  Mark intervals: pair extremes inward
//
// Each HIGH interval is backed by a specific LOW interval — one-to-one
// pairing, no element used twice. The minDelta threshold accounts for
// round-trip efficiency and other losses, so a pair is only viable when
// its spread covers the loss.
//
// Method (Extreme-Pair Matching, O(n log n)):
//   1. Sort intervals by price, keep original time-index for re-mapping.
//   2. Two pointers walk inward from the extremes — `lo` from the cheapest
//      unmatched, `hi` from the most-expensive unmatched.
//   3. If the spread between them clears minDelta: mark them, advance both.
//   4. If it does not clear minDelta: the cheapest unmatched LOW paired
//      with the most-expensive unmatched HIGH yields the largest spread
//      still achievable. If even that fails, no remaining pair can satisfy
//      the threshold, so we stop.
//
// This algorithm prefers to mark the truly extreme
// hours (highest-priced as HIGH, lowest-priced as LOW). On well-behaved
// daily curves this produces the same number of pairs as 
// other algorithm variants; but in tight cases it can produce one or two fewer
// pairs. Why choose this version? It marks the price peaks/troughs the user
// would intuitively expect, which is good for user confidence and acceptance of the strategy. It is also efficient and straightforward to implement, without needing complex data structures or backtracking. 
// The main goal is to identify a set of HIGH and LOW intervals that are economically justified by their price spread, while keeping the logic transparent and explainable to the user.

// Note:
// It is up to the user to set minDelta appropriately for their system's efficiency and other costs, to ensure that marked cycles are truly beneficial.
// Also the user can pick strategies that reflect their preferences for what to do during LOW and HIGH intervals, e.g. prioritising self-consumption during HIGH intervals, or selling back to the grid if allowed and profitable.
// This makes optimisation flexible and user-configurable, while still being based on a clear economic rationale.
// However, the algorithm does not attempt to find the optimal global pairing (which would be more complex), but rather a good local pairing that is computationally efficient and easy to understand.

/**
 * @typedef {{ start: Date, end: Date, price: number, mark: 'high'|'low'|null }} Interval
 * @type {Interval[]}
 */
const intervals = new Array(n);
for (let i = 0; i < n; i++) {
    const iStart = new Date(startTime.getTime() + i * intervalMs);
    const iEnd = new Date(iStart.getTime() + intervalMs);
    intervals[i] = { start: iStart, end: iEnd, price: prices[i], mark: null };
}

// Indices into `prices`, sorted ascending by price (stable on ties).
const sortedIdx = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => prices[a] - prices[b]);

let lo = 0;
let hi = n - 1;
let pairCount = 0;
while (lo < hi) {
    const loIdx = sortedIdx[lo];
    const hiIdx = sortedIdx[hi];
    if (prices[hiIdx] - prices[loIdx] >= minDeltaCents) {
        intervals[loIdx].mark = 'low';
        intervals[hiIdx].mark = 'high';
        pairCount++;
        lo++; hi--;
    } else {
        // sorted[lo] is the cheapest unmatched, sorted[hi] the most-expensive
        // unmatched. Their spread is the largest still possible — if it falls
        // below minDelta, no further pair can satisfy the threshold.
        break;
    }
}

// 4.  Determine current strategy
const now = new Date();
const currentInterval = intervals.find(iv => now >= iv.start && now < iv.end);
const currentMark = currentInterval ? currentInterval.mark : null;

const strategy =
    currentMark === 'high' ? STRATEGY.HIGH :
        currentMark === 'low' ? STRATEGY.LOW :
            STRATEGY.NEUTRAL;

// 5.  Store results
msg.dynamic.intervals = intervals;
msg.dynamic.strategy = strategy;
flow.set("dynamic_strategy", strategy);

// 6.  User feedback
const totalSpread = intervals
    .filter(iv => iv.mark !== null)
    .reduce((sum, iv) => sum + (iv.mark === 'high' ? iv.price : -iv.price), 0);

node.status({
    fill: "blue", shape: "dot",
    text: `${strategy} | ${pairCount} cycle${pairCount === 1 ? '' : 's'} | Σ${totalSpread}¢`
});
log(this, `Strategy: **${strategy}** | cycles=${pairCount} unmarked=${n - 2 * pairCount} | totalSpread=${totalSpread}¢ minDelta=${minDeltaCents}¢`);

return msg;
