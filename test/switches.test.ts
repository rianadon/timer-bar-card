import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchDualSnapshot, waitForTimerTime } from "./util";

expect.extend({ toMatchDualSnapshot });

const CONFIGURATION_YAML = `
input_number:
  slider:
    min: 0
    max: 10
    initial: 5
input_boolean:
  ${multiply(3, (i) => `
  switch${i}:
`)}
template:
  sensor:
    name: uhoh
    state: unavailable
`;

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Switch with fixed duration", async () => {
  const dashboard = await hass.Dashboard([
    {
      type: "custom:timer-bar-card",
      entities: ["input_boolean.switch1"],
      duration: { fixed: "00:01:00" },
    },
  ]);
  const card = dashboard.cards[0];
  await hass.callService('homeassistant', 'turn_on', {}, { entity_id: "input_boolean.switch1" });
  await waitForTimerTime(card, "00:00:58");
  await expect(card).toMatchDualSnapshot("running");
});

it("Switch with input_number duration", async () => {
  const dashboard = await hass.Dashboard([
    {
      name: "Time is 4:58",
      type: "custom:timer-bar-card",
      entities: ["input_boolean.switch2"],
      duration: { entity: "input_number.slider", "units": "minutes" },
    },
    {
      name: "Time is 1:57",
      type: "custom:timer-bar-card",
      entities: ["input_boolean.switch2"],
      duration: { entity: "input_number.slider", "units": "minutes" },
    },
  ]);
  const card = dashboard.cards[0];
  await hass.callService('homeassistant', 'turn_on', {}, { entity_id: "input_boolean.switch2" });
  await waitForTimerTime(card, "00:04:58");
  await expect(card).toMatchDualSnapshot("5-minutes");
  await hass.callService('input_number', 'set_value', { value: 2 }, { entity_id: "input_number.slider" });
  await waitForTimerTime(dashboard.cards[1], "00:01:57");
  await expect(dashboard.cards[1]).toMatchDualSnapshot("2-minutes");
});

it("Switch with unavailable duration + end time", async () => {
  const dashboard = await hass.Dashboard([{
    name: "Timeis is off",
    type: "custom:timer-bar-card",
    entities: ["input_boolean.switch3"],
    duration: { entity: "sensor.uhoh", "units": "minutes" },
    end_time: { entity: "sensor.uhoh" },
  }])
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("idle");
})
