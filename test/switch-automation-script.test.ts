import { HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchDualSnapshot, waitForTimerTime } from "./util";

expect.extend({ toMatchDualSnapshot });

/** Home Assistant Configuration */
const CONFIGURATION_YAML = `
input_boolean:
  switch:

automation switch_off:
  alias: 'Turn switch off after some time, configurable with an input_number'
  trigger:
    - platform: state
      entity_id: input_boolean.switch
      to: 'on'
  condition: []
  action:
    - service: script.turn_on
      target:
        entity_id: script.turn_switch_off

script:
  turn_switch_off:
    alias: Turn the switch off after some time
    sequence:
      - delay:
          hours: 0
          minutes: 0
          seconds: 4
          milliseconds: 0
      - service: input_boolean.turn_off
        data: {}
        target:
          entity_id: input_boolean.switch
    mode: single
`;

/** Timer Bar Card Configuration */
const CONFIGURATION_CARD = {
  type: "custom:timer-bar-card",
  entities: ["input_boolean.switch"],
  duration: { script: "script.turn_switch_off" },
  debug: true,
}

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Switch with input_number turns off", async () => {
  const dashboard = await hass.Dashboard([CONFIGURATION_CARD]);
  const card = dashboard.cards[0];
  await hass.callService('homeassistant', 'turn_on', {}, { entity_id: "input_boolean.switch" });
  await waitForTimerTime(card, "00:00:02");
  expect(await card.narrow(".text-content").text()).toBe('2');

  // wait for timer to end; by this time automation should turn the switch off
  await waitForTimerTime(card, "00:00:01");
  await new Promise(r => setTimeout(r, 2000));

  expect(await card.narrow(".text-content").text()).toBe('Off');
}, 9000);
