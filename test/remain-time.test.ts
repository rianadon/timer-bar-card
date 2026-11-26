import { HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";

// A single entity (like a valve switch) whose state stays "on" while only its
// remain_time attribute changes.
const CONFIGURATION_YAML = `
template:
  - sensor:
    - name: Valve
      state: '{{ states("input_boolean.valve_on") }}'
      attributes:
        remain_time: '{{ states("input_number.valve_remaining") | int }}'

input_number:
  valve_remaining:
    min: 0
    max: 600
    initial: 0

input_boolean:
  valve_on:
    initial: false
`;

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Remaining time attribute + active state shows a fixed duration", async () => {
  // No duration or start_time is configured.
  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entity: "sensor.valve",
    remain_time: { attribute: "remain_time", units: "seconds" },
    debug: true,
  }]);
  const card = dashboard.cards[0];
  /** Duration from the debug output (NaN if the card found none). */
  const shownDuration = async () => {
    const match = (await card.narrow("code").text()).match(/Duration: (\S+) second/);
    return match ? Number(match[1]) : NaN;
  };

  // Valve opens for a 30s run, then over a second later reports 29s left (an attribute-only update).
  await hass.callService("input_number", "set_value", { value: 30 }, { entity_id: "input_number.valve_remaining" });
  await hass.callService("input_boolean", "turn_on", {}, { entity_id: "input_boolean.valve_on" });
  await new Promise(r => setTimeout(r, 1200));
  await hass.callService("input_number", "set_value", { value: 29 }, { entity_id: "input_number.valve_remaining" });
  const deadline = Date.now() + 3000;
  while (!/"remain_time":"?29"?/.test(await card.narrow("code").text())) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for the card to receive remain_time 29");
    await new Promise(r => setTimeout(r, 50));
  }

  expect(await (await card.element()).$$eval(".bar", (els: any) => els.length)).toBe(1); // Ensure bar is shown
  const duration = await shownDuration();
  expect(duration).toBeGreaterThanOrEqual(30);
  expect(duration).toBeLessThanOrEqual(31);

  // Between updates the duration does not drift.
  await new Promise(r => setTimeout(r, 1000));
  expect(await shownDuration()).toBe(duration);
});
