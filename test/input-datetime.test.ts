import { HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";

const CONFIGURATION_YAML = `
input_boolean:
  test_timer:
    initial: false

input_datetime:
  timer_start:
    has_date: true
    has_time: true
  timer_end:
    has_date: true
    has_time: true
`;

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass?.close());

it("Uses input_datetime timestamps as start and end times", async () => {
  const now = Math.floor(Date.now() / 1000);
  await hass.callService("input_datetime", "set_datetime", { timestamp: now - 60 }, { entity_id: "input_datetime.timer_start" });
  await hass.callService("input_datetime", "set_datetime", { timestamp: now + 60 }, { entity_id: "input_datetime.timer_end" });

  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entity: "input_boolean.test_timer",
    guess_mode: true,
    start_time: { entity: "input_datetime.timer_start", attribute: "timestamp" },
    end_time: { entity: "input_datetime.timer_end", attribute: "timestamp" },
    debug: true,
  }]);

  const card = dashboard.cards[0];
  expect(await card.narrow("code").text()).toContain("Duration: 120 second");
  expect(await (await card.element()).$$eval(".bar", (els) => els.length)).toBe(1);
});
