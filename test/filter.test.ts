import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchDualSnapshot } from "./util";
expect.extend({ toMatchDualSnapshot });

const CONFIGURATION_YAML = `
timer:
  ${multiply(10, (i) => `
  test${i}:
    duration: "00:${i}:00"
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

it("Filters Entities", async () => {
  const dashboard = await hass.Dashboard([
    {
      type: "custom:timer-bar-card",
      entities: ["timer.test1", "timer.test2"],
      filter: true
    },
  ]);
  // No timers should show up initially
  const card = await dashboard.cards[0].element();
  expect(await card.$$eval('timer-bar-entity-row', e => e.length)).toBe(0);

  // One timer should show up now that the timer has been started
  await hass.callService("timer", "start", {}, { entity_id: "timer.test2" });
  await new Promise(r => setTimeout(r, 100));
  expect(await card.$$eval('timer-bar-entity-row', e => e.length)).toBe(1);
});
