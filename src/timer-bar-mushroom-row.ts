/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, CSSResultGroup, TemplateResult, css, nothing } from 'lit';
import { property } from "lit/decorators.js";

import { computeDomain, computeRTL } from 'custom-card-helpers';
import { HassEntity, TimerBarConfig } from './types';
import { createActionHandler, createHandleAction } from './helpers-actions';
import { TimerBarEntityRow } from './timer-bar-entity-row';
import { defaultColorCss, defaultDarkColorCss, cardStyle, themeColorCss, themeVariables, isActive, domainIcon, computeRgbColor } from './lib/mushroom';

const computeObjectId = (entityId: string): string =>
  entityId.substring(entityId.indexOf(".") + 1);

const computeStateName = (stateObj: any): string =>
  stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, " ")
    : stateObj.attributes.friendly_name || "";

export class TimerBarMushroomRow extends TimerBarEntityRow {

  @property() public mushroom: any;

  protected _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    if (!this.hass) return html``;

    const warning = this._warning ? html`<hui-warning>${this._warning}</hui-warning>` : '';

    const rtl = computeRTL(this.hass);
    const state = this.hass!.states[this.config.entity!];
    const name = config.name ?? computeStateName(state);

    if (this.modConfig.layout === 'hide_name') config = {...config, name: ''};
    return html`
      <ha-card>
        <mushroom-card ?rtl=${rtl} .appearance=${this.appearance()}>
          <mushroom-state-item
          .appearance=${this.appearance()}
          ?rtl=${rtl}
          @action=${createHandleAction(this.hass, config)}
          .actionHandler=${createActionHandler(config)}
          >
            ${warning}
            ${this._renderIcon(state)}
            ${this._renderBadge(state)}
            <div class="container" slot="info">
              <span class="primary">${name}</span>
              <span class="secondary ${this.appearance().layout}">${contents}</span>
            </div>
          </mushroom-state-item>
        </mushroom-card>
        ${this._renderDebug()}
      </ha-card>`;
  }

  private _icon(stateObj: HassEntity) {
    if (this.config.icon) return this.config.icon
    if (stateObj.attributes.icon) return stateObj.attributes.icon;

    const domain = computeDomain(stateObj.entity_id);
    const state = stateObj.state;
    return domainIcon(domain, stateObj, state);
  }

  protected _renderIcon(stateObj: HassEntity): TemplateResult {
    const icon = this._icon(stateObj);
    const active = isActive(stateObj);
    let style = ''
    if (this.mushroom.icon_color) {
      const iconRgbColor = computeRgbColor(this.mushroom.icon_color);
      style += `--icon-color:rgb(${iconRgbColor});`;
      style += `--shape-color:rgba(${iconRgbColor}, 0.2);`;
    }
    return html`<mushroom-shape-icon slot="icon" .disabled=${!active} .icon=${icon} style=${style}></mushroom-shape-icon>`;
  }

  protected _renderBadge(stateObj: HassEntity) {
    return stateObj.state === "unavailable"
      ? html`<mushroom-badge-icon class="unavailable" slot="badge" icon="mdi:help"></mushroom-badge-icon>` : nothing;
  }

  private appearance() {
    // NOTE: Not all of these are used or implemented.
    return {
      layout: this.mushroom.layout ?? 'default',
      fill_container: this.mushroom.fill_container ?? false,
      primary_info: this.mushroom.primary_info ?? "name",
      secondary_info: this.mushroom.secondary_info ?? "state",
      icon_type: this.mushroom.icon_type ?? "icon"
    };
  }

  protected localize(state: HassEntity, _: boolean) {
    return super.localize(state, false)
  }

  static get styles(): CSSResultGroup {
    return [super.styles,
            css`
            :host {
                ${defaultColorCss}
            }
            :host([dark-mode]) {
                ${defaultDarkColorCss}
            }
            :host {
                ${themeColorCss}
                ${themeVariables}
            }
        `,
            cardStyle,
            css`
                mushroom-state-item {
                    cursor: pointer;
                }
                mushroom-shape-icon {
                    --icon-color: rgb(var(--rgb-state-entity));
                    --shape-color: rgba(var(--rgb-state-entity), 0.2);
                }
            .container {
                min-width: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .primary {
                font-weight: var(--card-primary-font-weight);
                font-size: var(--card-primary-font-size);
                line-height: var(--card-primary-line-height);
                color: var(--primary-text-color);
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
            }
            .secondary {
                font-weight: var(--card-secondary-font-weight);
                font-size: var(--card-secondary-font-size);
                line-height: var(--card-secondary-line-height);
                color: var(--secondary-text-color);
                text-overflow: ellipsis;
                overflow: hidden;
                white-space: nowrap;
                display: flex;
                flex-direction: row-reverse;
                justify-content: start;
                align-items: center;
            }
            .secondary.vertical { flex-direction: column-reverse; justify-content: center; }
            .secondary.vertical > .text-content { width: 100% !important; text-align: center; }
            .bar { margin-top: 0; }
            .bar-container { flex-grow: 1 }
            .text-content { text-align: start; }
        `, ];
    }
}
