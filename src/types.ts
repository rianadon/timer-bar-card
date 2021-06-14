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


// TODO Add your configuration elements here for type-checking
export interface TimerBarConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  entity?: string;
  entities?: string[];
  icon?: string;
  active_icon?: string;

  active_state?: string | string[];
  pause_state?: string | string[];
  waiting_state?: string | string[];

  bar_width?: string;
  bar_height?: string;
  bar_foreground?: string;
  bar_background?: string;
  text_width?: string;

  header_entity?: string;
  header_secondary?: string;
  compressed?: boolean;
  filter?: boolean;
}
