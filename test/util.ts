import { durationToSeconds } from "custom-card-helpers";
import { HomeAssistant, HassCard, PlaywrightElement } from "hass-taste-test";
import { entitiesColl } from "home-assistant-js-websocket";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { toMatchSnapshot } from "jest-snapshot";


/** Retrieves entity state from Home Assistant */
export async function getEntity(hass: HomeAssistant<any>, entity_id: string) {
  const coll = entitiesColl(hass.ws as any);
  await coll.refresh();
  const state = coll.state[entity_id];
  if (!state) throw new Error(`Entity ${entity_id} not found`);
  return state;
}

/** Wait for a timer to reach the time specified. */
export async function waitForTimerTime(card: HassCard<any>, time: string) {
  const element: PlaywrightElement = await card.element();
  const textContent = await element.$(".text-content");
  const frame = await element.ownerFrame();

  await frame!.waitForFunction(([text, duration]) => {
    function durationToSeconds(duration: string) {
      const parts = duration.split(":").map(Number).reverse();
      return (parts[2]||0) * 3600 + (parts[1]||0) * 60 + parts[0];
    }

    // @ts-ignore
    const actual = durationToSeconds(text.textContent.trim());
    const expected = durationToSeconds(duration as string);

    if (actual < expected) throw new Error(`Already passed time ${duration}`);
    return actual === expected;
  }, [textContent, time]);
}

/** Wait for a timer to advance the given diruation
*/
export async function synchronizeTimerPaused(hass: HomeAssistant<any>, entity_id: string, duration: string) {
  const state = await getEntity(hass, entity_id);
  if (!state.attributes.finishes_at) throw new Error(`Timer ${entity_id} is not running`);

  const finishes_at = Date.parse(state.attributes.finishes_at);
  const seconds = durationToSeconds(duration);
  const target_time = finishes_at - seconds*1000 + 500;
  const delay = target_time - Date.now();

  if (target_time < Date.now()) throw new Error(`Timer has already advanced past ${seconds} seconds from the beginning`);

  if (delay > 4000) throw new Error(`Timer wants to wait ${delay/1000} seconds, and that's too long`);

  await new Promise(r => setTimeout(r, delay));
}

/** Match both html and image snapshot */
export async function toMatchDualSnapshot(this: any, received: HassCard<any>, name?: string) {
  const html = await received.html({ ignoreAttributes: ["style"] });
  const htmlResult = toMatchSnapshot.call(this, html, name) as any;

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
