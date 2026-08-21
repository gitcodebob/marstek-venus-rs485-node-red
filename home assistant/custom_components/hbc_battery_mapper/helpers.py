"""Value conversion helpers for the HBC battery mapper."""

from __future__ import annotations

from typing import Any

from .const import (
    POWER_SIGN_CHARGING_POSITIVE,
    SOC_SCALE_FRACTION,
    UNAVAILABLE_STATES,
)

POWER_TO_W = {
    "mw": 0.001,
    "w": 1.0,
    "kw": 1000.0,
    "mw_power": 1_000_000.0,
}

ENERGY_TO_KWH = {
    "mwh": 0.000001,
    "wh": 0.001,
    "kwh": 1.0,
    "mwh_energy": 1000.0,
}

VOLTAGE_TO_V = {
    "mv": 0.001,
    "v": 1.0,
    "kv": 1000.0,
}


def as_float(value: Any) -> float | None:
    """Return a finite float, or None for an invalid Home Assistant state."""
    if value is None or str(value).strip().lower() in UNAVAILABLE_STATES:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if result != result or result in (float("inf"), float("-inf")):
        return None
    return result


def _unit_key(unit: str | None, quantity: str) -> str:
    """Normalize ambiguous unit abbreviations without losing their quantity."""
    normalized = (unit or "").strip().lower().replace(" ", "")
    if quantity == "power" and unit == "mW":
        return "mw"
    if quantity == "power" and unit == "MW":
        return "mw_power"
    if quantity == "energy" and normalized == "mwh":
        return "mwh_energy" if unit == "MWh" else "mwh"
    return normalized


def power_to_w(value: Any, unit: str | None) -> float | None:
    """Convert a power value to watts. Missing units are treated as watts."""
    number = as_float(value)
    if number is None:
        return None
    factor = POWER_TO_W.get(_unit_key(unit, "power"), 1.0)
    return number * factor


def power_from_w(value: float, unit: str | None) -> float:
    """Convert watts to a source entity's power unit."""
    factor = POWER_TO_W.get(_unit_key(unit, "power"), 1.0)
    return value / factor


def energy_to_kwh(value: Any, unit: str | None) -> float | None:
    """Convert an energy value to kilowatt-hours. Missing units mean kWh."""
    number = as_float(value)
    if number is None:
        return None
    factor = ENERGY_TO_KWH.get(_unit_key(unit, "energy"), 1.0)
    return number * factor


def voltage_to_v(value: Any, unit: str | None) -> float | None:
    """Convert a voltage value to volts. Missing units mean volts."""
    number = as_float(value)
    if number is None:
        return None
    factor = VOLTAGE_TO_V.get(_unit_key(unit, "voltage"), 1.0)
    return number * factor


def soc_to_percent(value: Any, scale: str) -> float | None:
    """Convert state of charge to percent."""
    number = as_float(value)
    if number is None:
        return None
    return round(number * 100, 3) if scale == SOC_SCALE_FRACTION else number


def canonical_battery_power(value_w: float | None, sign: str) -> float | None:
    """Use HBC polarity: charging positive, discharging negative."""
    if value_w is None:
        return None
    return value_w if sign == POWER_SIGN_CHARGING_POSITIVE else -value_w


def canonical_inverter_state(raw: Any, battery_power_w: float | None) -> str | None:
    """Normalize common inverter states or derive one from battery power."""
    if raw is not None and str(raw).lower() not in UNAVAILABLE_STATES:
        text = str(raw).strip()
        lower = text.lower().replace("_", " ").replace("-", " ")
        if lower.isdigit():
            return {
                "0": "Sleep",
                "1": "Standby",
                "2": "Charge",
                "3": "Discharge",
                "4": "Fault",
                "5": "Idle",
                "6": "AC bypass",
            }.get(lower, text)
        if "discharg" in lower:
            return "Discharge"
        if "charg" in lower:
            return "Charge"
        if "standby" in lower or "stand by" in lower:
            return "Standby"
        if "sleep" in lower:
            return "Sleep"
        if "fault" in lower or "error" in lower:
            return "Fault"
        if "idle" in lower:
            return "Idle"
        if "bypass" in lower:
            return "AC bypass"
        return text
    if battery_power_w is None:
        return None
    if battery_power_w > 5:
        return "Charge"
    if battery_power_w < -5:
        return "Discharge"
    return "Standby"


def inverter_state_number(state: str | None) -> int | None:
    """Return the Fonske inverter state number for a canonical state."""
    if state is None:
        return None
    return {
        "sleep": 0,
        "standby": 1,
        "charge": 2,
        "discharge": 3,
        "fault": 4,
        "idle": 5,
        "ac bypass": 6,
    }.get(state.lower(), 4)
