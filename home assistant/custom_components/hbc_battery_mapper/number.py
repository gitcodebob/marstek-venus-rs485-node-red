"""Writable number proxies for the HBC battery contract."""

from __future__ import annotations

from homeassistant.components.number import NumberDeviceClass, NumberEntity, NumberMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_UNIT_OF_MEASUREMENT, UnitOfPower
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    CONF_FORCED_CHARGE_POWER_ENTITY,
    CONF_FORCED_DISCHARGE_POWER_ENTITY,
    CONF_MAX_CHARGE_POWER_ENTITY,
    CONF_MAX_DISCHARGE_POWER_ENTITY,
)
from .entity import HBCMappedEntity
from .helpers import as_float, power_from_w, power_to_w


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up HBC battery mapper numbers."""
    async_add_entities(
        [
            HBCPowerNumber(
                hass,
                entry,
                CONF_MAX_CHARGE_POWER_ENTITY,
                "max_charge_power",
                "Max. Charge Power",
            ),
            HBCPowerNumber(
                hass,
                entry,
                CONF_MAX_DISCHARGE_POWER_ENTITY,
                "max_discharge_power",
                "Max. Discharge Power",
            ),
            HBCPowerNumber(
                hass,
                entry,
                CONF_FORCED_CHARGE_POWER_ENTITY,
                "forcible_charge_power",
                "Forcible Charge Power",
            ),
            HBCPowerNumber(
                hass,
                entry,
                CONF_FORCED_DISCHARGE_POWER_ENTITY,
                "forcible_discharge_power",
                "Forcible Discharge Power",
            ),
        ]
    )


class HBCPowerNumber(HBCMappedEntity, NumberEntity):
    """A writable source number normalized to watts."""

    _hbc_entity_domain = "number"
    _attr_device_class = NumberDeviceClass.POWER
    _attr_native_unit_of_measurement = UnitOfPower.WATT
    _attr_native_step = 1.0
    _attr_mode = NumberMode.BOX

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        config_key: str,
        suffix: str,
        name: str,
    ) -> None:
        self.source = entry.data[config_key]
        super().__init__(hass, entry, suffix, name, [self.source])

    @property
    def available(self) -> bool:
        return self._source_available(self.source)

    @property
    def native_value(self) -> float | None:
        state = self._source_state(self.source)
        return (
            power_to_w(state.state, state.attributes.get(ATTR_UNIT_OF_MEASUREMENT))
            if state
            else None
        )

    def _bound(self, attribute: str, fallback: float) -> float:
        state = self._source_state(self.source)
        if not state:
            return fallback
        raw = as_float(state.attributes.get(attribute))
        if raw is None:
            return fallback
        value = power_to_w(raw, state.attributes.get(ATTR_UNIT_OF_MEASUREMENT))
        return value if value is not None else fallback

    @property
    def native_min_value(self) -> float:
        return self._bound("min", 0.0)

    @property
    def native_max_value(self) -> float:
        return self._bound("max", 15000.0)

    async def async_set_native_value(self, value: float) -> None:
        """Forward a set-value request to the selected source number."""
        state = self._source_state(self.source)
        unit = state.attributes.get(ATTR_UNIT_OF_MEASUREMENT) if state else None
        domain = self.source.split(".", 1)[0]
        await self.hass.services.async_call(
            domain,
            "set_value",
            {
                ATTR_ENTITY_ID: self.source,
                "value": power_from_w(value, unit),
            },
            blocking=True,
        )
