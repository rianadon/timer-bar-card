/** Styles, icons, and functions from the Mushroom Cards Project by Paul Bottein

    https://github.com/piitaya/lovelace-mushroom/
    Licensed under Apache 2.0
*/
import { computeDomain, HomeAssistant } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';
import { css, html } from 'lit';

export const defaultColorCss = css`
    --default-red: 244, 67, 54;
    --default-pink: 233, 30, 99;
    --default-purple: 156, 39, 176;
    --default-deep-purple: 103, 58, 183;
    --default-indigo: 63, 81, 181;
    --default-blue: 33, 150, 243;
    --default-light-blue: 3, 169, 244;
    --default-cyan: 0, 188, 212;
    --default-teal: 0, 150, 136;
    --default-green: 76, 175, 80;
    --default-light-green: 139, 195, 74;
    --default-lime: 205, 220, 57;
    --default-yellow: 255, 235, 59;
    --default-amber: 255, 193, 7;
    --default-orange: 255, 152, 0;
    --default-deep-orange: 255, 87, 34;
    --default-brown: 121, 85, 72;
    --default-grey: 158, 158, 158;
    --default-blue-grey: 96, 125, 139;
    --default-black: 0, 0, 0;
    --default-white: 255, 255, 255;
    --default-disabled: 189, 189, 189;
`;


export const defaultDarkColorCss = css`
    --default-disabled: 111, 111, 111;
`;

export const themeVariables = css`
    --spacing: var(--mush-spacing, 12px);

    /* Title */
    --title-padding: var(--mush-title-padding, 24px 12px 16px);
    --title-spacing: var(--mush-title-spacing, 12px);
    --title-font-size: var(--mush-title-font-size, 24px);
    --title-font-weight: var(--mush-title-font-weight, normal);
    --title-line-height: var(--mush-title-line-height, 1.2);
    --subtitle-font-size: var(--mush-subtitle-font-size, 16px);
    --subtitle-font-weight: var(--mush-subtitle-font-weight, normal);
    --subtitle-line-height: var(--mush-subtitle-line-height, 1.2);

    /* Card */
    --card-primary-font-size: var(--mush-card-primary-font-size, 14px);
    --card-secondary-font-size: var(--mush-card-secondary-font-size, 12px);
    --card-primary-font-weight: var(--mush-card-primary-font-weight, bold);
    --card-secondary-font-weight: var(--mush-card-secondary-font-weight, bolder);
    --card-primary-line-height: var(--mush-card-primary-line-height, 1.5);
    --card-secondary-line-height: var(--mush-card-secondary-line-height, 1.5);

    /* Chips */
    --chip-spacing: var(--mush-chip-spacing, 8px);
    --chip-padding: var(--mush-chip-padding, 0 0.25em);
    --chip-height: var(--mush-chip-height, 36px);
    --chip-border-radius: var(--mush-chip-border-radius, 19px);
    --chip-border-width: var(--mush-chip-border-width, var(--ha-card-border-width, 1px));
    --chip-border-color: var(
        --mush-chip-border-color,
        var(--ha-card-border-color, var(--divider-color))
    );
    --chip-box-shadow: var(--mush-chip-box-shadow, var(--ha-card-box-shadow, "none"));
    --chip-font-size: var(--mush-chip-font-size, 0.3em);
    --chip-font-weight: var(--mush-chip-font-weight, bold);
    --chip-icon-size: var(--mush-chip-icon-size, 0.5em);
    --chip-avatar-padding: var(--mush-chip-avatar-padding, 0.1em);
    --chip-avatar-border-radius: var(--mush-chip-avatar-border-radius, 50%);
    --chip-background: var(
        --mush-chip-background,
        var(--ha-card-background, var(--card-background-color, white))
    );
    /* Controls */
    --control-border-radius: var(--mush-control-border-radius, 12px);
    --control-height: var(--mush-control-height, 42px);
    --control-button-ratio: var(--mush-control-button-ratio, 1);
    --control-icon-size: var(--mush-control-icon-size, 0.5em);

    /* Slider */
    --slider-threshold: var(--mush-slider-threshold);

    /* Input Number */
    --input-number-debounce: var(--mush-input-number-debounce);

    /* Layout */
    --layout-align: var(--mush-layout-align, center);

    /* Badge */
    --badge-size: var(--mush-badge-size, 16px);
    --badge-icon-size: var(--mush-badge-icon-size, 0.75em);
    --badge-border-radius: var(--mush-badge-border-radius, 50%);

    /* Icon */
    --icon-border-radius: var(--mush-icon-border-radius, 50%);
    --icon-size: var(--mush-icon-size, 42px);
    --icon-symbol-size: var(--mush-icon-symbol-size, 0.5em);
`;

export const themeColorCss = css`
    /* RGB */
    /* Standard colors */
    --rgb-red: var(--mush-rgb-red, var(--default-red));
    --rgb-pink: var(--mush-rgb-pink, var(--default-pink));
    --rgb-purple: var(--mush-rgb-purple, var(--default-purple));
    --rgb-deep-purple: var(--mush-rgb-deep-purple, var(--default-deep-purple));
    --rgb-indigo: var(--mush-rgb-indigo, var(--default-indigo));
    --rgb-blue: var(--mush-rgb-blue, var(--default-blue));
    --rgb-light-blue: var(--mush-rgb-light-blue, var(--default-light-blue));
    --rgb-cyan: var(--mush-rgb-cyan, var(--default-cyan));
    --rgb-teal: var(--mush-rgb-teal, var(--default-teal));
    --rgb-green: var(--mush-rgb-green, var(--default-green));
    --rgb-light-green: var(--mush-rgb-light-green, var(--default-light-green));
    --rgb-lime: var(--mush-rgb-lime, var(--default-lime));
    --rgb-yellow: var(--mush-rgb-yellow, var(--default-yellow));
    --rgb-amber: var(--mush-rgb-amber, var(--default-amber));
    --rgb-orange: var(--mush-rgb-orange, var(--default-orange));
    --rgb-deep-orange: var(--mush-rgb-deep-orange, var(--default-deep-orange));
    --rgb-brown: var(--mush-rgb-brown, var(--default-brown));
    --rgb-grey: var(--mush-rgb-grey, var(--default-grey));
    --rgb-blue-grey: var(--mush-rgb-blue-grey, var(--default-blue-grey));
    --rgb-black: var(--mush-rgb-black, var(--default-black));
    --rgb-white: var(--mush-rgb-white, var(--default-white));
    --rgb-disabled: var(--mush-rgb-disabled, var(--default-disabled));

    /* Action colors */
    --rgb-info: var(--mush-rgb-info, var(--rgb-blue));
    --rgb-success: var(--mush-rgb-success, var(--rgb-green));
    --rgb-warning: var(--mush-rgb-warning, var(--rgb-orange));
    --rgb-danger: var(--mush-rgb-danger, var(--rgb-red));

    /* State colors */
    --rgb-state-vacuum: var(--mush-rgb-state-vacuum, var(--rgb-teal));
    --rgb-state-fan: var(--mush-rgb-state-fan, var(--rgb-green));
    --rgb-state-light: var(--mush-rgb-state-light, var(--rgb-orange));
    --rgb-state-entity: var(--mush-rgb-state-entity, var(--rgb-blue));
    --rgb-state-media-player: var(--mush-rgb-state-media-player, var(--rgb-indigo));
    --rgb-state-lock: var(--mush-rgb-state-lock, var(--rgb-blue));
    --rgb-state-number: var(--mush-rgb-state-number, var(--rgb-blue));
    --rgb-state-humidifier: var(--mush-rgb-state-humidifier, var(--rgb-purple));

    /* State alarm colors */
    --rgb-state-alarm-disarmed: var(--mush-rgb-state-alarm-disarmed, var(--rgb-info));
    --rgb-state-alarm-armed: var(--mush-rgb-state-alarm-armed, var(--rgb-success));
    --rgb-state-alarm-triggered: var(--mush-rgb-state-alarm-triggered, var(--rgb-danger));

    /* State person colors */
    --rgb-state-person-home: var(--mush-rgb-state-person-home, var(--rgb-success));
    --rgb-state-person-not-home: var(--mush-rgb-state-person-not-home, var(--rgb-danger));
    --rgb-state-person-zone: var(--mush-rgb-state-person-zone, var(--rgb-info));
    --rgb-state-person-unknown: var(--mush-rgb-state-person-unknown, var(--rgb-grey));

    /* State update colors */
    --rgb-state-update-on: var(--mush-rgb-state-update-on, var(--rgb-orange));
    --rgb-state-update-off: var(--mush-rgb-update-off, var(--rgb-green));
    --rgb-state-update-installing: var(--mush-rgb-update-installing, var(--rgb-blue));

    /* State lock colors */
    --rgb-state-lock-locked: var(--mush-rgb-state-lock-locked, var(--rgb-green));
    --rgb-state-lock-unlocked: var(--mush-rgb-state-lock-unlocked, var(--rgb-red));
    --rgb-state-lock-pending: var(--mush-rgb-state-lock-pending, var(--rgb-orange));

    /* State cover colors */
    --rgb-state-cover-open: var(--mush-rgb-state-cover-open, var(--rgb-blue));
    --rgb-state-cover-closed: var(--mush-rgb-state-cover-closed, var(--rgb-disabled));

    /* State climate colors */
    --rgb-state-climate-auto: var(--mush-rgb-state-climate-auto, var(--rgb-green));
    --rgb-state-climate-cool: var(--mush-rgb-state-climate-cool, var(--rgb-blue));
    --rgb-state-climate-dry: var(--mush-rgb-state-climate-dry, var(--rgb-orange));
    --rgb-state-climate-fan-only: var(--mush-rgb-state-climate-fan-only, var(--rgb-teal));
    --rgb-state-climate-heat: var(--mush-rgb-state-climate-heat, var(--rgb-deep-orange));
    --rgb-state-climate-heat-cool: var(--mush-rgb-state-climate-heat-cool, var(--rgb-green));
    --rgb-state-climate-idle: var(--mush-rgb-state-climate-idle, var(--rgb-disabled));
    --rgb-state-climate-off: var(--mush-rgb-state-climate-off, var(--rgb-disabled));
`;

export const cardStyle = css`
    ha-card {
        box-sizing: border-box;
        padding: var(--spacing);
        display: flex;
        flex-direction: column;
        justify-content: var(--layout-align);
        height: auto;
    }
    ha-card.fill-container {
        height: 100%;
    }
    .actions {
        display: flex;
        flex-direction: row;
        align-items: flex-start;
        justify-content: flex-start;
        overflow-x: auto;
        overflow-y: hidden;
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* IE 10+ */
    }
    .actions::-webkit-scrollbar {
        background: transparent; /* Chrome/Safari/Webkit */
        height: 0px;
    }
    .actions *:not(:last-child) {
        margin-right: var(--spacing);
    }
    .actions[rtl] *:not(:last-child) {
        margin-right: initial;
        margin-left: var(--spacing);
    }
    .unavailable {
        --main-color: rgb(var(--rgb-warning));
    }
    .not-found {
        --main-color: rgb(var(--rgb-danger));
    }
    mushroom-state-item[disabled] {
        cursor: initial;
    }
`;

export const UNAVAILABLE = "unavailable";
export const UNKNOWN = "unknown";

export const ON = "on";
export const OFF = "off";

const OFF_STATES = [UNAVAILABLE, UNKNOWN, OFF];

export function isActive(stateObj: HassEntity) {
    /** https://github.com/piitaya/lovelace-mushroom/blob/f33c910b8863fa2229ee0a73e6fbf515f3bc2788/src/ha/data/entity.ts */
    const domain = computeDomain(stateObj.entity_id);
    const state = stateObj.state;

    if (["button", "input_button", "scene"].includes(domain)) {
      return state !== UNAVAILABLE;
    }

    if (OFF_STATES.includes(state)) {
      return false;
    }

    // Custom cases
    switch (domain) {
      case "cover":
        return !["closed", "closing"].includes(state);
      case "device_tracker":
      case "person":
        return state !== "not_home";
      case "media_player":
        return state !== "standby";
      case "vacuum":
        return !["idle", "docked", "paused"].includes(state);
      case "plant":
        return state === "problem";
      default:
        return true;
    }
  }

const DEFAULT_DOMAIN_ICON = "mdi:bookmark";

const FIXED_DOMAIN_ICONS = {
    air_quality: "mdi:air-filter",
    alert: "mdi:alert",
    calendar: "mdi:calendar",
    climate: "mdi:thermostat",
    configurator: "mdi:cog",
    conversation: "mdi:microphone-messafe",
    counter: "mdi:counter",
    demo: "mdi:home-assistant",
    google_assistant: "mdi:google-assistant",
    group: "mdi:google-circles-communities",
    homeassistant: "mdi:home-assistant",
    homekit: "mdi:home-automation",
    image_processing: "mdi:image-filter-frames",
    input_button: "mdi:gesture-tap-button",
    input_datetime: "mdi:calendar-clock",
    input_number: "mdi:ray-vertex",
    input_select: "mdi:format-list-bulleted",
    input_text: "mdi:form-textbox",
    light: "mdi:lightbulb",
    mailbox: "mdi:mailbox",
    notify: "mdi:comment-alert",
    number: "mdi:ray-vertex",
    persistent_notification: "mdi:bell",
    plant: "mdi:flower",
    proximity: "mdi:apple-safari",
    remote: "mdi:remote",
    scene: "mdi:palette",
    schedule: "mdi:calendar-clock",
    script: "mdi:script-text",
    select: "mdi:format-list-bulleted",
    sensor: "mdi:eye",
    simple_alarm: "mdi:bell",
    siren: "mdi:bullhorn",
    stt: "mdi:microphone-message",
    text: "mdi:form-text-box",
    timer: "mdi:timer-outline",
    tts: "mdi:speaker-message",
    updater: "mdi:cloud-upload",
    vacuum: "mdi:robot-vacuum",
    zone: "mdi:map-marker-radius",
};

export const alarmPanelIcon = (state?: string) => {
    switch (state) {
        case "armed_away":
            return "mdi:shield-lock";
        case "armed_vacation":
            return "mdi:shield-airplane";
        case "armed_home":
            return "mdi:shield-home";
        case "armed_night":
            return "mdi:shield-moon";
        case "armed_custom_bypass":
            return "mdi:security";
        case "pending":
        case "arming":
            return "mdi:shield-sync";
        case "triggered":
            return "mdi:bell-ring";
        case "disarmed":
            return "mdi:shield-off";
        default:
            return "mdi:shield";
    }
};

export const alarmPanelIconAction = (state?: string) => {
    switch (state) {
        case "armed_away":
            return "mdi:shield-lock-outline";
        case "armed_vacation":
            return "mdi:shield-airplane-outline";
        case "armed_home":
            return "mdi:shield-home-outline";
        case "armed_night":
            return "mdi:shield-moon-outline";
        case "armed_custom_bypass":
            return "mdi:shield-half-full";
        case "disarmed":
            return "mdi:shield-off-outline";
        default:
            return "mdi:shield-outline";
    }
};

export const coverIcon = (state?: string, stateObj?: HassEntity): string => {
    const open = state !== "closed";

    switch (stateObj?.attributes.device_class) {
        case "garage":
            switch (state) {
                case "opening":
                    return "mdi:arrow-up-box";
                case "closing":
                    return "mdi:arrow-down-box";
                case "closed":
                    return "mdi:garage";
                default:
                    return "mdi:garage-open";
            }
        case "gate":
            switch (state) {
                case "opening":
                case "closing":
                    return "mdi:gate-arrow-right";
                case "closed":
                    return "mdi:gate";
                default:
                    return "mdi:gate-open";
            }
        case "door":
            return open ? "mdi:door-open" : "mdi:door-closed";
        case "damper":
            return open ? "mdi:circle" : "mdi:circle-slice-8";
        case "shutter":
            switch (state) {
                case "opening":
                    return "mdi:arrow-up-box";
                case "closing":
                    return "mdi:arrow-down-box";
                case "closed":
                    return "mdi:window-shutter";
                default:
                    return "mdi:window-shutter-open";
            }
        case "curtain":
            switch (state) {
                case "opening":
                    return "mdi:arrow-split-vertical";
                case "closing":
                    return "mdi:arrow-collapse-horizontal";
                case "closed":
                    return "mdi:curtains-closed";
                default:
                    return "mdi:curtains";
            }
        case "blind":
            switch (state) {
                case "opening":
                    return "mdi:arrow-up-box";
                case "closing":
                    return "mdi:arrow-down-box";
                case "closed":
                    return "mdi:blinds-horizontal-closed";
                default:
                    return "mdi:blinds-horizontal";
            }
        case "shade":
            switch (state) {
                case "opening":
                    return "mdi:arrow-up-box";
                case "closing":
                    return "mdi:arrow-down-box";
                case "closed":
                    return "mdi:roller-shade-closed";
                default:
                    return "mdi:roller-shade";
            }
        case "window":
            switch (state) {
                case "opening":
                    return "mdi:arrow-up-box";
                case "closing":
                    return "mdi:arrow-down-box";
                case "closed":
                    return "mdi:window-closed";
                default:
                    return "mdi:window-open";
            }
    }

    switch (state) {
        case "opening":
            return "mdi:arrow-up-box";
        case "closing":
            return "mdi:arrow-down-box";
        case "closed":
            return "mdi:window-closed";
        default:
            return "mdi:window-open";
    }
};

export const binarySensorIcon = (state?: string, stateObj?: HassEntity) => {
    const isOff = state === "off";
    switch (stateObj?.attributes.device_class) {
        case "battery":
            return isOff ? "mdi:battery" : "mdi:battery-outline";
        case "battery_charging":
            return isOff ? "mdi:battery" : "mdi:battery-charging";
        case "carbon_monoxide":
            return isOff ? "mdi:smoke-detector" : "mdi:smoke-detector-alert";
        case "cold":
            return isOff ? "mdi:thermometer" : "mdi:snowflake";
        case "connectivity":
            return isOff ? "mdi:close-network-outline" : "mdi:check-network-outline";
        case "door":
            return isOff ? "mdi:door-closed" : "mdi:door-open";
        case "garage_door":
            return isOff ? "mdi:garage" : "mdi:garage-open";
        case "power":
            return isOff ? "mdi:power-plug-off" : "mdi:power-plug";
        case "gas":
        case "problem":
        case "safety":
        case "tamper":
            return isOff ? "mdi:check-circle" : "mdi:alert-circle";
        case "smoke":
            return isOff ? "mdi:smoke-detector-variant" : "mdi:smoke-detector-variant-alert";
        case "heat":
            return isOff ? "mdi:thermometer" : "mdi:fire";
        case "light":
            return isOff ? "mdi:brightness-5" : "mdi:brightness-7";
        case "lock":
            return isOff ? "mdi:lock" : "mdi:lock-open";
        case "moisture":
            return isOff ? "mdi:water-off" : "mdi:water";
        case "motion":
            return isOff ? "mdi:motion-sensor-off" : "mdi:motion-sensor";
        case "occupancy":
            return isOff ? "mdi:home-outline" : "mdi:home";
        case "opening":
            return isOff ? "mdi:square" : "mdi:square-outline";
        case "plug":
            return isOff ? "mdi:power-plug-off" : "mdi:power-plug";
        case "presence":
            return isOff ? "mdi:home-outline" : "mdi:home";
        case "running":
            return isOff ? "mdi:stop" : "mdi:play";
        case "sound":
            return isOff ? "mdi:music-note-off" : "mdi:music-note";
        case "update":
            return isOff ? "mdi:package" : "mdi:package-up";
        case "vibration":
            return isOff ? "mdi:crop-portrait" : "mdi:vibrate";
        case "window":
            return isOff ? "mdi:window-closed" : "mdi:window-open";
        default:
            return isOff ? "mdi:radiobox-blank" : "mdi:checkbox-marked-circle";
    }
};

export const computeOpenIcon = (stateObj: HassEntity): string => {
    switch (stateObj.attributes.device_class) {
        case "awning":
        case "curtain":
        case "door":
        case "gate":
            return "mdi:arrow-expand-horizontal";
        default:
            return "mdi:arrow-up";
    }
};

export const computeCloseIcon = (stateObj: HassEntity): string => {
    switch (stateObj.attributes.device_class) {
        case "awning":
        case "curtain":
        case "door":
        case "gate":
            return "mdi:arrow-collapse-horizontal";
        default:
            return "mdi:arrow-down";
    }
};

const FIXED_DEVICE_CLASS_ICONS = {
    apparent_power: "mdi:flash",
    aqi: "mdi:air-filter",
    atmospheric_pressure: "mdi:thermometer-lines",
    // battery: "mdi:battery", => not included by design since `sensorIcon()` will dynamically determine the icon
    carbon_dioxide: "mdi:molecule-co2",
    carbon_monoxide: "mdi:molecule-co",
    current: "mdi:current-ac",
    data_rate: "mdi:transmission-tower",
    data_size: "mdi:database",
    date: "mdi:calendar",
    distance: "mdi:arrow-left-right",
    duration: "mdi:progress-clock",
    energy: "mdi:lightning-bolt",
    frequency: "mdi:sine-wave",
    gas: "mdi:meter-gas",
    humidity: "mdi:water-percent",
    illuminance: "mdi:brightness-5",
    irradiance: "mdi:sun-wireless",
    moisture: "mdi:water-percent",
    monetary: "mdi:cash",
    nitrogen_dioxide: "mdi:molecule",
    nitrogen_monoxide: "mdi:molecule",
    nitrous_oxide: "mdi:molecule",
    ozone: "mdi:molecule",
    pm1: "mdi:molecule",
    pm10: "mdi:molecule",
    pm25: "mdi:molecule",
    power: "mdi:flash",
    power_factor: "mdi:angle-acute",
    precipitation: "mdi:weather-rainy",
    precipitation_intensity: "mdi:weather-pouring",
    pressure: "mdi:gauge",
    reactive_power: "mdi:flash",
    signal_strength: "mdi:wifi",
    sound_pressure: "mdi:ear-hearing",
    speed: "mdi:speedometer",
    sulphur_dioxide: "mdi:molecule",
    temperature: "mdi:thermometer",
    timestamp: "mdi:clock",
    volatile_organic_compounds: "mdi:molecule",
    voltage: "mdi:sine-wave",
    volume: "mdi:car-coolant-level",
    water: "mdi:water",
    weight: "mdi:weight",
    wind_speed: "mdi:weather-windy",
};

const SENSOR_DEVICE_CLASS_BATTERY = "battery";

const BATTERY_ICONS = {
    10: "mdi:battery-10",
    20: "mdi:battery-20",
    30: "mdi:battery-30",
    40: "mdi:battery-40",
    50: "mdi:battery-50",
    60: "mdi:battery-60",
    70: "mdi:battery-70",
    80: "mdi:battery-80",
    90: "mdi:battery-90",
    100: "mdi:battery",
};
const BATTERY_CHARGING_ICONS = {
    10: "mdi:battery-charging-10",
    20: "mdi:battery-charging-20",
    30: "mdi:battery-charging-30",
    40: "mdi:battery-charging-40",
    50: "mdi:battery-charging-50",
    60: "mdi:battery-charging-60",
    70: "mdi:battery-charging-70",
    80: "mdi:battery-charging-80",
    90: "mdi:battery-charging-90",
    100: "mdi:battery-charging",
};

const batteryStateIcon = (stateObj: HassEntity, batteryChargingEntity?: HassEntity) => {
    const battery = stateObj.state;
    const batteryCharging = batteryChargingEntity?.state === "on";

    return batteryIcon(battery, batteryCharging);
};

export const batteryIcon = (batteryState: number | string, batteryCharging?: boolean) => {
    const batteryValue = Number(batteryState);
    if (isNaN(batteryValue)) {
        if (batteryState === "off") {
            return "mdi:battery";
        }
        if (batteryState === "on") {
            return "mdi:battery-alert";
        }
        return "mdi:battery-unknown";
    }

    const batteryRound = Math.round(batteryValue / 10) * 10;
    if (batteryCharging && batteryValue >= 10) {
        return BATTERY_CHARGING_ICONS[batteryRound];
    }
    if (batteryCharging) {
        return "mdi:battery-charging-outline";
    }
    if (batteryValue <= 5) {
        return "mdi:battery-alert-variant-outline";
    }
    return BATTERY_ICONS[batteryRound];
};

export const UNIT_C = "°C";
export const UNIT_F = "°F";

export const sensorIcon = (entity?: HassEntity): string | undefined => {
    const dclass = entity?.attributes.device_class;

    if (dclass && dclass in FIXED_DEVICE_CLASS_ICONS) {
        return FIXED_DEVICE_CLASS_ICONS[dclass];
    }

    if (dclass === SENSOR_DEVICE_CLASS_BATTERY) {
        return entity ? batteryStateIcon(entity) : "mdi:battery";
    }

    const unit = entity?.attributes.unit_of_measurement;
    if (unit === UNIT_C || unit === UNIT_F) {
        return "mdi:thermometer";
    }

    return undefined;
};



export function domainIcon(domain: string, stateObj?: HassEntity, state?: string): string {
    const compareState = state !== undefined ? state : stateObj?.state;

    switch (domain) {
        case "alarm_control_panel":
            return alarmPanelIcon(compareState);

        case "automation":
            return compareState === "off" ? "mdi:robot-off" : "mdi:robot";

        case "binary_sensor":
            return binarySensorIcon(compareState, stateObj);

        case "button":
            switch (stateObj?.attributes.device_class) {
                case "restart":
                    return "mdi:restart";
                case "update":
                    return "mdi:package-up";
                default:
                    return "mdi:gesture-tap-button";
            }

        case "camera":
            return compareState === "off" ? "mdi:video-off" : "mdi:video";

        case "cover":
            return coverIcon(compareState, stateObj);

        case "device_tracker":
            if (stateObj?.attributes.source_type === "router") {
                return compareState === "home" ? "mdi:lan-connect" : "mdi:lan-disconnect";
            }
            if (["bluetooth", "bluetooth_le"].includes(stateObj?.attributes.source_type)) {
                return compareState === "home" ? "mdi:bluetooth-connect" : "mdi:bluetooth";
            }
            return compareState === "not_home" ? "mdi:account-arrow-right" : "mdi:account";

        case "fan":
            return compareState === "off" ? "mdi:fan-off" : "mdi:fan";

        case "humidifier":
            return compareState && compareState === "off"
                ? "mdi:air-humidifier-off"
                : "mdi:air-humidifier";

        case "input_boolean":
            return compareState === "on" ? "mdi:check-circle-outline" : "mdi:close-circle-outline";

        case "input_datetime":
            if (!stateObj?.attributes.has_date) {
                return "mdi:clock";
            }
            if (!stateObj.attributes.has_time) {
                return "mdi:calendar";
            }
            break;

        case "lock":
            switch (compareState) {
                case "unlocked":
                    return "mdi:lock-open";
                case "jammed":
                    return "mdi:lock-alert";
                case "locking":
                case "unlocking":
                    return "mdi:lock-clock";
                default:
                    return "mdi:lock";
            }

        case "media_player":
            switch (stateObj?.attributes.device_class) {
                case "speaker":
                    switch (compareState) {
                        case "playing":
                            return "mdi:speaker-play";
                        case "paused":
                            return "mdi:speaker-pause";
                        case "off":
                            return "mdi:speaker-off";
                        default:
                            return "mdi:speaker";
                    }
                case "tv":
                    switch (compareState) {
                        case "playing":
                            return "mdi:television-play";
                        case "paused":
                            return "mdi:television-pause";
                        case "off":
                            return "mdi:television-off";
                        default:
                            return "mdi:television";
                    }
                case "receiver":
                    switch (compareState) {
                        case "off":
                            return "mdi:audio-video-off";
                        default:
                            return "mdi:audio-video";
                    }
                default:
                    switch (compareState) {
                        case "playing":
                        case "paused":
                            return "mdi:cast-connected";
                        case "off":
                            return "mdi:cast-off";
                        default:
                            return "mdi:cast";
                    }
            }

        case "person":
            return compareState === "not_home" ? "mdi:account-arrow-right" : "mdi:account";

        case "switch":
            switch (stateObj?.attributes.device_class) {
                case "outlet":
                    return compareState === "on" ? "mdi:power-plug" : "mdi:power-plug-off";
                case "switch":
                    return compareState === "on"
                        ? "mdi:toggle-switch-variant"
                        : "mdi:toggle-switch-variant-off";
                default:
                    return "mdi:toggle-switch-variant";
            }

        case "sensor": {
            const icon = sensorIcon(stateObj);
            if (icon) {
                return icon;
            }

            break;
        }

        case "sun":
            return stateObj?.state === "above_horizon"
                ? "mdi:white-balance-sunny"
                : "mdi:weather-night";

        case "switch_as_x":
            return "mdi:swap-horizontal";

        case "threshold":
            return "mdi:chart-sankey";

        case "update":
            return "mdi:package"
            // return stateObj?.state === "on"
                // ? updateIsInstalling(stateObj as UpdateEntity)
                    // ? "mdi:package-down"
                    // : "mdi:package-up"
                // : "mdi:package";

        case "water_heater":
            return compareState === "off" ? "mdi:water-boiler-off" : "mdi:water-boiler";

        // case "weather":
            // return weatherIcon(stateObj?.state);
    }

    if (domain in FIXED_DOMAIN_ICONS) {
        return FIXED_DOMAIN_ICONS[domain];
    }

    return DEFAULT_DOMAIN_ICON;
}

export const COLORS = [
    "primary",
    "accent",
    "red",
    "pink",
    "purple",
    "deep-purple",
    "indigo",
    "blue",
    "light-blue",
    "cyan",
    "teal",
    "green",
    "light-green",
    "lime",
    "yellow",
    "amber",
    "orange",
    "deep-orange",
    "brown",
    "grey",
    "blue-grey",
    "black",
    "white",
    "disabled",
];

export function computeRgbColor(color: string): string {
    if (color === "primary" || color === "accent") {
        return `var(--rgb-${color}-color)`;
    }
    if (COLORS.includes(color)) {
        return `var(--rgb-${color})`;
    } else if (color.startsWith("#")) {
        const b = parseInt(color.substring(1), 16);
        if (isNaN(b)) return ""
        return [(b >> 16) & 255, (b >> 8) & 255, b & 255].join(", ")
    }
    return color;
}

const TIMESTAMP_STATE_DOMAINS = ["button", "input_button", "scene"];

export const INFOS = ["name", "state", "last-changed", "last-updated", "none"] as const;
export type Info = (typeof INFOS)[number];

export const ICON_TYPES = ["icon", "entity-picture", "none"] as const;
export type IconType = (typeof ICON_TYPES)[number];

export function isAvailable(stateObj: HassEntity) {
    return stateObj.state !== UNAVAILABLE;
}

export function isOff(stateObj: HassEntity) {
    return stateObj.state === OFF;
}

export function isUnknown(stateObj: HassEntity) {
    return stateObj.state === UNKNOWN;
}

export function computeInfoDisplay(
    info: Info,
    name: string,
    state: string,
    stateObj: HassEntity,
    hass: HomeAssistant
) {
    switch (info) {
        case "name":
            return name;
        case "state":
            const domain = stateObj.entity_id.split(".")[0];
            if (
                (stateObj.attributes.device_class === "timestamp" ||
                    TIMESTAMP_STATE_DOMAINS.includes(domain)) &&
                isAvailable(stateObj) &&
                !isUnknown(stateObj)
            ) {
                return html`
                    <ha-relative-time
                        .hass=${hass}
                        .datetime=${stateObj.state}
                        capitalize
                    ></ha-relative-time>
                `;
            } else {
                return state;
            }
        case "last-changed":
            return html`
                <ha-relative-time
                    .hass=${hass}
                    .datetime=${stateObj.last_changed}
                    capitalize
                ></ha-relative-time>
            `;
        case "last-updated":
            return html`
                <ha-relative-time
                    .hass=${hass}
                    .datetime=${stateObj.last_updated}
                    capitalize
                ></ha-relative-time>
            `;
        case "none":
            return undefined;
    }
}
