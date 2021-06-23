import { AttributeType, TimerBarConfig, HassEntity } from "./types";
import { durationToSeconds, formatTime } from "custom-card-helpers";

/** Find the duration of the timer. */
function findDuration(config: TimerBarConfig, stateObj: HassEntity) {
  const duration = attribute(stateObj, config.duration!);

  if (duration && typeof duration === 'string') return durationToSeconds(duration);
  else if (duration) return duration;

  const start_time = attribute(stateObj, config.start_time!);
  const end_time = attribute(stateObj, config.end_time!);
  if (start_time && end_time) return (Date.parse(end_time) - Date.parse(start_time)) / 1000;

  return null;
}

/** Calculate the most accurate estimate of time remaining for the timer. */
export const timerTimeRemaining = (config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const madeActive = new Date(stateObj.last_changed).getTime();

  if (stateObj.attributes.remaining) { // For Home Assistant timers
    let timeRemaining = durationToSeconds(stateObj.attributes.remaining);

    if (isState(stateObj, config.active_state!)) {
      const now = new Date().getTime();
      // Why timeRemaining and not duration?
      timeRemaining = Math.max(timeRemaining - (now - madeActive) / 1000, 0);
    }
    return timeRemaining;
  }

  const end_time = attribute(stateObj, config.end_time!);
  if (end_time) // For OpenSprinkler timers + others
    return (Date.parse(end_time) - Date.now()) / 1000;

  const start_time = attribute(stateObj, config.start_time!);
  const duration = attribute(stateObj, config.duration!);

  if (start_time && duration)
    return (Date.parse(start_time) - Date.now()) / 1000 + duration;

  if (duration)
    return (madeActive - Date.now()) / 1000 + duration;

  return undefined;
};

/** Calculate what percent of the timer's duration has passed. */
export const timerTimePercent = (config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const remaining = timerTimeRemaining(config, stateObj);
  const duration = findDuration(config, stateObj);

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

export const attribute = (stateObj: HassEntity, attrib: AttributeType) => {
  if ('fixed' in attrib) return attrib.fixed;
  return stateObj.attributes[attrib.attribute];
}
