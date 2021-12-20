/* Simplified version of the hui-generic-entity-row.
 * This element acts as a stable base to create the timer entity row.
 */

import { css, html, TemplateResult } from "lit";
import { ActionHandlerEvent, HomeAssistant, handleAction, hasAction } from "custom-card-helpers";
import { actionHandler } from "./ha-action-handler-directive";
import { TimerBarEntityConfig } from "./types";

const computeObjectId = (entityId: string): string =>
  entityId.substr(entityId.indexOf(".") + 1);

const computeStateName = (stateObj: any): string =>
  stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, " ")
    : stateObj.attributes.friendly_name || "";

export function genericEntityRow(children: TemplateResult, hass?: HomeAssistant, config?: TimerBarEntityConfig): TemplateResult {
  if (!hass || !config) return html``;
  const stateObj = config.entity ? hass.states[config.entity] : undefined;
  if (!stateObj) return html`<hui-warning>Entity ${config.entity} not found</hui-warning>`;

  const name = config.name || computeStateName(stateObj);

  const _handleAction = (ev: ActionHandlerEvent) => {
    handleAction(ev.target as any, hass!, config!, ev.detail.action!);
  }

  return html`<div class="generic-entity-row">
    <state-badge
      class="pointer"
      .hass=${hass}
      .stateObj=${stateObj}
      .overrideIcon=${config.icon}
      .overrideImage=${config.image}
      .stateColor=${config.state_color}
      @action=${_handleAction}
      .actionHandler=${actionHandler({
        hasHold: hasAction(config!.hold_action),
        hasDoubleClick: hasAction(config!.double_tap_action),
      })}
      tabindex="0"
    ></state-badge>
    <div
      class="info pointer"
      @action=${_handleAction}
      .actionHandler=${actionHandler({
        hasHold: hasAction(config!.hold_action),
        hasDoubleClick: hasAction(config!.double_tap_action),
      })}
      .title=${name}
    >
      ${name}
    </div>
    ${children}
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
