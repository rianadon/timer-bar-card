/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { state, property } from "lit/decorators.js";
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { HomeAssistant, hasConfigOrEntityChanged, secondsToDuration, computeStateDisplay } from 'custom-card-helpers';
import { findDuration, formatStartTime, timerTimeRemaining, timerTimePercent, findMode, stateMode, autoMode, tryDurationToSeconds } from './helpers';
import { TimerBarEntityConfig, HassEntity, Translations, TimerBarConfig, Mode } from './types';
import { genericEntityRow, genericEntityRowStyles } from './ha-generic-entity-row';

export function fillConfig(config: TimerBarEntityConfig): TimerBarConfig {
  return {
    active_state: ['active', 'on', 'manual', 'program', 'once_program'],
    pause_state: 'paused',
    waiting_state: 'waiting',
    guess_mode: false,
    end_time: { attribute: 'end_time' },
    start_time: { attribute: 'start_time' },
    duration: { attribute: 'duration' },
    bar_width: 'calc(70% - 7em)',
    bar_height: '8px',
    text_width: '3.5em',
    bar_background: '#eee',
    bar_foreground: 'var(--mdc-theme-primary, #6200ee);',
    layout: 'normal',
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
  if (!state) return '';
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

  private _mode(): Mode {
    return findMode(this.hass!, this.config);
  }

  protected render(): TemplateResult | void {
    const state = this.hass!.states[this.config.entity!];
    if (this._error) return html`<hui-warning>${this._error.message}</hui-warning>`;

    let percent = 0;
    if (state) percent = timerTimePercent(this.hass!, this.config, state) ?? 0;
    if (percent > 100) percent = 100;

    let activeConfig: TimerBarEntityConfig
    try {
      activeConfig = {
        ...this.modConfig,
        icon: this.modConfig.active_icon ?? this.modConfig.icon,
      };
    } catch (e) {
      return html`<div>${e}</div>`
    }

    switch (this._mode()) {
      case 'active':
      return this._renderRow(activeConfig, html`
        ${this._renderBar(percent)}
        <div class="text-content" style=${this._textStyle()}>
          ${secondsToDuration(this._timeRemaining || 0)}
        </div>
      `);

      case 'pause':
      return this._renderRow(activeConfig, html`
        <div class="status pointer" style=${this._statusStyle()} @click=${this._handleClick}>
          ${localize(this.hass!, state.state, state, this.config.translations)}
        </div>
        <div class="text-content" style=${this._textStyle()}>
          ${secondsToDuration(this._timeRemaining || 0)}
        </div>
      `);

      case 'waiting':
      return this._renderRow(this.modConfig, html`
        <div class="status pointer" style=${this._statusStyle(true)} @click=${this._handleClick}>
          ${localize(this.hass!, "scheduled_for", undefined, this.config.translations)} ${formatStartTime(state)}
        </div>
      `);

      default:
      const textHidden = (this.modConfig.text_width && parseInt(this.modConfig.text_width) === 0);
      const style = textHidden ? 'visibility: hidden' : '';
      return this._renderRow(this.modConfig, html`
        <div class="text-content" style=${style}>${localize(this.hass!, state?.state, state, this.config.translations)}</div>
      `);
    }
  }

  private _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    if (this.modConfig.full_row || this.modConfig.layout === 'full_row') return html`<div class="flex">${contents}</div>${this._renderDebug()}`;

    if (this.modConfig.layout === 'hide_name') config = {...config, name: ''};
    return html`
      ${genericEntityRow(contents, this.hass, config)}
      ${this._renderDebug()}
    `;
  }

  private get _bar_width() {
    if (this.modConfig.full_row || this.modConfig.layout === 'full_row') return `calc(100% - ${this.modConfig.text_width})`;
    if (this.modConfig.layout === 'hide_name') return 'auto';
    return this.modConfig.bar_width;
  }

  private _renderBar(percent: number) {
    let style: StyleInfo = { width: this._bar_width, direction: this.modConfig.bar_direction };
    if (this.modConfig.layout === 'hide_name') style = { ...style, 'flex-grow': '1', 'margin-left': '8px' };
    const containerStyle = styleMap(style);
    const bgStyle = this._barStyle('100%', this.modConfig.bar_background!);
    const fgStyle = this._barStyle(percent+"%", this.modConfig.bar_foreground!);
    return html`<div class="bar-container pointer" style=${containerStyle} @click=${this._handleClick}>
      <div class="bar" style=${bgStyle}>
        <div style=${fgStyle}>
      </div>
    </div>`;
  }

  private _renderDebug() {
    if (!this.config.debug) return undefined;
    const state = this.hass!.states[this.config.entity!];
    if (!state) return html`<code>No state found</code>`;

    const auto_used = this.config.guess_mode ? 'used' : 'unused';
    const remaining = timerTimeRemaining(this.hass!, this.config, state);
    const warn_active = remaining && remaining > 0 && this._mode() != 'active';
    return html`<code>
      State: ${state.state} (state mode = ${stateMode(this.hass!, this.config) || 'N/A'})<br>
      Mode: ${this._mode()} (auto mode = ${autoMode(this.hass!, this.config) || 'N/A'}, ${auto_used})<br>
      Duration: ${findDuration(this.hass!, this.config, state)} second<br>
      Time remaining: ${remaining}<br>
      Counter: ${this._timeRemaining}<br>
      ${warn_active ? html`<b>Did you set active_state?</b>` : ''}
      <small>Attr: ${JSON.stringify(state.attributes)}</small>
    </code>`;
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

    if (this._mode() === 'active') {
      this._interval = window.setInterval(
        () => this._calculateRemaining(stateObj),
        1000
      );
    }
  }

  private _calculateRemaining(stateObj: HassEntity): void {
    try {
      this._timeRemaining = timerTimeRemaining(this.hass!, this.config, stateObj);
      this._error = undefined;
    } catch (e) {
      console.error(e);
      this._error = e as Error;
    }
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
    let width = this._bar_width;
    if (includeText) width = `calc(${this._bar_width} + ${this.modConfig.text_width})`;
    return styleMap({ width, color: 'var(--secondary-text-color, #eee)' });
  }

  static get styles(): CSSResultGroup {
    return [css`
      :host {
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .pointer { cursor: pointer; }
      .flex { display: flex; height: 40px; align-items: center; justify-content: flex-end; }
      .bar-container {
        min-height: 1.5em;
        display: flex;
        flex-shrink: 0;
        align-items: center;
      }
      .bar { margin-top: 2px; }
      .status { line-height: 1.5em; flex-shrink: 0; }
      .text-content { text-align: right; text-align: end; overflow: hidden; }
      code {
        display: block;
        background-color: var(--secondary-background-color);
        margin: 0.5em 0 0 0;
        padding: 0.7rem;
        font-size: 0.9em;
        word-break: break-all;
      }
    `, genericEntityRowStyles];
  }

  private get modConfig(): TimerBarEntityConfig {
    if (!this.config.modifications) return this.config;

    const state = this.hass!.states[this.config.entity!];
    const remaining = timerTimeRemaining(this.hass!, this.config, state) ?? Infinity;
    const elapsed = (findDuration(this.hass!, this.config, state) ?? 0) - remaining;
    const percentElapsed = timerTimePercent(this.hass!, this.config, state) ?? 0;
    const percentRemaining = 100 - percentElapsed

    let config = this.config;
    for (const mod of this.config.modifications) {
      // @ts-ignore. Warn on using old config syntax
      if (mod.greater_than_eq || mod.greater_than) {
        throw new Error('Mod format has changed! See the release notes and readme for details')
      }

      if (mod.remaining && typeof mod.remaining === 'string' && mod.remaining.endsWith('%')) {
        if (percentRemaining <= parseFloat(mod.remaining)) config = { ...config, ...mod };
      } else if (mod.remaining) {
        if (remaining <= tryDurationToSeconds(mod.remaining, 'remaining')) config = { ...config, ...mod };
      } else if (mod.elapsed && typeof mod.elapsed === 'string' && mod.elapsed.endsWith('%')) {
        if (percentElapsed >= parseFloat(mod.elapsed)) config = { ...config, ...mod };
      } else if (mod.elapsed) {
        if (elapsed >= tryDurationToSeconds(mod.elapsed, 'elapsed')) config = { ...config, ...mod };
      }
    }

    return config;
  }
}
