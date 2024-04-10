/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { state, property } from "lit/decorators.js";
import { StyleInfo, styleMap } from 'lit/directives/style-map.js';

import { HomeAssistant, hasConfigOrEntityChanged, computeStateDisplay } from 'custom-card-helpers';
import { findDuration, formatStartTime, timerTimeRemaining, timerTimePercent, findMode, stateMode, autoMode, tryDurationToSeconds, MIN_SYNC_ERROR, MAX_FIX_SYNC_ERROR, gatherEntitiesFromConfig, haveEntitiesChanged } from './helpers';
import { TimerBarEntityConfig, HassEntity, Translations, TimerBarConfig, Mode } from './types';
import { genericEntityRow, genericEntityRowStyles } from './ha-generic-entity-row';
import { createActionHandler, createHandleAction } from './helpers-actions';
import formatTime, { formatFromResolution } from './format-time';

export function fillConfig(config: TimerBarEntityConfig): TimerBarConfig {
  return {
    active_state: ['active', 'on', 'manual', 'program', 'once_program'],
    pause_state: 'paused',
    waiting_state: 'waiting',
    guess_mode: false,
    end_time: { attribute: 'end_time' },
    start_time: { attribute: 'start_time' },
    duration: { attribute: 'duration' },
    remain_time: { attribute: 'remain_time' },
    sync_issues: 'show',
    bar_width: 'calc(70% - 7em)',
    bar_height: '8px',
    text_width: '3.5em',
    bar_background: '#eee',
    bar_foreground: 'var(--mdc-theme-primary, #6200ee);',
    bar_radius: '0',
    layout: 'normal',
    resolution: 'seconds',
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

function localize(hass: HomeAssistant, state: string, stateObj?: HassEntity, translations?: Translations, capitalize = true) {
  if (!state) return '';
  if (translations && translations[state]) return translations[state];
  if (stateObj) {
    const translation = computeStateDisplay(hass.localize, stateObj, hass.locale!, state);
    if (translation !== state) return capitalize ? translation : translation.toLowerCase();
  }
  const translation = tryTranslate(hass, state);
  if (translation) return capitalize ? translation : translation.toLowerCase();

  if (!capitalize) return state
  return state[0].toUpperCase() + state.substring(1);
}

export class TimerBarEntityRow extends LitElement {

  @property() public hass?: HomeAssistant;
  @property() public config!: TimerBarEntityConfig;

  @state() private _interval?: number;
  @state() private _timeRemaining?: number;
  @state() private _previousClockCorrection: number = 0;
  @state() private _browserClockCorrection: number = 0;
  @state() private _error?: Error;
  @state() protected _warning?: TemplateResult;

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    this._clearInterval();
  }

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.config) {
      const stateObj = this.hass?.states[this.config!.entity!];
      this._startInterval(stateObj);
    }
  }

  protected _mode(): Mode {
    return findMode(this.hass!, this.config, this._browserClockCorrection);
  }

  protected render(): TemplateResult | void {
    const state: HassEntity | undefined = this.hass!.states[this.config.entity!];
    if (this._error) return html`<hui-warning>${this._error.message}</hui-warning>`;

    let percent = 0;
    try {
      percent = timerTimePercent(this.hass!, this.config, state, this._browserClockCorrection) ?? 0;
    } catch (e) {
      return html`<hui-warning>${e}</hui-warning>`;
    }
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

    // Hide the pointer if tap action is none
    const pointer = activeConfig.tap_action?.action !== "none" ? "pointer" : "";

    switch (this._mode()) {
      case 'active':
        return this._renderRow(activeConfig, html`
        ${this._renderBar(percent)}
        ${this._renderTime(pointer)}
      `);

      case 'pause':
        return this._renderRow(activeConfig, html`
        ${this._renderStatus(pointer, '')}
        ${this._renderTime(pointer)}
      `);

      case 'waiting':
        return this._renderRow(this.modConfig, html`
        ${this._renderStatus(pointer, formatStartTime(this.hass!, this.config, state))}
      `);

      default:
        const textHidden = (this.modConfig.text_width && parseInt(this.modConfig.text_width) === 0);
        const style = textHidden ? 'visibility: hidden' : '';
        return this._renderRow(this.modConfig, html`
        <div class="text-content value ${pointer}" style=${style}
        @action=${createHandleAction(this.hass!, this.config)}
       .actionHandler=${createActionHandler(this.config)}
        >${this._renderState()}</div>
      `);
    }
  }

  protected _renderState(): string | TemplateResult {
    const state = this.hass!.states[this.config.entity!];
    const value = this.config.state?.fixed.replace(/^pause$/, 'paused') ?? state.state;
    return this.localize(value, state)
  }

  protected localize(value: string, state: HassEntity, capitalize = true) {
    return localize(this.hass!, value, state, this.config.translations, capitalize)
  }

  protected _renderRow(config: TimerBarConfig, contents: TemplateResult) {
    const warning = this._warning ? html`<hui-warning>${this._warning}</hui-warning>` : '';

    if (this.modConfig.full_row || this.modConfig.layout === 'full_row')
      return html`${warning}<div class="flex" @action=${createHandleAction(this.hass!, config)} .actionHandler=${createActionHandler(config)}> ${contents}</div>${this._renderDebug()}`;
    if (this.modConfig.layout === 'hide_name') config = { ...config, name: '' };
    return html`
      ${warning}
      ${genericEntityRow(contents, this.hass, config)}
      ${this._renderDebug()}
    `;
  }

  protected _renderTime(pointer: string) {
    const format = this.modConfig.format ? this.modConfig.format
      : formatFromResolution(this._timeRemaining || 0, this.modConfig.resolution!)
    return html`<div class="text-content value ${pointer}" style=${this._textStyle()}
      @action=${createHandleAction(this.hass!, this.config)}
      .actionHandler=${createActionHandler(this.config)}>
      ${formatTime(this._timeRemaining || 0, format)}
    </div>`;
  }

  protected _renderStatus(pointer: string, content: TemplateResult | string) {
    const state = this.hass!.states[this.config.entity!];
    const value = this.config.state?.fixed ?? state.state;
    return html`
      <div class="status ${pointer}" style=${this._statusStyle(!!content)}
        @action=${createHandleAction(this.hass!, this.config)}
        .actionHandler=${createActionHandler(this.config)}>
      ${this._renderState()}
      ${content}
    </div>`;
  }

  private get _bar_width() {
    if (this.modConfig.full_row || this.modConfig.layout === 'full_row') return `calc(100% - ${this.modConfig.text_width})`;
    if (this.modConfig.layout === 'hide_name') return 'auto';
    return this.modConfig.bar_width;
  }

  protected _renderBar(percent: number) {
    if (this.modConfig.invert) percent = 100 - percent; // invert if the options say so
    let style: StyleInfo = { width: this._bar_width, direction: this.modConfig.bar_direction };
    if (this.modConfig.layout === 'hide_name') style = { ...style, 'flex-grow': '1', 'margin-left': '8px' };
    const containerStyle = styleMap(style);
    const bgStyle = this._barStyle('100%', this.modConfig.bar_background!);
    const fgStyle = this._barStyle(percent + "%", this.modConfig.bar_foreground!);
    const pointer = this.config.tap_action?.action !== "none" ? "pointer" : "";
    return html`<div class="bar-container ${pointer}" style=${containerStyle}
      @action=${createHandleAction(this.hass!, this.config)}
      .actionHandler=${createActionHandler(this.config)}>
      <div class="bar" style=${bgStyle}>
        <div style=${fgStyle}>
      </div>
    </div>`;
  }

  protected _renderDebug() {
    if (!this.config.debug) return undefined;
    const state = this.hass!.states[this.config.entity!];

    let stMode: string = 'err'
    let guess_mode: string = 'err'
    let remaining: number | undefined
    let warn_active = false
    let aoMode: string = 'err'
    let duration: string = 'err'
    let err: string = ''

    try {
      guess_mode = this.config.guess_mode ? 'guessed' : 'explicit';
      remaining = this._mode() != 'idle' ? timerTimeRemaining(this.hass!, this.config, state, this._browserClockCorrection) : undefined
      warn_active = !!remaining && remaining > 0 && this._mode() != 'active';

      stMode = stateMode(this.hass!, this.config, this._browserClockCorrection) || 'N/A';
      aoMode = autoMode(this.hass!, this.config, this._browserClockCorrection) || 'N/A';
      duration = findDuration(this.hass!, this.config, state)
    } catch (e) {
      err = 'Error calculating duration:' + e
    }
    return html`<code>
      State: ${state?.state ?? 'No entity specified'} (state mode = ${stMode})<br>
      Mode: ${this._mode()} (${guess_mode}; guess mode produces ${aoMode})<br>
      Duration: ${duration} second<br>
      Time remaining: ${remaining}<br>
      Counter: ${this._timeRemaining}<br>
      ${warn_active ? html`<b>Did you set active_state?</b>` : ''}
      ${err ? err : ''}
      ${state ? html`<small>Attr: ${JSON.stringify(state.attributes)}</small>` : ''}      
    </code>`;
  }

  /** Check if Home Assistant and local time are out of sync */
  private _checkForSyncIssues(oldHass?: HomeAssistant) {
    if (!oldHass || !this.config.entity) return;
    const newState = this.hass!.states[this.config.entity];
    if (oldHass.states[this.config.entity] == newState) return;

    const homeAssistantAhead = Date.parse(newState.last_changed) - Date.now();
    if (this.config.sync_issues == 'show' && Math.abs(homeAssistantAhead) > MIN_SYNC_ERROR) {
      // Only show sync errors after the clock correction can be precisely measured twice.
      if (Math.abs(homeAssistantAhead - this._previousClockCorrection) < MIN_SYNC_ERROR) {
        this._warning = this._generateSyncWarning(homeAssistantAhead);
      }
      this._previousClockCorrection = homeAssistantAhead;
    } else if (this.config.sync_issues == 'fix' && Math.abs(homeAssistantAhead) < MAX_FIX_SYNC_ERROR) {
      this._browserClockCorrection = homeAssistantAhead;
    }
  }

  private _generateSyncWarning(homeAssistantAhead: number) {
    const phrase = homeAssistantAhead > 0 ? 'ahead of' : 'behind';
    const difference = Math.abs(homeAssistantAhead) / 1000;
    const message = `Detected sync issues: Home Assistant clock is ${difference}s ${phrase} app time.`;
    return html`${message} <a href="https://github.com/rianadon/timer-bar-card#sync-issues">Learn more.</a>`;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) return false;
    if (changedProps.has('_timeRemaining')) return true;
    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    this._checkForSyncIssues(oldHass)

    if (!oldHass || !this.hass) return true;
    const entities = gatherEntitiesFromConfig(this.config)
    return haveEntitiesChanged(entities, oldHass, this.hass)
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);

    if (changedProps.has("hass")) {
      const stateObj = this.hass!.states[this.config!.entity!];
      this._startInterval(stateObj);
    }
  }

  private _clearInterval(): void {
    if (this._interval) {
      window.clearInterval(this._interval);
      this._interval = undefined;
    }
  }

  private _startInterval(stateObj: HassEntity | undefined): void {
    this._clearInterval();
    this._calculateRemaining(stateObj);

    if (this._mode() === 'active') {
      this._interval = window.setInterval(
        () => this._calculateRemaining(stateObj),
        1000
      );
    }
  }

  private _calculateRemaining(stateObj: HassEntity | undefined): void {
    try {
      this._timeRemaining = this._mode() != 'idle' ? timerTimeRemaining(this.hass!, this.config, stateObj, this._browserClockCorrection) : undefined;
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
      'border-radius': this.modConfig.bar_radius,
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
      .bar { margin-top: 2px; overflow: hidden; }
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

  protected get modConfig(): TimerBarEntityConfig {
    if (!this.config.modifications) return this.config;

    const state: HassEntity | undefined = this.hass!.states[this.config.entity!];
    const remaining = (this._mode() != 'idle' ? timerTimeRemaining(this.hass!, this.config, state, this._browserClockCorrection) : undefined) ?? Infinity;
    const elapsed = (findDuration(this.hass!, this.config, state) ?? 0) - remaining;
    const percentElapsed = timerTimePercent(this.hass!, this.config, state, this._browserClockCorrection) ?? 0;
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
