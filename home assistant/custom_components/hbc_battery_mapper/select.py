"""Writable select proxies for the HBC battery contract."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID, STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    CONF_CONTROL_DISABLE_OPTION,
    CONF_CONTROL_ENABLE_OPTION,
    CONF_CONTROL_MODE_ENTITY,
    CONF_FORCE_CHARGE_OPTION,
    CONF_FORCE_DISCHARGE_OPTION,
    CONF_FORCE_MODE_ENTITY,
    CONF_FORCE_STOP_OPTION,
    CONF_WORK_AI_OPTION,
    CONF_WORK_ANTI_FEED_OPTION,
    CONF_WORK_MANUAL_OPTION,
    CONF_WORK_MODE_ENTITY,
)
from .entity import HBCMappedEntity


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up HBC battery mapper selects."""
    async_add_entities(
        [
            HBCControlModeSelect(hass, entry),
            HBCWorkModeSelect(hass, entry),
            HBCForceModeSelect(hass, entry),
        ]
    )


class HBCMappedSelect(HBCMappedEntity, SelectEntity):
    """A canonical HBC select backed by another select."""

    _hbc_entity_domain = "select"

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        source: str | None,
        suffix: str,
        name: str,
        option_keys: dict[str, str],
    ) -> None:
        self.source = source
        self.option_keys = option_keys
        super().__init__(hass, entry, suffix, name, [source])

    @property
    def options(self) -> list[str]:
        return [
            canonical
            for canonical, config_key in self.option_keys.items()
            if self.entry.data.get(config_key)
        ]

    @property
    def available(self) -> bool:
        return self._source_available(self.source)

    @property
    def current_option(self) -> str | None:
        state = self._source_state(self.source)
        if not state:
            return None
        for canonical, config_key in self.option_keys.items():
            if state.state == self.entry.data.get(config_key):
                return canonical
        return None

    async def async_select_option(self, option: str) -> None:
        """Forward a canonical option to the source select."""
        raw_option = self.entry.data[self.option_keys[option]]
        domain = self.source.split(".", 1)[0]
        await self.hass.services.async_call(
            domain,
            "select_option",
            {ATTR_ENTITY_ID: self.source, "option": raw_option},
            blocking=True,
        )


class HBCControlModeSelect(HBCMappedSelect):
    """RS485/external control mode, with switch support."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            entry,
            entry.data[CONF_CONTROL_MODE_ENTITY],
            "rs485_control_mode",
            "RS485 Control Mode",
            {
                "disable": CONF_CONTROL_DISABLE_OPTION,
                "enable": CONF_CONTROL_ENABLE_OPTION,
            },
        )

    @property
    def options(self) -> list[str]:
        return ["disable", "enable"]

    @property
    def current_option(self) -> str | None:
        if self.source.split(".", 1)[0] in {"switch", "input_boolean"}:
            state = self._source_state(self.source)
            if not state:
                return None
            return "enable" if state.state == STATE_ON else "disable"
        return super().current_option

    async def async_select_option(self, option: str) -> None:
        if self.source.split(".", 1)[0] in {"switch", "input_boolean"}:
            domain = self.source.split(".", 1)[0]
            service = "turn_on" if option == "enable" else "turn_off"
            await self.hass.services.async_call(
                domain,
                service,
                {ATTR_ENTITY_ID: self.source},
                blocking=True,
            )
            return
        await super().async_select_option(option)


class HBCWorkModeSelect(HBCMappedSelect):
    """Battery work mode. A missing source is a fixed manual mode."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            entry,
            entry.data.get(CONF_WORK_MODE_ENTITY),
            "user_work_mode",
            "User Work Mode",
            {
                "manual": CONF_WORK_MANUAL_OPTION,
                "anti-feed": CONF_WORK_ANTI_FEED_OPTION,
                "ai": CONF_WORK_AI_OPTION,
            },
        )

    @property
    def options(self) -> list[str]:
        return super().options if self.source else ["manual"]

    @property
    def available(self) -> bool:
        return not self.source or super().available

    @property
    def current_option(self) -> str | None:
        return super().current_option if self.source else "manual"

    async def async_select_option(self, option: str) -> None:
        if self.source:
            await super().async_select_option(option)


class HBCForceModeSelect(HBCMappedSelect):
    """Forced stop, charge, or discharge mode."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            entry,
            entry.data[CONF_FORCE_MODE_ENTITY],
            "forcible_charge_discharge",
            "Forcible Charge/Discharge",
            {
                "stop": CONF_FORCE_STOP_OPTION,
                "charge": CONF_FORCE_CHARGE_OPTION,
                "discharge": CONF_FORCE_DISCHARGE_OPTION,
            },
        )
