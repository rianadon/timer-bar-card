/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  CSSResultGroup,
  TemplateResult,
  css,
} from 'lit';
import { state, property } from "lit/decorators";
import { styleMap } from 'lit/directives/style-map';

import { HomeAssistant, hasConfigOrEntityChanged, secondsToDuration, computeStateDisplay } from 'custom-card-helpers';
import { formatStartTime, isState, timerTimeRemaining, timerTimePercent } from './helpers';
import { TimerBarEntityConfig, HassEntity, Translations } from './types';
import { PropertyValues } from 'lit-element';

export function fillConfig(config: TimerBarEntityConfig) {
  return {
    active_state: ['active', 'on', 'manual', 'program', 'once_program'],
    pause_state: 'paused',
    waiting_state: 'waiting',
    end_time: { attribute: 'end_time' },
    start_time: { attribute: 'start_time' },
    duration: { attribute: 'duration' },
    bar_width: 'calc(70% - 7em)',
    bar_height: '8px',
    text_width: '3.5em',
    bar_background: '#eee',
    bar_foreground: 'var(--mdc-theme-primary, #6200ee);',
    ...config,
    translations: {
      scheduled_for: 'Scheduled for',
      once_program: 'Once Program',
      program: 'Program',
      manual: 'Manual',
      waiting: 'Waiting',
      ...config.translations,
    }
  };
}

function tryTranslate(hass: HomeAssistant, state: string) {
  if (state === 'idle') return hass.localize('component.timer.state._.idle');
  if (state === 'paused') return hass.localize('component.timer.state._.paused');
  if (state === 'active') return hass.localize('component.timer.state._.active');
  if (state === 'on') return hass.localize('component.switch.state._.on');
  return;
}

export function localize(hass: HomeAssistant, state: string, stateObj?: HassEntity, translations?: Translations) {
  if (translations && translations[state]) return translations[state];
  if (stateObj) {
    const translation = computeStateDisplay(hass.localize, stateObj, hass.locale!, state);
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

  protected render(): TemplateResult | void {
    const state = this.hass!.states[this.config.entity!];
    let percent = 0;
    if (state) percent = timerTimePercent(this.config, state) ?? 0;

    const activeConfig = {
      ...this.modConfig,
      icon: this.modConfig.active_icon ?? this.modConfig.icon,
    };

    if (isState(state, this.config.active_state!) && (this._timeRemaining||0) > 0) {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${activeConfig}>
          ${this._renderBar(percent)}
          <div class="text-content" style=${this._textStyle()}>
            ${secondsToDuration(this._timeRemaining || 0)}
          </div>
        </hui-generic-entity-row>
      `;
    } else if (isState(state, this.config.pause_state!)) {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${activeConfig}>
          <div class="status" style=${this._statusStyle()} @click=${this._handleClick}>
            ${localize(this.hass!, state.state, state)}
          </div>
          <div class="text-content" style=${this._textStyle()}>
            ${secondsToDuration(this._timeRemaining || 0)}
          </div>
        </hui-generic-entity-row>
      `;
    } else if (isState(state, this.config.waiting_state!)) {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${this.modConfig}>
          <div class="status" style=${this._statusStyle(true)} @click=${this._handleClick}>
            ${localize(this.hass!, "scheduled_for")} ${formatStartTime(state)}
          </div>
        </hui-generic-entity-row>
      `;

    } else {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${this.modConfig}>
          <div class="text-content">${localize(this.hass!, state.state, state)}</div>
        </hui-generic-entity-row>
      `;
    }
  }

  private _renderBar(percent: number) {
    const containerStyle = styleMap({ width: this.modConfig.bar_width, direction: this.modConfig.bar_direction });
    const bgStyle = this._barStyle('100%', this.modConfig.bar_background!);
    const fgStyle = this._barStyle(percent+"%", this.modConfig.bar_foreground!);
    return html`<div class="bar-container" style=${containerStyle} @click=${this._handleClick}>
      <div class="bar" style=${bgStyle}>
        <div style=${fgStyle}>
      </div>
    </div>`;
  }

  private _handleClick() {
    const e = new Event('hass-more-info', { composed: true }) as any;
    e.detail = { entityId: this.config.entity };
    this.dispatchEvent(e);
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) return false;
    if (changedProps.has('_timeRemaining')) return true;

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
    this._timeRemaining = timerTimeRemaining(this.config, stateObj);
  }

  private _barStyle(width: string, background: string) {
    return styleMap({
      width, background,
      height: this.modConfig.bar_height,
    });
  }

  private _textStyle() {
    return styleMap({
      width: this.modConfig.text_width,
      'flex-shrink': '0',
    });
  }

  private _statusStyle(includeText?: boolean) {
    const conf = this.modConfig;
    return styleMap({
      width: includeText ? `calc(${conf.bar_width} + ${conf.text_width})` : conf.bar_width,
      color: 'var(--secondary-text-color, #eee)',
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .bar-container {
        cursor: pointer;
        min-height: 1.5em;
        display: flex;
        flex-shrink: 0;
        align-items: center;
      }
      .bar { margin-top: 2px; }
      .status { cursor: pointer; line-height: 1.5em; flex-shrink: 0; }
      .text-content { text-align: right; text-align: end; }
    `;
  }

  private get modConfig(): TimerBarEntityConfig {
    if (!this.config.modifications) return this.config;

    const state = this.hass!.states[this.config.entity!];
    const percent = timerTimePercent(this.config, state) ?? 0;

    let config = this.config;
    for (const mod of this.config.modifications) {
      if (mod.greater_than_eq && percent >= mod.greater_than_eq
        || mod.greater_than && percent > mod.greater_than) {
        config = { ...config, ...mod };
      }
    }

    return config;
  }
}
