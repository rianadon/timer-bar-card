/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  html,
  CSSResultGroup,
  TemplateResult,
  css,
  nothing,
  PropertyValues,
} from "lit";
import { property } from "lit/decorators.js";

import { computeRTL, HomeAssistant } from "custom-card-helpers";
import { computeEntityName } from "./helpers";
import {
  HassEntity,
  Mushroom,
  TimerBarConfig,
  TimerBarEntityConfig,
} from "./types";
import { createActionHandler, createHandleAction } from "./helpers-actions";
import { TimerBarEntityRow, fillConfig } from "./timer-bar-entity-row";
import {
  computeRgbColor,
  computeInfoDisplay,
} from "./lib/mushroom";

const computeDarkMode = (hass: HomeAssistant | undefined) =>
  hass && !!(hass.themes as any).darkMode;

/** Style for outer timer bar card */
export function mushroomStyle(mushroom: Mushroom) {
  if (mushroom.fill_container) return "height: 100%";
  return;
}

function barColors(mushroom: Mushroom) {
  let color = "var(--rgb-state-entity)";
  if (mushroom.icon_color) color = computeRgbColor(mushroom.icon_color);
  if (mushroom.color) color = computeRgbColor(mushroom.color);
  return { bar_background: `rgba(${color}, 0.2)`, bar_foreground: `rgb(${color})` };
}

export function fillMushroomConfig(
  config: TimerBarEntityConfig,
  mushroom: Mushroom,
): TimerBarConfig {
  return {
    ...fillConfig(config),
    ...barColors(mushroom),
    bar_radius: "2px",
    // Horizontal layouts: bar fills the space left over by the text unless bar_width is given
    ...(mushroom.layout === "vertical" ? {} : { bar_width: "100%" }),
    translations: config.translations,
    ...config,
    // Mushroom options in a modification add to the card's and recolor the bar
    modifications: config.modifications?.map((mod) => {
      if (!mod.mushroom) return mod;
      const modMushroom = { ...mushroom, ...mod.mushroom };
      return { ...barColors(modMushroom), ...mod, mushroom: modMushroom };
    }),
  };
}

export class TimerBarMushroomRow extends TimerBarEntityRow {
  @property() public mushroom: Mushroom = {};

  @property({ reflect: true, type: String })
  public layout: string | undefined;

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

  protected createRenderRoot() {
    const root = super.createRenderRoot() as ShadowRoot;
    // Style the row like the installed mushroom's entity card (theme colors, card style, keyframes)
    // and its name/state text, so it matches mushroom cards and card_mod recipes for them (e.g. `animation: spin`) work
    const sources = ["mushroom-entity-card", "mushroom-state-info"];
    Promise.all(sources.map((el) => customElements.whenDefined(el))).then((elements: any[]) => {
      const mushroom = elements.map((el) => el.elementStyles.map((s: any) => s.styleSheet));
      root.adoptedStyleSheets = [...[].concat(...mushroom), ...root.adoptedStyleSheets];
    });
    return root;
  }

  protected get _innerActions(): boolean {
    return false; // mushroom-state-item handles all actions
  }

  protected _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    if (!this.hass) return html``;

    const warning = this._warning
      ? html`<hui-warning>${this._warning}</hui-warning>`
      : "";

    const rtl = computeRTL(this.hass);
    const state = this.hass!.states[this.config.entity!];
    const name = computeEntityName(this.hass, state, config.name);

    if (this.modConfig.layout === "hide_name") config = { ...config, name: "" };

    const appearance = this.appearance();
    const primary = computeInfoDisplay(
      appearance.primary_info,
      name,
      super._renderState(),
      state,
      this.hass,
    );

    return html` <ha-card
      class=${appearance.fill_container ? "fill-container" : ""}
    >
      <mushroom-card ?rtl=${rtl} .appearance=${appearance}>
        <mushroom-state-item
          .appearance=${appearance}
          ?rtl=${rtl}
          @action=${createHandleAction(this.hass, config)}
          .actionHandler=${createActionHandler(config)}
        >
          ${warning} ${this._renderIcon(state, config.icon)} ${this._renderBadge(state)}
          <div class="container" slot="info">
            <span class="primary">${primary}</span>
            <span class="secondary ${this.appearance().layout}"
              >${contents}</span
            >
          </div>
        </mushroom-state-item>
      </mushroom-card>
      ${this._renderDebug()}
    </ha-card>`;
  }

  protected _renderState() {
    const state = this.hass!.states[this.config.entity!];
    const name = computeEntityName(this.hass, state, this.config.name);
    const appearance = this.appearance();
    const stateStr = super._renderState();
    return computeInfoDisplay(
      appearance.secondary_info,
      name,
      stateStr,
      state,
      this.hass!,
    ) as TemplateResult;
  }

  protected _renderIcon(stateObj: HassEntity, icon?: string): TemplateResult {
    const active = this._mode() == "active";
    const mushroom = this.modConfig.mushroom ?? this.mushroom;
    let style = "";
    if (mushroom.icon_color || mushroom.color) {
      const iconRgbColor = computeRgbColor(
        mushroom.color! || mushroom.icon_color!,
      );
      style += `--icon-color:rgb(${iconRgbColor});`;
      style += `--shape-color:rgba(${iconRgbColor}, 0.2);`;
    }
    return html`<mushroom-shape-icon
      slot="icon"
      .disabled=${!active}
      style=${style}
    >
      <ha-state-icon
        .hass=${this.hass}
        .stateObj=${stateObj}
        .state=${stateObj}
        .icon=${icon}
      ></ha-state-icon>
    </mushroom-shape-icon>`;
  }

  protected _renderBadge(stateObj: HassEntity) {
    return stateObj.state === "unavailable"
      ? html`<mushroom-badge-icon
          class="unavailable"
          slot="badge"
          icon="mdi:help"
        ></mushroom-badge-icon>`
      : nothing;
  }

  private appearance() {
    // NOTE: Not all of these are used or implemented.
    return {
      layout: this.mushroom.layout ?? "default",
      fill_container: this.mushroom.fill_container ?? false,
      primary_info: this.mushroom.primary_info ?? "name",
      secondary_info: this.mushroom.secondary_info ?? "state",
      icon_type: this.mushroom.icon_type ?? "icon",
    };
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host([layout="grid"]) {
          height: 100%;
        }
        .secondary {
          display: flex;
          flex-direction: row-reverse;
          justify-content: start;
          align-items: center;
        }
        .secondary.vertical {
          flex-direction: column-reverse;
          justify-content: center;
        }
        .secondary.vertical > .text-content {
          width: 100% !important;
          text-align: center;
        }
        .bar {
          margin-top: 0;
        }
        .bar-icon {
          inset-block: 0;
        }
        /* bar and status take bar_width (100%) but must leave room for the time */
        .bar-container,
        .status {
          flex-shrink: 1;
          min-width: 0;
        }
        .text-content {
          text-align: start;
        }
        .text-content.auto-width {
          /* the time sits left of the bar here (row-reverse), so pad the other side */
          padding-inline: 0 8px;
        }
        .secondary.vertical > .text-content.auto-width {
          padding: 0;
        }
      `,
    ];
  }
}
