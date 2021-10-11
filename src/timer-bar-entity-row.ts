/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, CSSResultGroup, TemplateResult, css } from "lit";
import { state, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  secondsToDuration,
  computeStateDisplay,
} from "custom-card-helpers";
import {
  findDuration,
  formatStartTime,
  isState,
  timerTimeRemaining,
  timerTimePercent,
  usesLastChanged,
} from "./helpers";
import {
  TimerBarEntityConfig,
  HassEntity,
  Translations,
  TimerBarConfig,
  Mode,
} from "./types";
import { PropertyValues } from "lit-element";

export function fillConfig(config: TimerBarEntityConfig) {
  return {
    active_state: ["active", "on", "manual", "program", "once_program"],
    pause_state: "paused",
    waiting_state: "waiting",
    guess_mode: false,
    end_time: { attribute: "end_time" },
    start_time: { attribute: "start_time" },
    duration: { attribute: "duration" },
    bar_width: "calc(70% - 7em)",
    bar_height: "8px",
    text_width: "3.5em",
    bar_background: "#eee",
    bar_foreground: "var(--mdc-theme-primary, #6200ee);",
    ...config,
    translations: {
      scheduled_for: "Scheduled for",
      once_program: "Once Program",
      program: "Program",
      manual: "Manual",
      waiting: "Waiting",
      ...config.translations,
    },
  };
}

function tryTranslate(hass: HomeAssistant, state: string) {
  if (state === "idle") return hass.localize("component.timer.state._.idle");
  if (state === "paused")
    return hass.localize("component.timer.state._.paused");
  if (state === "active")
    return hass.localize("component.timer.state._.active");
  if (state === "on") return hass.localize("component.switch.state._.on");
  return;
}

export function localize(
  hass: HomeAssistant,
  state: string,
  stateObj?: HassEntity,
  translations?: Translations
) {
  if (!state) return "";
  if (translations && translations[state]) return translations[state];
  if (stateObj) {
    const translation = computeStateDisplay(
      hass.localize,
      stateObj,
      hass.locale!,
      state
    );
    if (translation !== state) return translation;
  }
  const translation = tryTranslate(hass, state);
  if (translation) return translation;

  return state[0].toUpperCase() + state.substring(1);
}

export class TimerBarEntityRow extends LitElement {
  @property() public hass?: HomeAssistant;
  @property() public config!: TimerBarEntityConfig;

  @state() private _interval?: number;
  @state() private _timeRemaining?: number;
  @state() private _error?: Error;

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearInterval();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.config && this.config.entity) {
      const stateObj = this.hass?.states[this.config!.entity];
      if (stateObj) {
        this._startInterval(stateObj);
      }
    }
  }

  private _autoMode(): Mode | undefined {
    // Not applicable if the entity uses the last changed attribute, since this changes every
    // state change, not necessarily only when the entity turns active.
    const state = this.hass!.states[this.config.entity!];
    if (usesLastChanged(this.hass!, this.config, state)) return undefined;

    // Auto mode is not capable of determining whether the entity is paused or waiting
    const stateMode = this._stateMode();
    if (stateMode === "pause" || stateMode === "waiting") return undefined;

    const duration = findDuration(this.hass!, this.config, state);
    const remaining = timerTimeRemaining(this.hass!, this.config, state);
    if (!duration || !remaining) return undefined;
    if (remaining >= 0 && remaining <= duration) return "active";
    return undefined;
  }

  private _stateMode(): Mode {
    const state = this.hass!.states[this.config.entity!];
    if (
      isState(state, this.config.active_state!) &&
      (this._timeRemaining || 0) > 0
    )
      return "active";
    if (isState(state, this.config.pause_state!)) return "pause";
    if (isState(state, this.config.waiting_state!)) return "waiting";
    return "idle";
  }

  private _mode(): Mode {
    if (this.config.guess_mode) return this._autoMode() || this._stateMode();
    return this._stateMode();
  }

  protected render(): TemplateResult | void {
    const state = this.hass!.states[this.config.entity!];
    if (this._error)
      return html`<hui-warning>${this._error.message}</hui-warning>`;

    let percent = 0;
    if (state) percent = timerTimePercent(this.hass!, this.config, state) ?? 0;
    if (percent > 100) percent = 100;

    const activeConfig = {
      ...this.modConfig,
      icon: this.modConfig.active_icon ?? this.modConfig.icon,
    };

    switch (this._mode()) {
      case "active":
        return this._renderRow(
          activeConfig,
          html`
            ${this._renderBar(percent)}
            <div class="text-content" style=${this._textStyle()}>
              ${secondsToDuration(this._timeRemaining || 0)}
            </div>
          `
        );

      case "pause":
        return this._renderRow(
          activeConfig,
          html`
            <div
              class="status"
              style=${this._statusStyle()}
              @click=${this._handleClick}
            >
              ${localize(
                this.hass!,
                state.state,
                state,
                this.config.translations
              )}
            </div>
            <div class="text-content" style=${this._textStyle()}>
              ${secondsToDuration(this._timeRemaining || 0)}
            </div>
          `
        );

      case "waiting":
        return this._renderRow(
          this.modConfig,
          html`
            <div
              class="status"
              style=${this._statusStyle(true)}
              @click=${this._handleClick}
            >
              ${localize(
                this.hass!,
                "scheduled_for",
                undefined,
                this.config.translations
              )}
              ${formatStartTime(state)}
            </div>
          `
        );

      default:
        const textHidden =
          this.modConfig.text_width &&
          parseInt(this.modConfig.text_width) === 0;
        const style = textHidden ? "visibility: hidden" : "";
        return this._renderRow(
          this.modConfig,
          html`
            <div class="text-content" style=${style}>
              ${localize(
                this.hass!,
                state?.state,
                state,
                this.config.translations
              )}
            </div>
          `
        );
    }
  }

  private _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    if (this.modConfig.full_row)
      return html`<div class="flex">${contents}</div>
        ${this._renderDebug()}`;
    return html`
      <hui-generic-entity-row .hass=${this.hass} .config=${config}>
        ${contents}
      </hui-generic-entity-row>
      ${this._renderDebug()}
    `;
  }

  private get _bar_width() {
    if (this.modConfig.full_row)
      return `calc(100% - ${this.modConfig.text_width})`;
    return this.modConfig.bar_width;
  }

  private _renderBar(percent: number) {
    const containerStyle = styleMap({
      width: this._bar_width,
      direction: this.modConfig.bar_direction,
    });
    const bgStyle = this._barStyle("100%", this.modConfig.bar_background!);
    const fgStyle = this._barStyle(
      percent + "%",
      this.modConfig.bar_foreground!
    );
    return html`<div
      class="bar-container"
      style=${containerStyle}
      @click=${this._handleClick}
    >
      <div class="bar" style=${bgStyle}>
        <div style=${fgStyle}></div>
      </div>
    </div>`;
  }

  private _renderDebug() {
    if (!this.config.debug) return undefined;
    const state = this.hass!.states[this.config.entity!];
    if (!state) return html`<code>No state found</code>`;

    const auto_used = this.config.guess_mode ? "used" : "unused";
    return html`<code>
      State: ${state.state} (state mode = ${this._stateMode() || "N/A"})<br />
      Mode: ${this._mode()} (auto mode = ${this._autoMode() || "N/A"},
      ${auto_used})<br />
      Duration: ${findDuration(this.hass!, this.config, state)} second<br />
      Time remaining: ${timerTimeRemaining(this.hass!, this.config, state)}<br />
      Counter: ${this._timeRemaining}<br />
      <small>Attr: ${JSON.stringify(state.attributes)}</small>
    </code>`;
  }

  private _handleClick() {
    const e = new Event("hass-more-info", { composed: true }) as any;
    e.detail = { entityId: this.config.entity };
    this.dispatchEvent(e);
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) return false;
    if (changedProps.has("_timeRemaining")) return true;

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if (changedProps.has("hass")) {
      const stateObj = this.hass!.states[this.config!.entity!];
      const oldHass = changedProps.get("hass") as HomeAssistant;
      const oldStateObj = oldHass?.states[this.config!.entity!];

      if (oldStateObj !== stateObj) {
        this._startInterval(stateObj);
      } else if (!stateObj) {
        this._clearInterval();
      }
    }
  }

  private _clearInterval(): void {
    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private _startInterval(stateObj: HassEntity): void {
    this._clearInterval();
    this._calculateRemaining(stateObj);

    if (isState(stateObj, this.config.active_state!)) {
      this._interval = window.setInterval(
        () => this._calculateRemaining(stateObj),
        1000
      );
    }
  }

  private _calculateRemaining(stateObj: HassEntity): void {
    try {
      this._timeRemaining = timerTimeRemaining(
        this.hass!,
        this.config,
        stateObj
      );
      this._error = undefined;
    } catch (e) {
      console.error(e);
      this._error = e as Error;
    }
  }

  private _barStyle(width: string, background: string) {
    return styleMap({
      width,
      background,
      height: this.modConfig.bar_height,
    });
  }

  private _textStyle() {
    return styleMap({
      width: this.modConfig.text_width,
      "flex-shrink": "0",
    });
  }

  private _statusStyle(includeText?: boolean) {
    let width = this._bar_width;
    if (includeText)
      width = `calc(${this._bar_width} + ${this.modConfig.text_width})`;
    return styleMap({ width, color: "var(--secondary-text-color, #eee)" });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .flex {
        display: flex;
        height: 40px;
        align-items: center;
        justify-content: flex-end;
      }
      .bar-container {
        cursor: pointer;
        min-height: 1.5em;
        display: flex;
        flex-shrink: 0;
        align-items: center;
      }
      .bar {
        margin-top: 2px;
      }
      .status {
        cursor: pointer;
        line-height: 1.5em;
        flex-shrink: 0;
      }
      .text-content {
        text-align: right;
        text-align: end;
        overflow: hidden;
      }
      code {
        display: block;
        background-color: var(--secondary-background-color);
        margin: 0.5em 0 0 0;
        padding: 0.7rem;
        font-size: 0.9em;
        word-break: break-all;
      }
    `;
  }

  private get modConfig(): TimerBarEntityConfig {
    if (!this.config.modifications) return this.config;

    const state = this.hass!.states[this.config.entity!];
    const percent = timerTimePercent(this.hass!, this.config, state) ?? 0;

    let config = this.config;
    for (const mod of this.config.modifications) {
      if (
        (mod.greater_than_eq && percent >= mod.greater_than_eq) ||
        (mod.greater_than && percent > mod.greater_than)
      ) {
        config = { ...config, ...mod };
      }
    }

    return config;
  }
}
