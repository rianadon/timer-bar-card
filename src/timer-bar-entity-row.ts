/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  CSSResultGroup,
  TemplateResult,
  css,
} from 'lit';
import { customElement, state, property } from "lit/decorators";
import { styleMap } from 'lit/directives/style-map';

import { HomeAssistant, hasConfigOrEntityChanged, secondsToDuration } from 'custom-card-helpers';
import { formatStartTime, isState, timerTimeRemaining, timerTimePercent } from './helpers';
import { TimerBarConfig, HassEntity } from './types';
import { PropertyValues } from 'lit-element';

export function fillConfig(config: TimerBarConfig) {
  return {
    active_state: ['active', 'manual', 'program'],
    pause_state: 'paused',
    waiting_state: 'waiting',
    bar_width: '70%',
    bar_height: '8px',
    text_width: '3.5em',
    bar_background: '#eee',
    bar_foreground: 'var(--mdc-theme-primary, #6200ee);',
    ...config,
  };
}

@customElement('timer-bar-entity-row')
export class TimerBarEntityRow extends LitElement {

  @property() public hass?: HomeAssistant;
  @property() public config!: TimerBarConfig;

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
      ...this.config,
      icon: this.config.active_icon ?? this.config.icon,
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
          <div class="status" style=${this._statusStyle()}>
            ${this._localize(state?.state)}
          </div>
          <div class="text-content" style=${this._textStyle()}>
            ${secondsToDuration(this._timeRemaining || 0)}
          </div>
        </hui-generic-entity-row>
      `;
    } else if (isState(state, this.config.waiting_state!)) {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${this.config}>
          <div class="status" style=${this._statusStyle(true)}>
            ${this._localize("Scheduled for")} ${formatStartTime(state)}
          </div>
        </hui-generic-entity-row>
      `;

    } else {
      return html`
        <hui-generic-entity-row .hass=${this.hass} .config=${this.config}>
          <div class="text-content">${this._localize(state?.state)}</div>
        </hui-generic-entity-row>
      `;
    }
  }

  private _renderBar(percent: number) {
    const containerStyle = styleMap({ width: this.config.bar_width });
    const bgStyle = this._barStyle('100%', this.config.bar_background!);
    const fgStyle = this._barStyle(percent+"%", this.config.bar_foreground!);
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
      height: this.config.bar_height,
    });
  }

  private _textStyle() {
    return styleMap({
      width: this.config.text_width,
      'text-align': 'right',
      'flex-shrink': '0',
    });
  }

  private _statusStyle(includeText?: boolean) {
    const conf = this.config;
    return styleMap({
      width: includeText ? `calc(${conf.bar_width} + ${conf.text_width})` : conf.bar_width,
      color: 'var(--secondary-text-color, #eee)',
    });
  }

  private _localize(content: string | undefined) {
    // TODO: Support languages other than English
    if (!content) return 'Undefined';
    if (content === 'idle') return 'Idle';
    if (content === 'paused') return 'Paused';
    return content[0].toUpperCase() + content.substring(1);
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
        align-items: center;
      }
      .bar { margin-top: 2px; }
    `;
  }
}
