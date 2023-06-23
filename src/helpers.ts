import { AttributeConfig, TimerBarConfig, HassEntity, Mode, TimerBarEntityConfig } from "./types";
import { durationToSeconds, formatTime, HomeAssistant } from "custom-card-helpers";

export const MIN_SYNC_ERROR = 500; // Allow local and HA times to be 500ms different
export const MAX_FIX_SYNC_ERROR = 60000; // Allow sync fixes of up to 1hr

/** Date.now(), but with a specified correction in ms. */
function now(correction: number) {
  return Date.now() + correction
}

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
  const duration = timeAttribute(hass, stateObj, config.duration);
  const remain_time = timeAttribute(hass, stateObj, config.remain_time);
  const start_time = attribute(hass, stateObj, config.start_time);
  const end_time = attribute(hass, stateObj, config.end_time);

  // Last changed is needed if at least 2 of duration, start time, and end time are undefined.
  return (!duration && !end_time) || (!duration && !start_time) || (!duration && !remain_time) || (!end_time && !start_time);
}

// (duration OR start + end)
// AND
// (start + duration OR end)

// (duration + start + duration) OR (duration + end) OR (start + end + start) OR (start + end + end)
// (start + duration) OR (end + duration) OR (start + end) OR (start + end)
// (start + duration) OR (end + duration) OR (start + end)

/** Find the duration of the timer. */
export function findDuration(hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity) {
  const duration = timeAttribute(hass, stateObj, config.duration);
  if (duration) return duration;

  const start_time = attribute(hass, stateObj, config.start_time);
  const end_time = attribute(hass, stateObj, config.end_time);
  if (start_time && end_time) return (Date.parse(end_time) - Date.parse(start_time)) / 1000;

  if (end_time) return (Date.parse(end_time) - Date.parse(stateObj.last_changed)) / 1000;

  return null;
}

/** Calculate the most accurate estimate of time remaining for the timer. */
export const timerTimeRemaining = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity, correction: number): undefined | number => {
  const madeActive = Date.parse(stateObj.last_changed);

  if (stateObj.attributes.remaining) { // For Home Assistant timers
    let timeRemaining = tryDurationToSeconds(stateObj.attributes.remaining, 'remaining');

    if (isState(stateObj, config.active_state!, config)) {
      // Why timeRemaining and not duration?
      timeRemaining = Math.max(timeRemaining - (now(correction) - madeActive) / 1000, 0);
    }
    return timeRemaining;
  }

  const end_time = attribute(hass, stateObj, config.end_time!);
  if (end_time) // For OpenSprinkler timers + others
    return (Date.parse(end_time) - now(correction)) / 1000;

  const start_time = attribute(hass, stateObj, config.start_time);
  const duration = timeAttribute(hass, stateObj, config.duration);
  if (start_time && duration)
    return (Date.parse(start_time) - now(correction)) / 1000 + duration;

  // Second-to-last fallback: remain time attribute
  const remain_time = timeAttribute(hass, stateObj, config.remain_time);
  if (remain_time != undefined) {
    return remain_time
  }

  // Final fallback: assume madeActive is the start time
  if (duration)
    return (madeActive - now(correction)) / 1000 + duration;

  return undefined;
};

/** Calculate what percent of the timer's duration has passed. */
export const timerTimePercent = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity, correction: number): undefined | number => {
  const remaining = timerTimeRemaining(hass, config, stateObj, correction);
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
  if (!attrib) throw new Error('One of duration, remain_time, start_time, or end_time was not fully specified. Make sure you set entity, fixed, or attribute');
  if ('fixed' in attrib) return attrib.fixed;
  if ('script' in attrib) return hass.states[attrib.script].attributes['last_action']?.split('delay ')[1];
  if ('entity' in attrib) return hass.states[attrib.entity].state;
  if ('state' in attrib) return stateObj.state;
  return stateObj.attributes[attrib.attribute];
}

const timeAttribute = (hass: HomeAssistant, stateObj: HassEntity, attrib: AttributeConfig | undefined) => {
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

export function autoMode(hass: HomeAssistant, config: TimerBarEntityConfig, correction: number): Mode | undefined {
  // Disable if the last modified date is used and there is no end time
  // Otherwise, auto mode might be enabled when it's not supposed to be!
  const state = hass.states[config.entity!];
  const end_time = attribute(hass, state, config.end_time);
  if (usesLastChanged(hass, config, state) && !end_time) return undefined;

  // Auto mode is not capable of determining whether the entity is paused or waiting
  const stMode = stateMode(hass, config, correction);
  if (stMode === 'pause' || stMode === 'waiting') return undefined;

  const duration = findDuration(hass, config, state);
  const remaining = timerTimeRemaining(hass, config, state, correction);
  if (!duration || !remaining) return undefined;
  if (remaining >= 0 && remaining <= duration + MIN_SYNC_ERROR) return 'active';
  return undefined;
}

export function stateMode(hass: HomeAssistant, config: TimerBarEntityConfig, correction: number): Mode {
  const state = hass.states[config.entity!];
  if (isState(state, config.active_state!, config) && (timerTimeRemaining(hass, config, state, correction)||0) > 0) return 'active';
  if (isState(state, config.pause_state!, config)) return 'pause';
  if (isState(state, config.waiting_state!, config)) return 'waiting';
  return 'idle';
}

export function findMode(hass: HomeAssistant, config: TimerBarEntityConfig, correction: number): Mode {
  if (config.guess_mode) return autoMode(hass, config, correction)|| stateMode(hass, config, correction);
  return stateMode(hass, config, correction);
}
