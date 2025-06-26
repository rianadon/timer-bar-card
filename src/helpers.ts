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

// Added parseDuration function
export function parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)\s*(y|m|d|h|min|s)$/); // Added y, m, d, min
    if (!match) {
        console.warn("Invalid duration format. Using default 1h (use: y, m, d, h, min, or s for seconds)");
        return 60 * 60;  //default 1h
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 'y': return value * 365.25 * 24 * 60 * 60; // Average days in a year
        case 'm': return value * 30.44 * 24 * 60 * 60;  // Average days in a month
        case 'd': return value * 24 * 60 * 60;
        case 'h': return value * 3600;
        case 'min': return value * 60; // Corrected 'min' to 'm' in the regex
        case 's': return value;
        default:  return 60 * 60;
    }
}


export function usesLastChanged(hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity) {
  const duration = timeAttribute(hass, stateObj, config.duration);
  const remain_time = timeAttribute(hass, stateObj, config.remain_time);
  const start_time = timeAttribute(hass, stateObj, config.start_time);
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
export function findDuration(hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity | undefined) {
  const duration = timeAttribute(hass, stateObj, config.duration);
  if (duration) return duration;

  const start_time = timeAttribute(hass, stateObj, config.start_time);
  const end_time = attribute(hass, stateObj, config.end_time);
  if (start_time && end_time) return (Date.parse(end_time) - Date.parse(start_time)) / 1000;

  if (!stateObj) throw new Error('If there is neither a duration nor start and end times, an entity is required.')
  if (end_time) return (Date.parse(end_time) - Date.parse(stateObj.last_changed)) / 1000;

  return null;
}

/** Calculate the most accurate estimate of time remaining for the timer. */
export const timerTimeRemaining = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity | undefined, correction: number): undefined | number => {
    const madeActive = stateObj && Date.parse(stateObj.last_changed);
    const hasMaxValue = config.max_value !== undefined && config.max_value !== null;
    const hasDuration = config.duration !== undefined && config.duration !== null;

    // Check if the entity is in the active state
      if (stateObj && !isState(stateObj, config.active_state!, config)) {
          return 0; // Or undefined, depending on your preference
      }

    // Count-Up Logic
    if (hasMaxValue && !hasDuration) {
        let startTime = timeAttribute(hass, stateObj, config.start_time); // Use timeAttribute
        // Use start_time if available, otherwise use last_changed.
        if (startTime === undefined || isNaN(startTime)) {
            startTime = madeActive; // Fallback to last_changed (in milliseconds)
             if (isNaN(startTime)) { // If last_changed invalid too.
                return undefined;
            }
        } else {
             startTime *= 1000; // Convert to milliseconds if is a valid value
        }

        const nowTime = new Date().getTime();
        return Math.floor((nowTime - startTime) / 1000);  // Calculate based on startTime
    }
    
    // Count-Down Logic
    if (stateObj?.attributes.remaining) { // For Home Assistant timers
      let timeRemaining = tryDurationToSeconds(stateObj.attributes.remaining, 'remaining');

      if (isState(stateObj, config.active_state!, config)) {
        // Why timeRemaining and not duration?
        timeRemaining = Math.max(timeRemaining - (now(correction) - madeActive!) / 1000, 0);
      }
      return timeRemaining;
    }

    const end_time = attribute(hass, stateObj, config.end_time!);
    if (end_time) // For OpenSprinkler timers + others
      return (Date.parse(end_time) - now(correction)) / 1000;

    const start_time = timeAttribute(hass, stateObj, config.start_time); //use timeAttribute
    const duration = timeAttribute(hass, stateObj, config.duration);
    if (start_time && duration)
      return (Date.parse(start_time) - now(correction)) / 1000 + duration;

    // Second-to-last fallback: remain time attribute
    const remain_time = timeAttribute(hass, stateObj, config.remain_time);
    if (remain_time != undefined) {
      return remain_time
    }
    if (!madeActive) throw new Error(`If you don't pass an entity, you must specify 2 time/duration properties`);

    // Final fallback: assume madeActive is the start time
    if (duration)
      return (madeActive - now(correction)) / 1000 + duration;

    return undefined;
  };

/** Calculate what percent of the timer's duration has passed. */
export const timerTimePercent = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity | undefined, correction: number, currentMaxValue?: number): undefined | number => {
  const hasMaxValue = config.max_value !== undefined && config.max_value !== null;
  const hasDuration = config.duration !== undefined && config.duration !== null;
  const remaining = timerTimeRemaining(hass, config, stateObj, correction);

  // Check if the entity is in the active state
  if (stateObj && !isState(stateObj, config.active_state!, config)) {
      return 0;
  }

  // Count-Up Logic
  if (hasMaxValue && !hasDuration) {
      if (remaining === undefined) {
          return undefined;
      }

      // Prioritize using a fixed max_value if available:
      if (typeof config.max_value === 'string' && config.max_value !== "auto") {
          const maxValueSeconds = parseDuration(config.max_value);
          return (remaining / maxValueSeconds) * 100;
      } else if (currentMaxValue !== undefined) {
          // Use currentMaxValue if provided (for auto mode)
          return (remaining / currentMaxValue) * 100;
      } else if (config.max_value === "auto"){
           // Fallback for auto mode (shouldn't reach here normally)
          return 100
      } else {
          // Fallback (shouldn't reach here normally)
          return 0;
      }
  }

  // Count-Down Logic
  const duration = findDuration(hass, config, stateObj);
  if (!duration || !remaining) return undefined;

  return (duration - Math.floor(remaining)) / duration * 100;
};

export const formatStartTime = (hass: HomeAssistant, config: TimerBarConfig, stateObj: HassEntity | undefined) => {
  const start_time = attribute(hass, stateObj, config.start_time);
  const start = new Date(start_time);

  const lang = JSON.parse(localStorage.getItem('selectedLanguage') || '"en"') || 'en';
  return formatTime(start, lang);
}

export const isState = (stateObj: HassEntity | undefined, checkState: string | string[], config: TimerBarConfig) => {
  if (!stateObj) return false;
  const state = config.state_attribute ? stateObj.attributes[config.state_attribute] : stateObj.state;
  if (typeof checkState === 'string') return state === checkState;

  return checkState.includes(state);
}

function nullifyState(value: string) {
  if (value == "unavailable") return null
  return value
}

export const attribute = (hass: HomeAssistant, stateObj: HassEntity | undefined, attrib: AttributeConfig | undefined) => {
  if (!attrib) throw new Error('One of duration, remain_time, start_time, or end_time was not fully specified. Make sure you set entity, fixed, or attribute');
  if ('fixed' in attrib) return attrib.fixed;
  if ('script' in attrib) {
    const match = hass.states[attrib.script].attributes['last_action']?.match(/[\d:]+$/)
    return match ? match[0] : undefined;
  }
  if ('entity' in attrib) {
    // Two cases: entity + attribute or entity + state
    if ('attribute' in attrib) return hass.states[attrib.entity].attributes[attrib.attribute]
    return nullifyState(hass.states[attrib.entity].state);
  }
  if (!stateObj) return undefined;
  // if (!stateObj) throw new Error(`Since there is no entity, ${JSON.stringify(attrib)} must specify fixed:.`);
  if ('state' in attrib) return nullifyState(stateObj!.state);
  return stateObj.attributes[attrib.attribute];
}

const timeAttribute = (hass: HomeAssistant, stateObj: HassEntity | undefined, attrib: AttributeConfig | undefined) => {
  const attributeValue = attribute(hass, stateObj, attrib);
  if (!attributeValue) return attributeValue;
    
  if (attrib!.units === 'hours' || attrib!.units === 'minutes' ) {
    const numeric = parseFloat(attributeValue);
    if (isNaN(numeric)) throw new Error(`Expected duration ${attributeValue} to be a number since units is ${attrib!.units}`);
    if (attrib!.units == 'hours') return numeric * 3600;
    if (attrib!.units == 'minutes') return numeric * 60;
  }
  // Handle 'seconds' unit directly
  if (attrib!.units === 'seconds') {
        const numeric = parseFloat(attributeValue);
        if (isNaN(numeric)) {
            throw new Error(`Expected attribute value ${attributeValue} to be a number since units is seconds`);
        }
        return numeric; // Return the number of seconds directly
  }

  return tryDurationToSeconds(attributeValue, 'duration');
}

export function autoMode(hass: HomeAssistant, config: TimerBarEntityConfig, correction: number): Mode | undefined {
  const hasMaxValue = config.max_value !== undefined && config.max_value !== null;
  const hasDuration = config.duration !== undefined && config.duration !== null;
  // Count-Up Logic
  if (hasMaxValue && !hasDuration) {
      return 'countup';
  }
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
  const hasMaxValue = config.max_value !== undefined && config.max_value !== null;
  const hasDuration = config.duration !== undefined && config.duration !== null;
 // Count-Up Logic
  if (hasMaxValue && !hasDuration) {
      return 'countup';
  }
  if (config.state?.fixed) return config.state?.fixed.replace('paused', 'pause') as Mode;
  const state = hass.states[config.entity!];
  if (isState(state, config.active_state!, config) && (timerTimeRemaining(hass, config, state, correction) || 0) > 0) return 'active';
  if (isState(state, config.pause_state!, config)) return 'pause';
  if (isState(state, config.waiting_state!, config)) return 'waiting';
  return 'idle';
}

export function findMode(hass: HomeAssistant, config: TimerBarEntityConfig, correction: number): Mode {
  if (config.guess_mode) return autoMode(hass, config, correction) || stateMode(hass, config, correction);
  return stateMode(hass, config, correction);
}

/** Returns an array of entities referenced by the config.
 * Useful for state updates
 **/
export function gatherEntitiesFromConfig(config: TimerBarEntityConfig): string[] {
  const entities: string[] = []
  const addMaybe = (s: string | undefined) => s && entities.push(s)
  const addMaybeAttr = (c: AttributeConfig | undefined) => {
    if (c && 'entity' in c) entities.push(c.entity)
    if (c && 'script' in c) entities.push(c.script)
  }

  addMaybe(config.entity)
  addMaybeAttr(config.duration)
  addMaybeAttr(config.remain_time)
  addMaybeAttr(config.start_time)
  addMaybeAttr(config.end_time)
  return entities
}

export function haveEntitiesChanged(entities: string[], oldHass: HomeAssistant, newHass: HomeAssistant) {
  for (const entity of entities) {
    if (oldHass.states[entity] != newHass.states[entity]) return true
  }
  return false
}