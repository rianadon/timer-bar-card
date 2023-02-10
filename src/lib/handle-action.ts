/** Action Handling Code.

    From both https://github.com/custom-cards/custom-card-helpers/blob/master/src/handle-action.ts
    and https://github.com/home-assistant/frontend/blob/dev/src/panels/lovelace/common/handle-action.ts
 */

import { HassServiceTarget } from "home-assistant-js-websocket";
import { forwardHaptic } from "custom-card-helpers";
import { fireEvent } from "custom-card-helpers";
import { navigate } from "custom-card-helpers";
import { toggleEntity } from "custom-card-helpers";

type HomeAssistant = any; // Hack since the custom-card-helpers HomeAssistant type is out of date

export interface ToggleActionConfig extends BaseActionConfig {
  action: "toggle";
}

export interface CallServiceActionConfig extends BaseActionConfig {
  action: "call-service";
  service: string;
  target?: HassServiceTarget;
  // "service_data" is kept for backwards compatibility. Replaced by "data".
  service_data?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

export interface NavigateActionConfig extends BaseActionConfig {
  action: "navigate";
  navigation_path: string;
}

export interface UrlActionConfig extends BaseActionConfig {
  action: "url";
  url_path: string;
}

export interface MoreInfoActionConfig extends BaseActionConfig {
  action: "more-info";
}

export interface NoActionConfig extends BaseActionConfig {
  action: "none";
}

export interface CustomActionConfig extends BaseActionConfig {
  action: "fire-dom-event";
}

export interface BaseActionConfig {
  action: string;
  confirmation?: ConfirmationRestrictionConfig;
}

export interface ConfirmationRestrictionConfig {
  text?: string;
  exemptions?: RestrictionConfig[];
}

export interface RestrictionConfig {
  user: string;
}

export type ActionConfig =
  | ToggleActionConfig
  | CallServiceActionConfig
  | NavigateActionConfig
  | UrlActionConfig
  | MoreInfoActionConfig
  | NoActionConfig
  | CustomActionConfig;

export const handleActionConfig = (
  node: HTMLElement,
  hass: HomeAssistant,
  config: {
    entity?: string;
    camera_image?: string;
    hold_action?: ActionConfig;
    tap_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  },
  actionConfig: ActionConfig | undefined
): void => {
  if (!actionConfig) {
    actionConfig = {
      action: "more-info",
    };
  }

  if (
    actionConfig.confirmation &&
    (!actionConfig.confirmation.exemptions ||
      !actionConfig.confirmation.exemptions.some(
        (e) => e.user === hass!.user!.id
      ))
  ) {
    forwardHaptic("warning");

    if (
      !confirm(
        actionConfig.confirmation.text ||
          `Are you sure you want to ${actionConfig.action}?`
      )
    ) {
      return;
    }
  }

  switch (actionConfig.action) {
    case "more-info":
      if (config.entity || config.camera_image) {
        fireEvent(node, "hass-more-info", {
          entityId: config.entity ? config.entity : config.camera_image!,
        });
      }
      break;
    case "navigate":
      if (actionConfig.navigation_path) {
        navigate(node, actionConfig.navigation_path);
      }
      break;
    case "url":
      if (actionConfig.url_path) {
        window.open(actionConfig.url_path);
      }
      break;
    case "toggle":
      if (config.entity) {
        toggleEntity(hass, config.entity!);
        forwardHaptic("success");
      }
      break;
    case "call-service": {
      if (!actionConfig.service) {
        forwardHaptic("failure");
        return;
      }
      const [domain, service] = actionConfig.service.split(".", 2);
      hass.callService(domain,
                       service,
                       actionConfig.data ?? actionConfig.service_data,
                       actionConfig.target
                      );
      forwardHaptic("light");
      break;
    }
    case "fire-dom-event": {
      fireEvent(node, "ll-custom", actionConfig);
    }
  }
};

export const handleAction = (
  node: HTMLElement,
  hass: HomeAssistant,
  config: {
    entity?: string;
    camera_image?: string;
    hold_action?: ActionConfig;
    tap_action?: ActionConfig;
    double_tap_action?: ActionConfig;
  },
  action: string
): void => {
  let actionConfig: ActionConfig | undefined;

  if (action === "double_tap" && config.double_tap_action) {
    actionConfig = config.double_tap_action;
  } else if (action === "hold" && config.hold_action) {
    actionConfig = config.hold_action;
  } else if (action === "tap" && config.tap_action) {
    actionConfig = config.tap_action;
  }

  handleActionConfig(node, hass, config, actionConfig);
};
