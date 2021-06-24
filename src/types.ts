import { LovelaceCardConfig } from 'custom-card-helpers';

export declare type HassEntity = {
  entity_id: string;
  state: string;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    user_id: string | null;
  };
  attributes: {
    [key: string]: any;
  };
};

interface styleConfig {
  icon?: string;
  active_icon?: string;

  bar_width?: string;
  bar_height?: string;
  bar_foreground?: string;
  bar_background?: string;
  text_width?: string;
}

interface modsConfig extends styleConfig {
  greater_than?: number;
  greater_than_eq?: number;
}

export type AttributeType = { attribute: string } | { fixed: number };
export type Translations = { [phrase: string]: string };

export interface TimerBarEntityConfig extends styleConfig {
  type: string;
  name?: string;
  entity?: string;

  active_state?: string | string[];
  pause_state?: string | string[];
  waiting_state?: string | string[];
  duration?: AttributeType;
  start_time?: AttributeType;
  end_time?: AttributeType;

  modifications?: modsConfig[];
  translations?: Translations;
}

export interface TimerBarConfig extends TimerBarEntityConfig {
  entities?: (string | TimerBarEntityConfig)[];

  header_entity?: string;
  header_secondary?: string;
  compressed?: boolean;
  filter?: boolean;
}
