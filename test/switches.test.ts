import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import { synchronizeTimerRunning } from "./util";

expect.extend({ toMatchImageSnapshot });

const CONFIGURATION_YAML = `
input_number:
  slider:
    min: 0
    max: 10
    initial: 5
input_boolean:
  ${multiply(2, (i) => `
  switch${i}:
`)}
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
  await synchronizeTimerRunning(hass, "input_boolean.switch1", 1);
  expect(await card.screenshot()).toMatchImageSnapshot();
});

it("Switch with input_number duration", async () => {
  const dashboard = await hass.Dashboard([
    {
      name: "Time is 4:59",
      type: "custom:timer-bar-card",
      entities: ["input_boolean.switch2"],
      duration: { entity: "input_number.slider", "units": "minutes" },
    },
    {
      name: "Time is 1:58",
      type: "custom:timer-bar-card",
      entities: ["input_boolean.switch2"],
      duration: { entity: "input_number.slider", "units": "minutes" },
    },
  ]);
  const card = dashboard.cards[0];
  await hass.callService('homeassistant', 'turn_on', {}, { entity_id: "input_boolean.switch2" });
  await synchronizeTimerRunning(hass, "input_boolean.switch2", 1);
  expect(await card.screenshot()).toMatchImageSnapshot();
  await hass.callService('input_number', 'set_value', { value: 2 }, { entity_id: "input_number.slider" });
  await synchronizeTimerRunning(hass, "input_boolean.switch2", 2);
  expect(await dashboard.cards[1].screenshot()).toMatchImageSnapshot();
});
