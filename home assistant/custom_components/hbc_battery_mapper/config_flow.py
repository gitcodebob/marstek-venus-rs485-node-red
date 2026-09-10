"""Configuration flow for the HBC battery mapper."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.config_entries import ConfigFlowResult
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.selector import selector

from .const import (
    CONF_AC_POWER_ENTITY,
    CONF_AC_POWER_SIGN,
    CONF_BATTERY_INDEX,
    CONF_BATTERY_NAME,
    CONF_BATTERY_POWER_ENTITY,
    CONF_CONTROL_DISABLE_OPTION,
    CONF_CONTROL_ENABLE_OPTION,
    CONF_CONTROL_MODE_ENTITY,
    CONF_FORCE_CHARGE_OPTION,
    CONF_FORCE_DISCHARGE_OPTION,
    CONF_FORCE_MODE_ENTITY,
    CONF_FORCE_STOP_OPTION,
    CONF_FORCED_CHARGE_POWER_ENTITY,
    CONF_FORCED_DISCHARGE_POWER_ENTITY,
    CONF_INVERTER_STATE_ENTITY,
    CONF_MAX_CHARGE_POWER_ENTITY,
    CONF_MAX_DISCHARGE_POWER_ENTITY,
    CONF_POWER_SIGN,
    CONF_REMAINING_ENERGY_ENTITY,
    CONF_SOC_ENTITY,
    CONF_SOC_SCALE,
    CONF_TOTAL_ENERGY_ENTITY,
    CONF_VOLTAGE_ENTITY,
    CONF_WORK_AI_OPTION,
    CONF_WORK_ANTI_FEED_OPTION,
    CONF_WORK_MANUAL_OPTION,
    CONF_WORK_MODE_ENTITY,
    CONTROL_ENTITY_KEYS,
    DOMAIN,
    POWER_SIGN_CHARGING_POSITIVE,
    POWER_SIGN_DISCHARGING_POSITIVE,
    READ_ENTITY_KEYS,
    SOC_SCALE_FRACTION,
    SOC_SCALE_PERCENT,
    TARGET_SUFFIXES,
)

READ_DOMAINS = ["sensor", "number", "input_number"]
NUMBER_DOMAINS = ["number", "input_number"]
SELECT_DOMAINS = ["select", "input_select"]
CONTROL_MODE_DOMAINS = ["select", "input_select", "switch", "input_boolean"]


def _entity_selector(domains: list[str]):
    return selector({"entity": {"domain": domains}})


def _select_selector(options: list[Any]):
    return selector({"select": {"options": options, "mode": "dropdown"}})


POWER_SIGN_OPTIONS = [
    {
        "value": POWER_SIGN_CHARGING_POSITIVE,
        "label": "Charging is positive, discharging is negative",
    },
    {
        "value": POWER_SIGN_DISCHARGING_POSITIVE,
        "label": "Discharging is positive, charging is negative",
    },
]

SOC_SCALE_OPTIONS = [
    {"value": SOC_SCALE_PERCENT, "label": "Percent, 0 to 100"},
    {"value": SOC_SCALE_FRACTION, "label": "Fraction, 0 to 1"},
]


class HBCBatteryMapperConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure one mapped HBC battery slot."""

    VERSION = 1

    def __init__(self) -> None:
        self._data: dict[str, Any] = {}
        self._reconfigure_entry: config_entries.ConfigEntry | None = None

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Choose the HBC battery slot and conversion rules."""
        errors: dict[str, str] = {}
        if user_input is not None:
            battery_index = int(user_input[CONF_BATTERY_INDEX])
            await self.async_set_unique_id(f"battery_{battery_index}")
            self._abort_if_unique_id_configured()
            if self._target_entities_exist(battery_index):
                errors["base"] = "target_entities_exist"
            else:
                self._data.update(user_input)
                self._data[CONF_BATTERY_INDEX] = battery_index
                return await self.async_step_sensors()

        schema = vol.Schema(
            {
                vol.Required(CONF_BATTERY_INDEX, default="1"): _select_selector(
                    [str(index) for index in range(1, 7)]
                ),
                vol.Required(CONF_BATTERY_NAME, default="Home battery"): str,
                vol.Required(
                    CONF_POWER_SIGN, default=POWER_SIGN_CHARGING_POSITIVE
                ): _select_selector(POWER_SIGN_OPTIONS),
                vol.Required(
                    CONF_AC_POWER_SIGN, default=POWER_SIGN_DISCHARGING_POSITIVE
                ): _select_selector(POWER_SIGN_OPTIONS),
                vol.Required(
                    CONF_SOC_SCALE, default=SOC_SCALE_PERCENT
                ): _select_selector(SOC_SCALE_OPTIONS),
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)

    async def async_step_reconfigure(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Reconfigure an existing battery mapper entry."""
        if self._reconfigure_entry is None:
            self._reconfigure_entry = self._get_reconfigure_entry()
            self._data = dict(self._reconfigure_entry.data)

        if user_input is not None:
            self._data.update(user_input)
            return await self.async_step_sensors()

        schema = vol.Schema(
            {
                vol.Required(CONF_BATTERY_NAME): str,
                vol.Required(CONF_POWER_SIGN): _select_selector(POWER_SIGN_OPTIONS),
                vol.Required(CONF_AC_POWER_SIGN): _select_selector(POWER_SIGN_OPTIONS),
                vol.Required(CONF_SOC_SCALE): _select_selector(SOC_SCALE_OPTIONS),
            }
        )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(schema, self._data),
        )

    async def async_step_sensors(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Map source sensors."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = self._validate_source_entities(user_input, READ_ENTITY_KEYS)
            if not errors:
                self._replace_values(user_input, READ_ENTITY_KEYS)
                return await self.async_step_controls()

        schema = vol.Schema(
            {
                vol.Required(CONF_SOC_ENTITY): _entity_selector(READ_DOMAINS),
                vol.Required(CONF_BATTERY_POWER_ENTITY): _entity_selector(READ_DOMAINS),
                vol.Required(CONF_TOTAL_ENERGY_ENTITY): _entity_selector(READ_DOMAINS),
                vol.Optional(CONF_REMAINING_ENERGY_ENTITY): _entity_selector(
                    READ_DOMAINS
                ),
                vol.Optional(CONF_AC_POWER_ENTITY): _entity_selector(READ_DOMAINS),
                vol.Optional(CONF_VOLTAGE_ENTITY): _entity_selector(READ_DOMAINS),
                vol.Optional(CONF_INVERTER_STATE_ENTITY): _entity_selector(
                    ["sensor", "select", "input_select"]
                ),
            }
        )
        return self.async_show_form(
            step_id="sensors",
            data_schema=self.add_suggested_values_to_schema(schema, self._data),
            errors=errors,
        )

    async def async_step_controls(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Map writable battery controls."""
        errors: dict[str, str] = {}
        if user_input is not None:
            errors = self._validate_source_entities(user_input, CONTROL_ENTITY_KEYS)
            if not errors:
                self._replace_values(user_input, CONTROL_ENTITY_KEYS)
                try:
                    self._option_schema()
                except ValueError:
                    errors["base"] = "select_has_no_options"
                else:
                    return await self.async_step_option_map()

        schema = vol.Schema(
            {
                vol.Required(CONF_MAX_CHARGE_POWER_ENTITY): _entity_selector(
                    NUMBER_DOMAINS
                ),
                vol.Required(CONF_MAX_DISCHARGE_POWER_ENTITY): _entity_selector(
                    NUMBER_DOMAINS
                ),
                vol.Required(CONF_FORCED_CHARGE_POWER_ENTITY): _entity_selector(
                    NUMBER_DOMAINS
                ),
                vol.Required(CONF_FORCED_DISCHARGE_POWER_ENTITY): _entity_selector(
                    NUMBER_DOMAINS
                ),
                vol.Required(CONF_CONTROL_MODE_ENTITY): _entity_selector(
                    CONTROL_MODE_DOMAINS
                ),
                vol.Optional(CONF_WORK_MODE_ENTITY): _entity_selector(SELECT_DOMAINS),
                vol.Required(CONF_FORCE_MODE_ENTITY): _entity_selector(SELECT_DOMAINS),
            }
        )
        return self.async_show_form(
            step_id="controls",
            data_schema=self.add_suggested_values_to_schema(schema, self._data),
            errors=errors,
        )

    async def async_step_option_map(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Map vendor-specific select options onto the HBC contract."""
        errors: dict[str, str] = {}
        schema = self._option_schema()
        if user_input is not None:
            if self._has_duplicate_required_options(user_input):
                errors["base"] = "duplicate_options"
            else:
                option_keys = (
                    CONF_CONTROL_DISABLE_OPTION,
                    CONF_CONTROL_ENABLE_OPTION,
                    CONF_WORK_MANUAL_OPTION,
                    CONF_WORK_ANTI_FEED_OPTION,
                    CONF_WORK_AI_OPTION,
                    CONF_FORCE_STOP_OPTION,
                    CONF_FORCE_CHARGE_OPTION,
                    CONF_FORCE_DISCHARGE_OPTION,
                )
                self._replace_values(user_input, option_keys)
                title = (
                    f"M{self._data[CONF_BATTERY_INDEX]} - "
                    f"{self._data[CONF_BATTERY_NAME]}"
                )
                if self._reconfigure_entry is not None:
                    return self.async_update_reload_and_abort(
                        self._reconfigure_entry,
                        data=self._data,
                        title=title,
                        reason="reconfigure_successful",
                    )
                return self.async_create_entry(title=title, data=self._data)

        return self.async_show_form(
            step_id="option_map",
            data_schema=self.add_suggested_values_to_schema(
                schema, self._option_suggestions()
            ),
            errors=errors,
        )

    def _option_schema(self) -> vol.Schema:
        return vol.Schema(
            {
                marker: _select_selector(options)
                for marker, options in self._option_choices().items()
            }
        )

    def _option_choices(self) -> dict[Any, list[str]]:
        choices: dict[Any, list[str]] = {}
        control_entity = self._data[CONF_CONTROL_MODE_ENTITY]
        if control_entity.split(".", 1)[0] in SELECT_DOMAINS:
            control_options = self._entity_options(control_entity)
            choices[vol.Required(CONF_CONTROL_DISABLE_OPTION)] = control_options
            choices[vol.Required(CONF_CONTROL_ENABLE_OPTION)] = control_options

        work_entity = self._data.get(CONF_WORK_MODE_ENTITY)
        if work_entity:
            work_options = self._entity_options(work_entity)
            choices[vol.Required(CONF_WORK_MANUAL_OPTION)] = work_options
            choices[vol.Optional(CONF_WORK_ANTI_FEED_OPTION)] = work_options
            choices[vol.Optional(CONF_WORK_AI_OPTION)] = work_options

        force_options = self._entity_options(self._data[CONF_FORCE_MODE_ENTITY])
        choices[vol.Required(CONF_FORCE_STOP_OPTION)] = force_options
        choices[vol.Required(CONF_FORCE_CHARGE_OPTION)] = force_options
        choices[vol.Required(CONF_FORCE_DISCHARGE_OPTION)] = force_options
        return choices

    def _entity_options(self, entity_id: str) -> list[str]:
        state = self.hass.states.get(entity_id)
        options = list(state.attributes.get("options", [])) if state else []
        if not options:
            raise ValueError(f"{entity_id} has no options")
        return options

    def _option_defaults(self) -> dict[str, str]:
        defaults: dict[str, str] = {}
        control_entity = self._data[CONF_CONTROL_MODE_ENTITY]
        if control_entity.split(".", 1)[0] in SELECT_DOMAINS:
            options = self._entity_options(control_entity)
            self._set_guess(
                defaults,
                CONF_CONTROL_DISABLE_OPTION,
                options,
                ("disable", "disabled", "off"),
            )
            self._set_guess(
                defaults,
                CONF_CONTROL_ENABLE_OPTION,
                options,
                ("enable", "enabled", "on"),
            )

        if work_entity := self._data.get(CONF_WORK_MODE_ENTITY):
            options = self._entity_options(work_entity)
            self._set_guess(defaults, CONF_WORK_MANUAL_OPTION, options, ("manual",))
            self._set_guess(
                defaults,
                CONF_WORK_ANTI_FEED_OPTION,
                options,
                ("anti-feed", "antifeed", "anti feed"),
            )
            self._set_guess(
                defaults,
                CONF_WORK_AI_OPTION,
                options,
                ("ai", "auto", "trade_mode", "trade mode"),
            )

        options = self._entity_options(self._data[CONF_FORCE_MODE_ENTITY])
        self._set_guess(
            defaults,
            CONF_FORCE_STOP_OPTION,
            options,
            ("stop", "idle", "standby", "none"),
        )
        self._set_guess(
            defaults, CONF_FORCE_CHARGE_OPTION, options, ("charge", "charging")
        )
        self._set_guess(
            defaults,
            CONF_FORCE_DISCHARGE_OPTION,
            options,
            ("discharge", "discharging"),
        )
        return defaults

    def _option_suggestions(self) -> dict[str, str]:
        suggestions = self._option_defaults()
        for marker, options in self._option_choices().items():
            key = marker.schema
            if self._data.get(key) in options:
                suggestions[key] = self._data[key]
        return suggestions

    @staticmethod
    def _set_guess(
        defaults: dict[str, str],
        key: str,
        options: list[str],
        aliases: tuple[str, ...],
    ) -> None:
        normalized_aliases = {
            alias.lower().replace("-", "").replace("_", "").replace(" ", "")
            for alias in aliases
        }
        for option in options:
            normalized = (
                option.lower().replace("-", "").replace("_", "").replace(" ", "")
            )
            if normalized in normalized_aliases:
                defaults[key] = option
                return

    def _validate_source_entities(
        self, user_input: dict[str, Any], keys: tuple[str, ...]
    ) -> dict[str, str]:
        errors: dict[str, str] = {}
        targets = self._target_entity_ids(int(self._data[CONF_BATTERY_INDEX]))
        registry = er.async_get(self.hass)
        for key in keys:
            entity_id = user_input.get(key)
            if not entity_id:
                continue
            registry_entry = registry.async_get(entity_id)
            if entity_id in targets or (
                registry_entry and registry_entry.platform == DOMAIN
            ):
                errors[key] = "recursive_mapping"
            elif self.hass.states.get(entity_id) is None:
                errors[key] = "entity_not_found"
        return errors

    def _target_entities_exist(self, battery_index: int) -> bool:
        registry = er.async_get(self.hass)
        current_entry_id = (
            self._reconfigure_entry.entry_id if self._reconfigure_entry else None
        )
        for entity_id in self._target_entity_ids(battery_index):
            registry_entry = registry.async_get(entity_id)
            if registry_entry and registry_entry.config_entry_id != current_entry_id:
                return True
            if self.hass.states.get(entity_id) and not registry_entry:
                return True
        return False

    @staticmethod
    def _target_entity_ids(battery_index: int) -> set[str]:
        return {
            f"{domain}.marstek_m{battery_index}_{suffix}"
            for domain, suffixes in TARGET_SUFFIXES.items()
            for suffix in suffixes
        }

    @staticmethod
    def _has_duplicate_required_options(user_input: dict[str, Any]) -> bool:
        groups = (
            (CONF_CONTROL_DISABLE_OPTION, CONF_CONTROL_ENABLE_OPTION),
            (
                CONF_WORK_MANUAL_OPTION,
                CONF_WORK_ANTI_FEED_OPTION,
                CONF_WORK_AI_OPTION,
            ),
            (
                CONF_FORCE_STOP_OPTION,
                CONF_FORCE_CHARGE_OPTION,
                CONF_FORCE_DISCHARGE_OPTION,
            ),
        )
        return any(
            len(values := [user_input[key] for key in group if key in user_input])
            != len(set(values))
            for group in groups
        )

    def _replace_values(
        self, user_input: dict[str, Any], keys: tuple[str, ...]
    ) -> None:
        for key in keys:
            if user_input.get(key):
                self._data[key] = user_input[key]
            else:
                self._data.pop(key, None)
