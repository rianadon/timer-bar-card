import { TimerBarConfig, HassEntity } from "./types";
import { durationToSeconds, formatTime } from "custom-card-helpers";

/** Find the duration of the timer. */
function findDuration(stateObj: HassEntity) {
  const attr = stateObj.attributes;

  if (attr.duration)
    return durationToSeconds(stateObj.attributes.duration);

  if (attr.start_time && attr.end_time)
    return (Date.parse(attr.end_time) - Date.parse(attr.start_time)) / 1000;

  return null;
}

/** Calculate the most accurate estimate of time remaining for the timer. */
export const timerTimeRemaining = (config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const attr = stateObj.attributes;

  if (attr.remaining) { // For Home Assistant timers
    let timeRemaining = durationToSeconds(attr.remaining);

    if (isState(stateObj, config.active_state!)) {
      const now = new Date().getTime();
      const madeActive = new Date(stateObj.last_changed).getTime();
      timeRemaining = Math.max(timeRemaining - (now - madeActive) / 1000, 0);
    }
    return timeRemaining;
  }

  if (attr.end_time) // For OpenSprinkler timers
    return (Date.parse(attr.end_time) - Date.now()) / 1000;

  return undefined;
};

/** Calculate what percent of the timer's duration has passed. */
export const timerTimePercent = (config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const remaining = timerTimeRemaining(config, stateObj);
  const duration = findDuration(stateObj);

  if (!duration || !remaining) return undefined;

  return (duration - remaining) / duration * 100;
};

export const formatStartTime = (stateObj: HassEntity) => {
  const start = new Date(stateObj.attributes.start_time);

  const lang = JSON.parse(localStorage.getItem('selectedLanguage') || '"en"') || 'en';
  return formatTime(start, lang);
}

export const isState = (stateObj: HassEntity | undefined, checkState: string | string[]) => {
  if (!stateObj) return false;
  if (typeof checkState === 'string') return stateObj.state === checkState;

  return checkState.includes(stateObj.state);
}
