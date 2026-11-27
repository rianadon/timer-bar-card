import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { customElement, state, property, query } from "lit/decorators.js";

import { HomeAssistant, fireEvent } from 'custom-card-helpers';
import type { TimerBarConfig } from './types';
import { fillConfig } from './timer-bar-entity-row';
import { fillMushroomConfig } from './timer-bar-mushroom-row';

@customElement('timer-bar-editor')
export class TimerBarEditor extends LitElement {

  @property({ attribute: false }) public hass?: HomeAssistant;
  @state() private config!: TimerBarConfig;
  @query("ha-yaml-editor") _yamlEditor?: any;

  private yamlChange = false // true if the change came through the yaml editor
  // card-mod strips card_mod from the config passed to setConfig, stashes it here, and puts the stashed copy
  // back into every config-changed. Since this is a YAML editor, show card_mod and sync edits to the stash.
  declare private _cardModData?: { card?: unknown };

  setConfig(config: TimerBarConfig): void {
    if (this._cardModData?.card) config = { ...config, card_mod: this._cardModData.card };
    this.config = config;
    if (!this.yamlChange) {
      // YAML was changed externally, so update the editor
      this._yamlEditor?.setValue(config);
    }
    this.yamlChange = false;
  }

  protected render(): TemplateResult | void {
    if (!this.config) return html`loading...`
    return html`
<div class="instructions">For instructions, visit the <a href="https://github.com/rianadon/timer-bar-card#timer-bar-card" target="_blank">Timer Bar Card Examples and Docs</a>.</div>
      <div class="yaml-editor">
        <ha-yaml-editor
          .defaultValue=${this.config}
          autofocus
          .hass=${this.hass}
          @value-changed=${this._handleYAMLChanged}
          @keydown=${this._ignoreKeydown}
          dir="ltr"
        ></ha-yaml-editor>
      </div>
    `;
  }

  private _ignoreKeydown(ev: KeyboardEvent) {
    ev.stopPropagation();
  }

  private _handleYAMLChanged(ev: CustomEvent) {
    ev.stopPropagation();
    const config = ev.detail.value;
    if (ev.detail.isValid) {
      this.yamlChange = true
      this.config = config;
      if (this._cardModData) this._cardModData.card = config.card_mod;
      fireEvent(this, 'config-changed', { config: this.config });
    }
  }

  static styles = css`
  .instructions {
    margin-bottom: 8px;
  }
  .instructions a {
    color: var(--mdc-theme-primary,#6200ee);
  }
  `;
}
