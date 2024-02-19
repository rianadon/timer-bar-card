/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, CSSResultGroup, TemplateResult, css, nothing, PropertyValues } from 'lit';
import { property } from "lit/decorators.js";

import { computeRTL, HomeAssistant } from 'custom-card-helpers';
import { HassEntity, Mushroom, TimerBarConfig, TimerBarEntityConfig } from './types';
import { createActionHandler, createHandleAction } from './helpers-actions';
import { TimerBarEntityRow, fillConfig } from './timer-bar-entity-row';
import { defaultColorCss, defaultDarkColorCss, cardStyle, themeColorCss, themeVariables, computeRgbColor, computeInfoDisplay } from './lib/mushroom';

const computeObjectId = (entityId: string): string =>
  entityId.substring(entityId.indexOf(".") + 1);

const computeStateName = (stateObj: any): string =>
  stateObj.attributes.friendly_name === undefined
    ? computeObjectId(stateObj.entity_id).replace(/_/g, " ")
  : stateObj.attributes.friendly_name || "";

const computeDarkMode = (hass: HomeAssistant|undefined) =>
  hass && !!(hass.themes as any).darkMode

/** Style for outer timer bar card */
export function mushroomStyle(mushroom: Mushroom) {
  if (mushroom.fill_container) return 'height: 100%'
  return
}

export function fillMushroomConfig(config: TimerBarEntityConfig, mushroom: Mushroom): TimerBarConfig {
  let color = 'var(--rgb-state-entity)'
  if (mushroom.icon_color) color = computeRgbColor(mushroom.icon_color)
  if (mushroom.color) color = computeRgbColor(mushroom.color)
  return {
    ...fillConfig(config),
    bar_background: `rgba(${color}, 0.2)`,
    bar_foreground: `rgb(${color})`,
    bar_radius: '2px',
    translations: config.translations,
    ...config
  };
}

export class TimerBarMushroomRow extends TimerBarEntityRow {

  @property() public mushroom: Mushroom = {};

  protected updated(changedProps: PropertyValues): void {
    // This function comes from base-element.ts in mushroom cards
    super.updated(changedProps);
    if (changedProps.has("hass") && this.hass) {
      const currentDarkMode = computeDarkMode(changedProps.get("hass"));
      const newDarkMode = computeDarkMode(this.hass);
      if (currentDarkMode !== newDarkMode) {
        this.toggleAttribute("dark-mode", newDarkMode);
      }
    }
  }

  protected _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    if (!this.hass) return html``;

    const warning = this._warning ? html`<hui-warning>${this._warning}</hui-warning>` : '';

    const rtl = computeRTL(this.hass);
    const state = this.hass!.states[this.config.entity!];
    const name = config.name ?? computeStateName(state);

    if (this.modConfig.layout === 'hide_name') config = {...config, name: ''};

    const appearance = this.appearance()
    const primary = computeInfoDisplay(appearance.primary_info, name,
                                       this.localize(state, false), state, this.hass);

    return html`
      <ha-card class=${appearance.fill_container ? "fill-container": ""}>
        <mushroom-card ?rtl=${rtl} .appearance=${appearance}>
          <mushroom-state-item
          .appearance=${appearance}
          ?rtl=${rtl}
          @action=${createHandleAction(this.hass, config)}
          .actionHandler=${createActionHandler(config)}
          >
            ${warning}
            ${this._renderIcon(state)}
            ${this._renderBadge(state)}
            <div class="container" slot="info">
              <span class="primary">${primary}</span>
              <span class="secondary ${this.appearance().layout}">${contents}</span>
            </div>
          </mushroom-state-item>
        </mushroom-card>
        ${this._renderDebug()}
      </ha-card>`;
  }

  protected _renderState(state: HassEntity) {
    const name = this.config.name ?? computeStateName(state);
    const appearance = this.appearance()
    const stateStr = this.localize(state, false)
    return computeInfoDisplay(appearance.secondary_info, name,
                              stateStr, state, this.hass!) as TemplateResult;
  }

  protected _renderIcon(stateObj: HassEntity): TemplateResult {
    const icon = this.config.icon;
    const active = this._mode() == 'active'
    let style = ''
    if (this.mushroom.icon_color || this.mushroom.color) {
      const iconRgbColor = computeRgbColor(this.mushroom.color! || this.mushroom.icon_color!);
      style += `--icon-color:rgb(${iconRgbColor});`;
      style += `--shape-color:rgba(${iconRgbColor}, 0.2);`;
    }
    return html`<mushroom-shape-icon slot="icon" .disabled=${!active} style=${style}>
      <ha-state-icon .hass=${this.hass} .stateObj=${stateObj} .state=${stateObj} .icon=${icon}></ha-state-icon>
    </mushroom-shape-icon>`;
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
