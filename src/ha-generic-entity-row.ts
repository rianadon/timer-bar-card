/* Simplified version of the hui-generic-entity-row.
 * This element acts as a stable base to create the timer entity row.
 */

import { css, html, TemplateResult } from "lit";
import { HomeAssistant } from "custom-card-helpers";
import { createEntityRow } from "card-tools/src/lovelace-element.js";
import { provideHass } from "card-tools/src/hass.js";
import { TimerBarEntityConfig } from "./types";
import { createActionHandler, createHandleAction } from "./helpers-actions";
import { computeEntityName } from "./helpers";

/** Each row's paper-buttons-row, reused across renders since provideHass can't be undone */
const paperButtonsCache = new WeakMap<object, { pbConfig: any, paperButtons: HTMLElement }>();

function createPaperButtons(host: object, pbConfig: any, position: string) {
  if (!pbConfig || pbConfig.position != position) return '';
  const cached = paperButtonsCache.get(host);
  if (cached && cached.pbConfig === pbConfig) return cached.paperButtons;

  const paperButtons = createEntityRow({
    type: "custom:paper-buttons-row",
    ...pbConfig
  });
  provideHass(paperButtons);
  paperButtonsCache.set(host, { pbConfig, paperButtons });
  return paperButtons;
}

export function genericEntityRow(host: object, children: TemplateResult, hass?: HomeAssistant, config?: TimerBarEntityConfig): TemplateResult {
  if (!hass || !config) return html``;
  const stateObj = config.entity ? hass.states[config.entity] : undefined;
  if (!stateObj && !config.name && !config.state) return html`<hui-warning>Entity ${config.entity} not found.  To use without an entity, specify name and state.</hui-warning>`;

  const name = computeEntityName(hass, stateObj, config.name);

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
      : ''}
    ${createPaperButtons(host, config.extend_paper_buttons_row, 'center')}
    ${children}
    ${createPaperButtons(host, config.extend_paper_buttons_row, 'right')}
  </div>`;
}

export const genericEntityRowStyles = css`
  .generic-entity-row {
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
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
