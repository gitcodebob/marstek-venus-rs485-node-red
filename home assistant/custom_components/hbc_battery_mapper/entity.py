"""Shared entity support for the HBC battery mapper."""

from __future__ import annotations

from collections.abc import Iterable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.event import async_track_state_change_event

from .const import CONF_BATTERY_INDEX, CONF_BATTERY_NAME, DOMAIN, UNAVAILABLE_STATES


class HBCMappedEntity(Entity):
    """Base for an entity backed by existing Home Assistant entities."""

    _attr_should_poll = False
    _hbc_entity_domain: str

    def __init__(
        self,
        hass: HomeAssistant,
        entry: ConfigEntry,
        suffix: str,
        name: str,
        source_entity_ids: Iterable[str | None] = (),
    ) -> None:
        """Initialize a mapped entity."""
        self.hass = hass
        self.entry = entry
        self.battery_index = int(entry.data[CONF_BATTERY_INDEX])
        self._sources = tuple(source for source in source_entity_ids if source)
        object_id = f"marstek_m{self.battery_index}_{suffix}"
        self._attr_unique_id = object_id
        # HBC's dashboard and Node-RED flows require this exact entity ID.
        # Setting it before registration prevents Home Assistant's optional
        # device-name prefix from becoming part of the generated object ID.
        self.entity_id = f"{self._hbc_entity_domain}.{object_id}"
        self._attr_name = f"Marstek m{self.battery_index} {name}"
        self._attr_has_entity_name = False
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"battery_{self.battery_index}")},
            manufacturer="Home Battery Control",
            model="Entity mapper",
            name=f"HBC mapped battery M{self.battery_index}: "
            f"{entry.data[CONF_BATTERY_NAME]}",
        )

    async def async_added_to_hass(self) -> None:
        """Update immediately when any mapped source changes."""
        await super().async_added_to_hass()
        if self._sources:
            self.async_on_remove(
                async_track_state_change_event(
                    self.hass, self._sources, self._async_source_updated
                )
            )

    @callback
    def _async_source_updated(self, event: Event) -> None:
        """Write the new proxy state."""
        self.async_write_ha_state()

    def _source_available(self, entity_id: str | None) -> bool:
        """Return whether a source entity currently has a usable state."""
        if not entity_id:
            return False
        state = self.hass.states.get(entity_id)
        return state is not None and state.state.lower() not in UNAVAILABLE_STATES

    def _source_state(self, entity_id: str | None):
        """Return a source State object."""
        return self.hass.states.get(entity_id) if entity_id else None
