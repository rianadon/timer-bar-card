/** Functions from the Mushroom Cards Project by Paul Bottein

    https://github.com/piitaya/lovelace-mushroom/
    Licensed under Apache 2.0
*/
import { HomeAssistant } from "custom-card-helpers";
import { html, TemplateResult } from "lit";
import { HassEntity } from "src/types";

export const UNAVAILABLE = "unavailable";
export const UNKNOWN = "unknown";

export function computeRgbColor(color: string): string {
  if (color === "primary" || color === "accent") {
    return `var(--rgb-${color}-color)`;
  }
  if (/^[a-z-]+$/.test(color)) {
    return `var(--rgb-${color})`; // a named color from the installed mushroom
  } else if (color.startsWith("#")) {
    const b = parseInt(color.substring(1), 16);
    if (isNaN(b)) return "";
    return [(b >> 16) & 255, (b >> 8) & 255, b & 255].join(", ");
  }
  return color;
}

const TIMESTAMP_STATE_DOMAINS = ["button", "input_button", "scene"];

export const INFOS = [
  "name",
  "state",
  "last-changed",
  "last-updated",
  "none",
] as const;
export type Info = (typeof INFOS)[number];

export function isAvailable(stateObj: HassEntity) {
  return stateObj.state !== UNAVAILABLE;
}

export function isUnknown(stateObj: HassEntity) {
  return stateObj.state === UNKNOWN;
}

export function computeInfoDisplay(
  info: Info,
  name: string,
  state: string | TemplateResult,
  stateObj: HassEntity,
  hass: HomeAssistant,
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
