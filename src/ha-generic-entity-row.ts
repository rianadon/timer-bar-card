/* Simplified version of the hui-generic-entity-row.
 * This element acts as a stable base to create the timer entity row.
 */

import { css, html, TemplateResult } from "lit";
import { HomeAssistant } from "custom-card-helpers";
import { createEntityRow } from "node_modules/card-tools/src/lovelace-element.js";
import { provideHass } from "node_modules/card-tools/src/hass.js";
import { TimerBarEntityConfig } from "./types";
import { createActionHandler, createHandleAction } from "./helpers-actions";

const computeObjectId = (entityId: string): string =>
  entityId.substring(entityId.indexOf(".") + 1);

const computeStateName = (stateObj: any): string =>
  stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, " ")
    : stateObj.attributes.friendly_name || "";

function createPaperButtons(pbConfig: any, position: string) {
  if (!pbConfig || pbConfig.position != position) return '';
  const paperButtons = createEntityRow({
      type: "custom:paper-buttons-row",
      ...pbConfig
  });
  provideHass(paperButtons);
  return paperButtons;
}

export function genericEntityRow(children: TemplateResult, hass?: HomeAssistant, config?: TimerBarEntityConfig): TemplateResult {
  if (!hass || !config) return html``;
  const stateObj = config.entity ? hass.states[config.entity] : undefined;
  if (!stateObj) return html`<hui-warning>Entity ${config.entity} not found</hui-warning>`;

  const name = config.name ?? computeStateName(stateObj);

  // Hide the pointer if tap action is none
  const pointer = config.tap_action?.action !== "none" ? "pointer" : "";

  return html`<div class="generic-entity-row">
    <state-badge
      class="${pointer}"
      .hass=${hass}
      .stateObj=${stateObj}
      .overrideIcon=${config.icon}
      .overrideImage=${config.image}
      .stateColor=${config.state_color}
      tabindex="${pointer ? "0" : undefined}"
      @action=${createHandleAction(hass, config)}
      .actionHandler=${createActionHandler(config)}
    ></state-badge>
    ${name
      ? html`<div class="info ${pointer}" .title=${name}
        @action=${createHandleAction(hass, config)}
        .actionHandler=${createActionHandler(config)}
        >${name}</div>`
      : html`<div class="info"></div>` /* info element must be present to take up space */ }
    ${createPaperButtons(config.extend_paper_buttons_row, 'center')}
    ${children}
    ${createPaperButtons(config.extend_paper_buttons_row, 'right')}
  </div>`;
}

export const genericEntityRowStyles = css`
  .generic-entity-row {
    display: flex;
    align-items: center;
    flex-direction: row;
  }
  .info {
    margin-left: 16px;
    margin-right: 8px;
    flex: 1 1 30%;
  }
  .info,
  .info > * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  state-badge {
    flex: 0 0 40px;
  }
`;
