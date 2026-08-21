"""Constants for the HBC battery mapper."""

from __future__ import annotations

DOMAIN = "hbc_battery_mapper"

CONF_BATTERY_INDEX = "battery_index"
CONF_BATTERY_NAME = "battery_name"
CONF_POWER_SIGN = "power_sign"
CONF_AC_POWER_SIGN = "ac_power_sign"
CONF_SOC_SCALE = "soc_scale"

CONF_SOC_ENTITY = "state_of_charge_entity"
CONF_BATTERY_POWER_ENTITY = "battery_power_entity"
CONF_AC_POWER_ENTITY = "ac_power_entity"
CONF_TOTAL_ENERGY_ENTITY = "total_energy_entity"
CONF_REMAINING_ENERGY_ENTITY = "remaining_energy_entity"
CONF_VOLTAGE_ENTITY = "voltage_entity"
CONF_INVERTER_STATE_ENTITY = "inverter_state_entity"

CONF_MAX_CHARGE_POWER_ENTITY = "max_charge_power_entity"
CONF_MAX_DISCHARGE_POWER_ENTITY = "max_discharge_power_entity"
CONF_FORCED_CHARGE_POWER_ENTITY = "forced_charge_power_entity"
CONF_FORCED_DISCHARGE_POWER_ENTITY = "forced_discharge_power_entity"

CONF_CONTROL_MODE_ENTITY = "control_mode_entity"
CONF_WORK_MODE_ENTITY = "work_mode_entity"
CONF_FORCE_MODE_ENTITY = "force_mode_entity"

CONF_CONTROL_DISABLE_OPTION = "control_disable_option"
CONF_CONTROL_ENABLE_OPTION = "control_enable_option"
CONF_WORK_MANUAL_OPTION = "work_manual_option"
CONF_WORK_ANTI_FEED_OPTION = "work_anti_feed_option"
CONF_WORK_AI_OPTION = "work_ai_option"
CONF_FORCE_STOP_OPTION = "force_stop_option"
CONF_FORCE_CHARGE_OPTION = "force_charge_option"
CONF_FORCE_DISCHARGE_OPTION = "force_discharge_option"

POWER_SIGN_CHARGING_POSITIVE = "charging_positive"
POWER_SIGN_DISCHARGING_POSITIVE = "discharging_positive"
SOC_SCALE_PERCENT = "percent"
SOC_SCALE_FRACTION = "fraction"

READ_ENTITY_KEYS: tuple[str, ...] = (
    CONF_SOC_ENTITY,
    CONF_BATTERY_POWER_ENTITY,
    CONF_AC_POWER_ENTITY,
    CONF_TOTAL_ENERGY_ENTITY,
    CONF_REMAINING_ENERGY_ENTITY,
    CONF_VOLTAGE_ENTITY,
    CONF_INVERTER_STATE_ENTITY,
)

CONTROL_ENTITY_KEYS: tuple[str, ...] = (
    CONF_MAX_CHARGE_POWER_ENTITY,
    CONF_MAX_DISCHARGE_POWER_ENTITY,
    CONF_FORCED_CHARGE_POWER_ENTITY,
    CONF_FORCED_DISCHARGE_POWER_ENTITY,
    CONF_CONTROL_MODE_ENTITY,
    CONF_WORK_MODE_ENTITY,
    CONF_FORCE_MODE_ENTITY,
)

TARGET_SUFFIXES: dict[str, tuple[str, ...]] = {
    "sensor": (
        "device_name",
        "battery_state_of_charge",
        "battery_power",
        "ac_power",
        "battery_total_energy",
        "battery_remaining_capacity",
        "battery_voltage",
        "inverter_state",
        "inverter_state_number",
    ),
    "number": (
        "max_charge_power",
        "max_discharge_power",
        "forcible_charge_power",
        "forcible_discharge_power",
    ),
    "select": (
        "rs485_control_mode",
        "user_work_mode",
        "forcible_charge_discharge",
    ),
}

UNAVAILABLE_STATES = frozenset({"unknown", "unavailable", ""})
