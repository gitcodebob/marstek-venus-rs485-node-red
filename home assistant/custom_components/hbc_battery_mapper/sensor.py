"""Sensor proxies for the HBC battery contract."""

from __future__ import annotations

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import (
    PERCENTAGE,
    UnitOfEnergy,
    UnitOfElectricPotential,
    UnitOfPower,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import (
    CONF_AC_POWER_ENTITY,
    CONF_AC_POWER_SIGN,
    CONF_BATTERY_NAME,
    CONF_BATTERY_POWER_ENTITY,
    CONF_INVERTER_STATE_ENTITY,
    CONF_POWER_SIGN,
    CONF_REMAINING_ENERGY_ENTITY,
    CONF_SOC_ENTITY,
    CONF_SOC_SCALE,
    CONF_TOTAL_ENERGY_ENTITY,
    CONF_VOLTAGE_ENTITY,
)
from .entity import HBCMappedEntity
from .helpers import (
    canonical_battery_power,
    canonical_inverter_state,
    energy_to_kwh,
    inverter_state_number,
    power_to_w,
    soc_to_percent,
    voltage_to_v,
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up HBC battery mapper sensors."""
    async_add_entities(
        [
            HBCDeviceNameSensor(hass, entry),
            HBCStateOfChargeSensor(hass, entry),
            HBCBatteryPowerSensor(hass, entry),
            HBCACPowerSensor(hass, entry),
            HBCTotalEnergySensor(hass, entry),
            HBCRemainingEnergySensor(hass, entry),
            HBCVoltageSensor(hass, entry),
            HBCInverterStateSensor(hass, entry),
            HBCInverterStateNumberSensor(hass, entry),
        ]
    )


class HBCMappedSensor(HBCMappedEntity, SensorEntity):
    """Base for a mapped HBC sensor."""

    _hbc_entity_domain = "sensor"


class HBCDeviceNameSensor(HBCMappedSensor):
    """Configured battery name."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(hass, entry, "device_name", "Device Name")

    @property
    def native_value(self) -> str:
        return str(self.entry.data[CONF_BATTERY_NAME])


class HBCStateOfChargeSensor(HBCMappedSensor):
    """Battery state of charge in percent."""

    _attr_device_class = SensorDeviceClass.BATTERY
    _attr_native_unit_of_measurement = PERCENTAGE
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data[CONF_SOC_ENTITY]
        super().__init__(
            hass,
            entry,
            "battery_state_of_charge",
            "Battery State of Charge",
            [self.source],
        )

    @property
    def available(self) -> bool:
        return self._source_available(self.source)

    @property
    def native_value(self) -> float | None:
        state = self._source_state(self.source)
        return (
            soc_to_percent(state.state, self.entry.data[CONF_SOC_SCALE])
            if state
            else None
        )


class HBCBatteryPowerSensor(HBCMappedSensor):
    """Battery power with charging positive and discharging negative."""

    _attr_device_class = SensorDeviceClass.POWER
    _attr_native_unit_of_measurement = UnitOfPower.WATT
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data[CONF_BATTERY_POWER_ENTITY]
        super().__init__(hass, entry, "battery_power", "Battery Power", [self.source])

    @property
    def available(self) -> bool:
        return self._source_available(self.source)

    @property
    def native_value(self) -> float | None:
        state = self._source_state(self.source)
        if not state:
            return None
        value = power_to_w(state.state, state.attributes.get("unit_of_measurement"))
        return canonical_battery_power(value, self.entry.data[CONF_POWER_SIGN])


class HBCACPowerSensor(HBCMappedSensor):
    """AC power with discharging positive for the dashboard."""

    _attr_device_class = SensorDeviceClass.POWER
    _attr_native_unit_of_measurement = UnitOfPower.WATT
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data.get(CONF_AC_POWER_ENTITY)
        self.battery_power_source = entry.data[CONF_BATTERY_POWER_ENTITY]
        super().__init__(
            hass,
            entry,
            "ac_power",
            "AC Power",
            [self.source, self.battery_power_source],
        )

    @property
    def available(self) -> bool:
        return self._source_available(self.source or self.battery_power_source)

    @property
    def native_value(self) -> float | None:
        if self.source:
            state = self._source_state(self.source)
            if not state:
                return None
            value = power_to_w(state.state, state.attributes.get("unit_of_measurement"))
            canonical = canonical_battery_power(
                value, self.entry.data[CONF_AC_POWER_SIGN]
            )
            return -canonical if canonical is not None else None
        state = self._source_state(self.battery_power_source)
        if not state:
            return None
        value = power_to_w(state.state, state.attributes.get("unit_of_measurement"))
        canonical = canonical_battery_power(value, self.entry.data[CONF_POWER_SIGN])
        return -canonical if canonical is not None else None


class HBCTotalEnergySensor(HBCMappedSensor):
    """Total battery energy in kWh."""

    _attr_device_class = SensorDeviceClass.ENERGY_STORAGE
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data[CONF_TOTAL_ENERGY_ENTITY]
        super().__init__(
            hass, entry, "battery_total_energy", "Battery Total Energy", [self.source]
        )

    @property
    def available(self) -> bool:
        return self._source_available(self.source)

    @property
    def native_value(self) -> float | None:
        state = self._source_state(self.source)
        return (
            energy_to_kwh(state.state, state.attributes.get("unit_of_measurement"))
            if state
            else None
        )


class HBCRemainingEnergySensor(HBCMappedSensor):
    """Remaining battery energy in kWh."""

    _attr_device_class = SensorDeviceClass.ENERGY_STORAGE
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data.get(CONF_REMAINING_ENERGY_ENTITY)
        self.soc_source = entry.data[CONF_SOC_ENTITY]
        self.total_source = entry.data[CONF_TOTAL_ENERGY_ENTITY]
        super().__init__(
            hass,
            entry,
            "battery_remaining_capacity",
            "Battery Remaining Capacity",
            [self.source, self.soc_source, self.total_source],
        )

    @property
    def available(self) -> bool:
        if self.source:
            return self._source_available(self.source)
        return self._source_available(self.soc_source) and self._source_available(
            self.total_source
        )

    @property
    def native_value(self) -> float | None:
        if self.source:
            state = self._source_state(self.source)
            return (
                energy_to_kwh(state.state, state.attributes.get("unit_of_measurement"))
                if state
                else None
            )
        soc_state = self._source_state(self.soc_source)
        total_state = self._source_state(self.total_source)
        if not soc_state or not total_state:
            return None
        soc = soc_to_percent(soc_state.state, self.entry.data[CONF_SOC_SCALE])
        total = energy_to_kwh(
            total_state.state, total_state.attributes.get("unit_of_measurement")
        )
        return soc / 100 * total if soc is not None and total is not None else None


class HBCVoltageSensor(HBCMappedSensor):
    """Battery voltage, or zero when the source does not expose voltage."""

    _attr_device_class = SensorDeviceClass.VOLTAGE
    _attr_native_unit_of_measurement = UnitOfElectricPotential.VOLT
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data.get(CONF_VOLTAGE_ENTITY)
        super().__init__(
            hass, entry, "battery_voltage", "Battery Voltage", [self.source]
        )

    @property
    def available(self) -> bool:
        return not self.source or self._source_available(self.source)

    @property
    def native_value(self) -> float | None:
        if not self.source:
            return 0
        state = self._source_state(self.source)
        return (
            voltage_to_v(state.state, state.attributes.get("unit_of_measurement"))
            if state
            else None
        )


class HBCInverterMixin:
    """Shared inverter-state calculation."""

    source: str | None
    battery_power_source: str
    entry: ConfigEntry

    def _inverter_state(self) -> str | None:
        raw_state = self._source_state(self.source)
        power_state = self._source_state(self.battery_power_source)
        power = None
        if power_state:
            source_power = power_to_w(
                power_state.state, power_state.attributes.get("unit_of_measurement")
            )
            power = canonical_battery_power(
                source_power, self.entry.data[CONF_POWER_SIGN]
            )
        return canonical_inverter_state(raw_state.state if raw_state else None, power)


class HBCInverterStateSensor(HBCInverterMixin, HBCMappedSensor):
    """Canonical text inverter state."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data.get(CONF_INVERTER_STATE_ENTITY)
        self.battery_power_source = entry.data[CONF_BATTERY_POWER_ENTITY]
        super().__init__(
            hass,
            entry,
            "inverter_state",
            "Inverter State",
            [self.source, self.battery_power_source],
        )

    @property
    def available(self) -> bool:
        return self._source_available(self.source or self.battery_power_source)

    @property
    def native_value(self) -> str | None:
        return self._inverter_state()


class HBCInverterStateNumberSensor(HBCInverterMixin, HBCMappedSensor):
    """Fonske-compatible numeric inverter state."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.source = entry.data.get(CONF_INVERTER_STATE_ENTITY)
        self.battery_power_source = entry.data[CONF_BATTERY_POWER_ENTITY]
        super().__init__(
            hass,
            entry,
            "inverter_state_number",
            "Inverter State Number",
            [self.source, self.battery_power_source],
        )

    @property
    def available(self) -> bool:
        return self._source_available(self.source or self.battery_power_source)

    @property
    def native_value(self) -> int | None:
        return inverter_state_number(self._inverter_state())
