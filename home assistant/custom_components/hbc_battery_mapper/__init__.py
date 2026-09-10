"""Home Battery Control battery entity mapper."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryError
from homeassistant.helpers import entity_registry as er

from .const import CONF_BATTERY_INDEX, DOMAIN, TARGET_SUFFIXES

PLATFORMS: tuple[Platform, ...] = (
    Platform.SENSOR,
    Platform.NUMBER,
    Platform.SELECT,
)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up an HBC battery mapping entry."""
    _migrate_entity_ids(hass, entry)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload an HBC battery mapping entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


def _migrate_entity_ids(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Rename device-prefixed mapper IDs to the exact HBC contract IDs."""
    registry = er.async_get(hass)
    battery_index = int(entry.data[CONF_BATTERY_INDEX])

    for entity_domain, suffixes in TARGET_SUFFIXES.items():
        for suffix in suffixes:
            unique_id = f"marstek_m{battery_index}_{suffix}"
            current_id = registry.async_get_entity_id(entity_domain, DOMAIN, unique_id)
            target_id = f"{entity_domain}.{unique_id}"
            if current_id is None or current_id == target_id:
                continue

            current_entry = registry.async_get(current_id)
            if current_entry is None or current_entry.config_entry_id != entry.entry_id:
                raise ConfigEntryError(
                    f"Cannot migrate {current_id}: it does not belong to this mapper"
                )
            if registry.async_get(target_id) is not None or hass.states.get(target_id):
                raise ConfigEntryError(
                    f"Cannot rename {current_id} to {target_id}: target already exists"
                )

            registry.async_update_entity(current_id, new_entity_id=target_id)
