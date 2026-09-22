import { HomeAssistant } from "custom-card-helpers";
import { autoMode } from "../src/helpers";
import { TimerBarEntityConfig } from "../src/types";

const ENTITY = "sensor.test_timer";

/** Build a minimal hass object with a single entity exposing start/end times. */
function makeHass(startOffsetSeconds: number, endOffsetSeconds: number): HomeAssistant {
  const now = Date.now();
  return {
    states: {
      [ENTITY]: {
        entity_id: ENTITY,
        state: "on",
        last_changed: new Date(now).toISOString(),
        last_updated: new Date(now).toISOString(),
        attributes: {
          start_time: new Date(now + startOffsetSeconds * 1000).toISOString(),
          end_time: new Date(now + endOffsetSeconds * 1000).toISOString(),
        },
      },
    },
  } as unknown as HomeAssistant;
}

// Mirrors the defaults applied by fillConfig()
const config: TimerBarEntityConfig = {
  type: "custom:timer-bar-card",
  entity: ENTITY,
  active_state: ["active", "on", "manual", "program", "once_program"],
  pause_state: "paused",
  waiting_state: "waiting",
  duration: { attribute: "duration" },
  remain_time: { attribute: "remain_time" },
  start_time: { attribute: "start_time" },
  end_time: { attribute: "end_time" },
};

it("guesses active while the timer is running", () => {
  // Started 60s ago, ends in 60s => duration 120s, remaining 60s
  expect(autoMode(makeHass(-60, 60), config, 0)).toBe("active");
});

it("does not guess active for a timer scheduled far in the future", () => {
  // Starts in 100s and runs for 60s => duration 60s, remaining 160s.
  // Remaining exceeds the duration, so the timer cannot be running yet.
  expect(autoMode(makeHass(100, 160), config, 0)).toBeUndefined();
});

it("tolerates only sub-second clock skew, not 500 seconds", () => {
  // Remaining is 0.1s larger than the duration: within the allowed sync error.
  expect(autoMode(makeHass(0.1, 60.1), config, 0)).toBe("active");

  // Remaining is 5s larger than the duration: clearly not yet started.
  expect(autoMode(makeHass(5, 65), config, 0)).toBeUndefined();
});
