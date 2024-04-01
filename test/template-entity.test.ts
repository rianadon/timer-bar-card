import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { synchronizeTimerPaused, toMatchDualSnapshot } from "./util";
expect.extend({ toMatchDualSnapshot });

const CONFIGURATION_YAML = `
timer:
  test:
    duration: "00:01:00"
  test2:
    duration: "00:01:00"

template:
  - sensor:
    - name: Fancy timer
      state: '{{ states("timer.test") }}'
      attributes:
        finishes_at: '{{ state_attr("timer.test", "finishes_at") }}'
        duration: 00:01:00
    - name: Auto timer
      state: Guess me
      attributes:
        finishes_at: '{{ state_attr("timer.test2", "finishes_at") }}'
        duration: 00:01:00
`;

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Custom entity can pause", async () => {
  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entity: "sensor.fancy_timer",
    end_time: { attribute: "finishes_at" },
  }]);
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("idle");

  await hass.callService("timer", "start", {}, { entity_id: "timer.test" });
  await expect(card).toMatchDualSnapshot("running");

  await synchronizeTimerPaused(hass, "timer.test", "00:00:58");
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test" });
  await expect(card).toMatchDualSnapshot("paused");
});

it("Auto mode can guess the active/idle", async () => {
  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entity: "sensor.auto_timer",
    guess_mode: true,
    end_time: { attribute: "finishes_at" },
  }]);
  const element = await dashboard.cards[0].element();
  // Card should have no bar when idle, and have a bar when running
  expect(await element.$$eval(".bar", (els) => els.length)).toBe(0);

  await hass.callService("timer", "start", {}, { entity_id: "timer.test2" });
  await new Promise(r => setTimeout(r, 500)); // Give timer time to update
  expect(await element.$$eval(".bar", (els) => els.length)).toBe(1);
});

it("Can explicitly specify state", async () => {
  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entities: [
      {
        name: "Active timer",
        debug: true,
        icon: "mdi:timer",
        state: { fixed: "active" },
        duration: { fixed: "0:01:00" },
        remain_time: { fixed: "0:00:30" },
      },
      {
        name: "Paused timer",
        debug: true,
        icon: "mdi:timer-lock",
        state: { fixed: "paused" },
        duration: { fixed: "0:01:00" },
        remain_time: { fixed: "0:00:30" },
      },
      {
        name: "Idle timer",
        debug: true,
        icon: "mdi:timer-off",
        state: { fixed: "idle" },
        duration: { fixed: "0:01:00" },
        remain_time: { fixed: "0:00:30" },
      }
    ],
  }]);
  const card = dashboard.cards[0];
  const element = await dashboard.cards[0].element();
  await expect(card).toMatchDualSnapshot("all");
  // The active timer should show a bar.
  expect(await element.$$eval(".bar", (els) => els.length)).toBe(1);
});

