import { LitElement, html, TemplateResult } from 'lit';
import { customElement, state, property } from "lit/decorators";
import { styleMap } from 'lit/directives/style-map';

import { HomeAssistant, hasConfigOrEntityChanged } from 'custom-card-helpers';

import { fillConfig, TimerBarEntityRow } from './timer-bar-entity-row';

import type { TimerBarConfig, TimerBarEntityConfig, AttributeConfig } from './types';
import { isState } from './helpers';
import { PropertyValues } from 'lit-element';

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'timer-bar-card',
  name: 'Timer Bar Card',
  description: 'Display timer-related information as a progress bar',
});

window.customElements.define('timer-bar-entity-row', TimerBarEntityRow);

@customElement('timer-bar-card')
export class TimerBarCard extends LitElement {

  @property() public hass?: HomeAssistant;
  @state() private config!: TimerBarConfig;

  public static getStubConfig(): object {
    return {};
  }

  setConfig(config: TimerBarConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this.config = fillConfig(config);
  }

  protected render(): TemplateResult | void {
    const config = this.config;
    if (config.entity && config.entities) {
      return html`<hui-warning>Both entity and entities cannot be defined</hui-warning>`;
    }

    if (config.entity) {
      return html`<timer-bar-entity-row .config=${config} .hass=${this.hass}></timer-bar-entity-row>`
    } else if (config.entities) {
      const header = (config.name && !config.header_entity) ? config.name : undefined;
      return html`<ha-card header=${header}>
        <div class="card-content">
          ${config.header_entity ? this._renderTitle() : null}
          ${this._renderContent()}
        </div>
      </ha-card>`;
    } else {
      return html`<hui-warning>Neither entity nor entities are defined</hui-warning>`;
    }
  }

  private _hasEntityChanged(oldHass: HomeAssistant, ...entities: (string | AttributeConfig | TimerBarEntityConfig | undefined)[]) {
    for (const entity of entities) {
      if (!entity) continue;
      if (typeof entity === 'string') {
        if (oldHass.states[entity] !== this.hass!.states[entity]) return true;
      } else if ('entity' in entity) {
        if (entity.entity && oldHass.states[entity.entity] !== this.hass!.states[entity.entity]) return true;
      }
    }
    return false;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) return false;
    if (changedProps.has('config')) return true;
    if (this.config.entity) {
      return hasConfigOrEntityChanged(this, changedProps, false);
    }

    this.updateComplete.then(() => this._patchFontSize());

    const oldHass = changedProps.get('hass') as HomeAssistant | undefined;
    if (!oldHass) return true;

    for (const entity of this._filteredEntities()) {
      if (this._hasEntityChanged(oldHass, entity)) return true;
    }

    if (this._hasEntityChanged(oldHass, this.config.header_entity,
        this.config.duration, this.config.start_time, this.config.end_time)) return true;

    return false;
  }

  private _renderContent(): TemplateResult[] {
    return this._filteredEntities().map(entity => {
      const style = this.config.compressed ? { height: '36px' } : {};
      let config = { ...this.config, entity, name: '' };
      // Merge in per-entity configuration
      if (typeof entity !== 'string') config = { ...config, ...entity };
      return html`<timer-bar-entity-row
                    .config=${config}
                    .hass=${this.hass}
                    style=${styleMap(style)}
                  ></timer-bar-entity-row>`;
    });
  }

  private _renderTitle(): TemplateResult {
    const style = this._filteredEntities().length > 0 ? { 'margin-bottom': '12px' } : {};
    const config = { entity: this.config.header_entity, secondary_info: this.config.header_secondary};
    return html`<hui-generic-entity-row
                  style=${styleMap(style)}
                  .config=${config}
                  .hass=${this.hass}
                ></generic-entity-header>`;
  }

  private _patchFontSize() {
    const element = this.renderRoot.querySelector('hui-generic-entity-row');
    const info = element?.shadowRoot?.querySelector('.info');
    if (!info) return;

    const nodes = [...info.childNodes];
    const textNodes = nodes.filter(c => {
      return c.nodeType === Node.TEXT_NODE && c.textContent!.trim();
    });
    if (textNodes[0]) {
      const span = document.createElement("span");
      span.style.fontSize = '1.1em';
      info.insertBefore(span, textNodes[0]);
      info.removeChild(textNodes[0]);
      span.appendChild(textNodes[0]);
    }
  }

  private _entitiesOfState(entities: (string|TimerBarEntityConfig)[], state: string | string[]) {
    return entities.filter(e =>
      isState(this.hass!.states[(typeof e === 'string') ? e : e.entity!], state));
  }

  private _filteredEntities() {
    if (!this.config.filter || !this.hass) return this.config.entities!;

    return this._entitiesOfState(this.config.entities!, this.config.active_state!)
      .concat(this._entitiesOfState(this.config.entities!, this.config.pause_state!))
      .concat(this._entitiesOfState(this.config.entities!, this.config.waiting_state!))
    ;
  }

  public async getCardSize(): Promise<number> {
    if (this.config.entity) return 1;

    let size = 0;
    if (this.config.header_entity)
      size += 1;
    else if (this.config.name)
      size += 2;

    return size + this._filteredEntities().length;
  }
}
