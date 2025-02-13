import { LitElement, css, html, TemplateResult, PropertyValues } from 'lit';
import { customElement, state, property } from "lit/decorators.js";
import { styleMap } from 'lit/directives/style-map.js';

import { HomeAssistant, hasConfigOrEntityChanged } from 'custom-card-helpers';

import { fillConfig, TimerBarEntityRow } from './timer-bar-entity-row';
import { fillMushroomConfig, TimerBarMushroomRow, mushroomStyle } from './timer-bar-mushroom-row';

import type { TimerBarConfig, TimerBarEntityConfig, AttributeConfig, Mode } from './types';
import { findMode, gatherEntitiesFromConfig, haveEntitiesChanged, parseDuration } from './helpers'; // Import parseDuration
import { version } from '../package.json';

// ... (rest of the imports and initial setup as before) ...
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'timer-bar-card',
  name: 'Timer Bar Card',
  description: 'Display timer-related information as a progress bar',
});

window.customElements.define('timer-bar-entity-row', TimerBarEntityRow);
window.customElements.define('timer-bar-mushroom-row', TimerBarMushroomRow);
console.info(
  `%c TIMER-BAR-CARD %c Version ${version} `,
  'font-weight: bold; color: #000; background: #aeb',
  'font-weight: bold; color: #000; background: #ddd',
);

@customElement('timer-bar-card')
export class TimerBarCard extends LitElement {

  @property() public hass?: HomeAssistant;
  @property({ attribute: false }) public editMode?: boolean;
  @state() private config!: TimerBarConfig;

  @property({ reflect: true, type: String })
  public layout: string | undefined;

  public static async getConfigElement() {
    await import('./timer-bar-card-editor');
    return document.createElement('timer-bar-editor');
  }

  public static getStubConfig(): object {
    return {};
  }

  setConfig(config: TimerBarConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    if ('mushroom' in config && config.mushroom)
      this.config = fillMushroomConfig(config, config.mushroom);
    else
      this.config = fillConfig(config);

    // Check for conflicting options
    if (this.config.duration && this.config.max_value) {
      console.warn("Both 'duration' and 'max_value' are set.  'duration' will take precedence.");
    }
  }

    protected render(): TemplateResult | void {
        const config = this.config;
        if (config.entity && config.entities) {
            return html `<hui-warning>Both entity and entities cannot be defined</hui-warning>`;
        }

        if (config.entity) {
            if ('mushroom' in config)
                return html `<timer-bar-mushroom-row .layout=${this.layout} .config=${config} .mushroom=${config.mushroom ?? {}} style=${mushroomStyle(config.mushroom ?? {})} .hass=${this.hass}></timer-bar-mushroom-row>`
            else
                return html `<timer-bar-entity-row .config=${config} .hass=${this.hass}></timer-bar-entity-row>`
        } else if (config.entities && !this._filteredEntities().length) {
            if (this.editMode || config.show_empty) {
                const content = typeof config.show_empty == 'undefined' ? 'No entities match the filter. This card will disappear when you finish editing.' : config.show_empty;
                return html `<ha-card>
          <h1 class="card-header">${config.name}</h1>
          <div class="card-content">${content}</div>
        </ha-card>`;
            } else {
                return html ``; // Return a blank card
            }
        } else if (config.entities) {
            return html `<ha-card>
        ${config.name && !config.header_entity ? html`<h1 class="card-header">${this.config.name}</h1>` : ''}
        <div class="card-content">
          ${config.header_entity ? this._renderTitle() : ''}
          ${this._renderContent()}
        </div>
      </ha-card>`;
        } else {
            return html `<hui-warning>Neither entity nor entities are defined</hui-warning>`;
        }
    }

  // ... (rest of the methods, like shouldUpdate, _hasEntityChanged, etc., remain the same) ...
    private _hasEntityChanged(oldHass: HomeAssistant, ...entities: (string | AttributeConfig | TimerBarEntityConfig | undefined)[]) {
        for (const entity of entities) {
            if (!entity) continue;
            if (typeof entity === 'string') {
                if (oldHass.states[entity] !== this.hass!.states[entity]) return true;
            } else if ('entity' in entity) {
                if (entity.entity && oldHass.states[entity.entity] !== this.hass!.states[entity.entity]) return true;
            } else if ('script' in entity) {
                if (entity.script && oldHass.states[entity.script] !== this.hass!.states[entity.script]) return true;
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
        if (!oldHass || !this.hass) return true;

        const entities = gatherEntitiesFromConfig(this.config)
        if (this.config.header_entity) entities.push(this.config.header_entity)
        for (const entity of this.config.entities!) {
            if (typeof entity === 'string') entities.push(entity)
            else entities.push(...gatherEntitiesFromConfig(entity))
        }

        return haveEntitiesChanged(entities, oldHass, this.hass)
    }

  /** Merges global and per-entity configuration */
  private _configFor(entity: string | TimerBarEntityConfig) {
    let config: TimerBarEntityConfig = { ...this.config };
    delete config.name // so card name does not override entity name
    // Merge in per-entity configuration
    if (typeof entity === 'string') config.entity = entity;
    else config = { ...config, ...entity };
    return config;
  }

  private _renderContent(): TemplateResult[] {
    return this._filteredEntities().map(entity => {
      const style = this.config.compressed ? { height: '36px' } : {};
      // Create a entity-row component for every entity
      return html`<timer-bar-entity-row
                    .config=${this._configFor(entity)}
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

  private _entitiesOfMode(entities: (string|TimerBarEntityConfig)[], mode: Mode) {
    // FIXME: The browser-home assistant time offset is assumed to be zero.
    // Should I watch the states of every entity in the entities list?
    // Or should there be a single offset for the whole card?
    return entities.filter(e => findMode(this.hass!, this._configFor(e), 0) === mode)
  }

  private _filteredEntities() {
    if (!this.config.filter || !this.hass) return this.config.entities!;

    return this._entitiesOfMode(this.config.entities!, 'active')
      .concat(this._entitiesOfMode(this.config.entities!, 'pause'))
      .concat(this._entitiesOfMode(this.config.entities!, 'waiting'))
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

  /** Taken from lovelace-mushroom */
  public getGridOptions() {
    if (!('mushroom' in this.config)) {
      return undefined
    }
    if (!this.config.mushroom) {
      return {
        columns: 6,
        rows: 1,
      };
    }

    const options = {
      min_rows: 1,
      min_columns: 4,
      columns: 6,
      rows: 0, // initial value
    };

    const appearance = this.config.mushroom;

    const collapsible_controls =
      "collapsible_controls" in this.config &&
      Boolean(this.config.collapsible_controls);

    const hasInfo =
      appearance.primary_info !== "none" ||
      appearance.secondary_info !== "none";
    const hasIcon = appearance.icon_type !== "none";

    if (appearance.layout === "vertical") {
      if (hasIcon) {
        options.rows += 1;
      }
      if (hasInfo) {
        options.rows += 1;
      }
      options.min_columns = 2;
    }

    if (appearance.layout === "horizontal") {
      options.rows = 1;
      options.columns = 12;
    }

    if (appearance.layout === "default") {
      if (hasInfo || hasIcon) {
        options.rows += 1;
      }
    }

    // If icon only, set 3x1 for size
    if (!hasInfo) {
      options.columns = 3;
      options.rows = 1;
      options.min_columns = 2;
    }

    // Ensure card has at least 1 row
    options.rows = Math.max(options.rows, 1);
    options.min_rows = options.rows;

    return options;
  }

  static styles = css`
    .card-header {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;
}