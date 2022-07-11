import { AttributeConfig, TimerBarConfig, HassEntity, Mode, TimerBarEntityConfig } from "./types";
import { durationToSeconds, formatTime, HomeAssistant } from "custom-card-helpers";

export function tryDurationToSeconds(duration: string, field: string) {
  try {
    const seconds = durationToSeconds(duration);
    if (isNaN(seconds)) throw new Error(`Error parsing ${field} ${duration}: check it matches the format 0:10:00`);
    return seconds;
  } catch (e) {
    throw new Error(`Could not convert ${field}: ${duration} is not of format 0:10:00. If you are passing in a number, specify the units property.`);
  }
}

export function usesLastChanged(hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity) {
  const duration = durationAttr(hass, stateObj, config.duration);
  const start_time = attribute(hass, stateObj, config.start_time);
  const end_time = attribute(hass, stateObj, config.end_time);

  // Last changed is needed if at least 2 of duration, start time, and end time are undefined.
  return (!duration && !end_time) || (!duration && !start_time) || (!end_time && !start_time);
}

// (duration OR start + end)
// AND
// (start + duration OR end)

// (duration + start + duration) OR (duration + end) OR (start + end + start) OR (start + end + end)
// (start + duration) OR (end + duration) OR (start + end) OR (start + end)
// (start + duration) OR (end + duration) OR (start + end)

/** Find the duration of the timer. */
export function findDuration(hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity) {
  const duration = durationAttr(hass, stateObj, config.duration);
  if (duration) return duration;

  const start_time = attribute(hass, stateObj, config.start_time);
  const end_time = attribute(hass, stateObj, config.end_time);
  if (start_time && end_time) return (Date.parse(end_time) - Date.parse(start_time)) / 1000;

  if (end_time) return (Date.parse(end_time) - Date.parse(stateObj.last_changed)) / 1000;

  return null;
}

/** Calculate the most accurate estimate of time remaining for the timer. */
export const timerTimeRemaining = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const madeActive = new Date(stateObj.last_changed).getTime();

  if (stateObj.attributes.remaining) { // For Home Assistant timers
    let timeRemaining = tryDurationToSeconds(stateObj.attributes.remaining, 'remaining');

    if (isState(stateObj, config.active_state!, config)) {
      const now = new Date().getTime();
      // Why timeRemaining and not duration?
      timeRemaining = Math.max(timeRemaining - (now - madeActive) / 1000, 0);
    }
    return timeRemaining;
  }

  const end_time = attribute(hass, stateObj, config.end_time!);
  if (end_time) // For OpenSprinkler timers + others
    return (Date.parse(end_time) - Date.now()) / 1000;

  const start_time = attribute(hass, stateObj, config.start_time);
  const duration = durationAttr(hass, stateObj, config.duration);

  if (start_time && duration)
    return (Date.parse(start_time) - Date.now()) / 1000 + duration;

  if (duration)
    return (madeActive - Date.now()) / 1000 + duration;

  return undefined;
};

/** Calculate what percent of the timer's duration has passed. */
export const timerTimePercent = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity): undefined | number => {
  const remaining = timerTimeRemaining(hass, config, stateObj);
  const duration = findDuration(hass, config, stateObj);

  if (!duration || !remaining) return undefined;

  return (duration - Math.floor(remaining)) / duration * 100;
};

export const formatStartTime = (stateObj: HassEntity) => {
  const start = new Date(stateObj.attributes.start_time);

  const lang = JSON.parse(localStorage.getItem('selectedLanguage') || '"en"') || 'en';
  return formatTime(start, lang);
}

export const isState = (stateObj: HassEntity | undefined, checkState: string | string[], config: TimerBarConfig) => {
  if (!stateObj) return false;
  const state = config.state_attribute ? stateObj.attributes[config.state_attribute] : stateObj.state;
  if (typeof checkState === 'string') return state === checkState;

  return checkState.includes(state);
}

export const attribute = (hass: HomeAssistant, stateObj: HassEntity, attrib: AttributeConfig | undefined) => {
  if (!attrib) throw new Error('One of duration, start_time, or end_time was not fully specified. Make sure you set entity, fixed, or attribute');
  if ('fixed' in attrib) return attrib.fixed;
  if ('entity' in attrib) return hass.states[attrib.entity].state;
  if ('state' in attrib) return stateObj.state;
  return stateObj.attributes[attrib.attribute];
}

const durationAttr = (hass: HomeAssistant, stateObj: HassEntity, attrib: AttributeConfig | undefined) => {
  const duration = attribute(hass, stateObj, attrib);
  if (!duration) return duration;

  if (attrib!.units === 'hours' || attrib!.units === 'minutes' || attrib!.units === 'seconds') {
    const numeric = Number(duration);
    if (isNaN(numeric)) throw new Error(`Expected duration ${duration} to be a number since units is ${attrib!.units}`);
    if (attrib!.units == 'hours') return numeric * 3600;
    if (attrib!.units == 'minutes') return numeric * 60;
    if (attrib!.units == 'seconds')  return numeric * 1;
  }

  return tryDurationToSeconds(duration, 'duration');
}

export function autoMode(hass: HomeAssistant, config: TimerBarEntityConfig): Mode | undefined {
  // Auto mode is not capable of determining whether the entity is paused or waiting
  const stMode = stateMode(hass, config);
  if (stMode === 'pause' || stMode === 'waiting') return undefined;

  const duration = findDuration(hass, config, state);
  const remaining = timerTimeRemaining(hass, config, state);
  if (!duration || !remaining) return undefined;
  if (remaining >= 0 && remaining <= duration) return 'active';
  return undefined;
}

export function stateMode(hass: HomeAssistant, config: TimerBarEntityConfig): Mode {
  const state = hass.states[config.entity!];
  if (isState(state, config.active_state!, config) && (timerTimeRemaining(hass, config, state)||0) > 0) return 'active';
  if (isState(state, config.pause_state!, config)) return 'pause';
  if (isState(state, config.waiting_state!, config)) return 'waiting';
  return 'idle';
}

export function findMode(hass: HomeAssistant, config: TimerBarEntityConfig): Mode {
  if (config.guess_mode) return autoMode(hass, config)|| stateMode(hass, config);
  return stateMode(hass, config);
 }
