import { HomeAssistant } from "hass-taste-test";
import { entitiesColl } from "home-assistant-js-websocket";
import { MatchImageSnapshotOptions, toMatchImageSnapshot } from "jest-image-snapshot";
import { toMatchSnapshot } from "jest-snapshot";

type Hass = HomeAssistant<any>

function durationToMS(duration: string) {
  const parts = duration.split(":").map(Number);
  return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
}

/** Retrieves entity state from Home Assistant */
export async function getEntity(hass: Hass, entity_id: string) {
  const coll = entitiesColl(hass.ws);
  await coll.refresh();
  const state = coll.state[entity_id];
  if (!state) throw new Error(`Entity ${entity_id} not found`);
  return state;
}

/** Wait for a timer to advance exactly `seconds` since its start time.
  * Uses last last changed time, used to calculate time when running.
*/
export async function synchronizeTimerRunning(hass: Hass, entity_id: string, seconds: number) {
  const state = await getEntity(hass, entity_id);
  if (!state.attributes.finishes_at && state.state !== "on") throw new Error(`Timer ${entity_id} is not running`);

  const last_changed = Date.parse(state.last_changed);
  const target_time = last_changed + seconds*1000 - 800;

  if (target_time < Date.now()) throw new Error(`Timer has already advanced past ${seconds} seconds from the beginning`);

  await new Promise(r => setTimeout(r, target_time - Date.now()));
}

/** Wait for a timer to advance exactly `seconds` since its start time.
  * Uses end time, used to calculate time when paused.
*/
export async function synchronizeTimerPaused(hass: Hass, entity_id: string, seconds: number) {
  const state = await getEntity(hass, entity_id);
  if (!state.attributes.finishes_at) throw new Error(`Timer ${entity_id} is not running`);

  const finishes_at = Date.parse(state.attributes.finishes_at);
  const duration = durationToMS(state.attributes.duration);
  const target_time = finishes_at - duration + seconds*1000 + 500;

  if (target_time < Date.now()) throw new Error(`Timer has already advanced past ${seconds} seconds from the beginning`);

  await new Promise(r => setTimeout(r, target_time - Date.now()));
}

/** Match both html and image snapshot */
export async function toMatchDualSnapshot(this: any, received: any, name?: string) {
  const html = await received.html({ ignoreAttributes: ["style"] });
  const htmlResult = toMatchSnapshot.call(this, html, name);

  const imgResult = (toMatchImageSnapshot as any).call(this, await received.screenshot(), {
    customSnapshotIdentifier: name ? ({ defaultIdentifier }) => `${defaultIdentifier}-${name}` : undefined,
    failureThreshold: 0.05,
    failureThresholdType: 'percent'
  });

  return htmlResult.pass ? imgResult : htmlResult;
}

declare global {
    namespace jest {
        interface Matchers<R, T> {
            toMatchDualSnapshot(name?: string): Promise<R>;
        }
    }
}
