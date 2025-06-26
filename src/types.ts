// types.ts
import { HomeAssistant } from "custom-card-helpers";
import { Info } from "./lib/mushroom";

export type Mode = "active" | "pause" | "waiting" | "idle" | "countup";

export type HassEntity = HomeAssistant["states"][0]

interface styleConfig {
  icon?: string;
  active_icon?: string;
  image?: string;
  state_color?: boolean;

  invert?: boolean;
  bar_width?: string;
  bar_height?: string;
  bar_foreground?: string;
  bar_background?: string;
  bar_direction?: string;
  bar_radius?: string;
  text_width?: string;
  full_row?: boolean;
  layout?: 'normal' | 'hide_name' | 'full_row';
}

interface modsConfig extends styleConfig {
  remaining?: string;
  elapsed?: string;
}

type AttributeType =
  | { attribute: string }
  | { entity: string, attribute: string }
  | { entity: string }
  | { state: any }
  | { fixed: number }
  | { script: string };
export type AttributeConfig = AttributeType & {
  units?: "duration" | "hours" | "minutes" | "seconds";
};
export type Translations = { [phrase: string]: string };

export interface TimerBarEntityConfig extends styleConfig {
  type: string;
  name?: string;
  entity?: string;

  state?: { fixed: string };
  active_state?: string | string[];
  pause_state?: string | string[];
  waiting_state?: string | string[];
  state_attribute?: string;
  guess_mode?: boolean;
  duration?: AttributeConfig;
  remain_time?: AttributeConfig;
  start_time?: AttributeConfig;
  end_time?: AttributeConfig;
  debug?: boolean;
  sync_issues?: "show" | "ignore" | "fix";
  max_value?: string | "auto";
  auto_increment?: string; // ADDED auto_increment

  modifications?: modsConfig[];
  translations?: Translations;
  hold_action?: any;
  tap_action?: any;
  double_tap_action?: any;
  extend_paper_buttons_row?: any;
  resolution?: "seconds" | "minutes" | "automatic";
  format?: string;
}

export interface TimerBarConfig extends TimerBarEntityConfig {
  entities?: (string | TimerBarEntityConfig)[];

  header_entity?: string;
  header_secondary?: string;
  compressed?: boolean;
  filter?: boolean;
  show_empty?: string;
  mushroom?: Mushroom;
}

export interface Mushroom {
  color?: string;
  icon_color?: string;
  layout?: string;
  fill_container?: string;
  primary_info?: Info;
  secondary_info?: Info;
  icon_type?: string;
}