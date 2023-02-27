/** Separate file for helpers to deal with creating actionHandlers **/
import { ActionHandlerEvent, HomeAssistant, hasAction } from "custom-card-helpers";
import { actionHandler } from "./lib/ha-action-handler-directive";
import { handleAction } from "./lib/handle-action";
import { TimerBarEntityConfig } from "./types";

export function createActionHandler(config: TimerBarEntityConfig) {
    return actionHandler({
        hasHold: hasAction(config.hold_action),
        hasDoubleClick: hasAction(config.double_tap_action),
    })
}

export function createHandleAction(hass: HomeAssistant, config: TimerBarEntityConfig) {
    return (ev: ActionHandlerEvent) => {
    handleAction(ev.target as any, hass!, config, ev.detail.action!);
  }
}
