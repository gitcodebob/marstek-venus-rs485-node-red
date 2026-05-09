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

// 3.  Mark intervals: pair lower-half LOWs with upper-half HIGHs
//
// Each HIGH interval is backed by a specific LOW interval — one-to-one
// pairing, no element used twice. The minDelta threshold accounts for
// round-trip efficiency and other losses, so a pair is only viable when its spread covers
// the loss.
//
// Method (Adjacent-Halves Matching, O(n log n)):
//   1. Sort intervals by price, keep original time-index for re-mapping.
//   2. Conceptually split into a lower half (LOW candidates) and an upper
//      half (HIGH candidates). With n intervals the maximum number of
//      cycles is floor(n/2) — capped by whichever half is smaller.
//   3. Two-pointer walk: for each LOW (cheapest first), advance the HIGH
//      pointer until the spread clears minDelta. Pair them, then advance
//      both. If a LOW cannot find any viable HIGH, the upper half is
//      exhausted and the loop ends.
//
// Maximises the number of viable charge/discharge cycles; every marked
// pair is guaranteed economical after round-trip losses.
//
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

const mid = Math.floor(n / 2);
let lo = 0;
let hi = mid;
let pairCount = 0;
while (lo < mid && hi < n) {
    const loIdx = sortedIdx[lo];
    const hiIdx = sortedIdx[hi];
    if (prices[hiIdx] - prices[loIdx] >= minDeltaCents) {
        intervals[loIdx].mark = 'low';
        intervals[hiIdx].mark = 'high';
        pairCount++;
        lo++; hi++;
    } else {
        // Current LOW too close to this HIGH — try a pricier HIGH partner.
        hi++;
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
