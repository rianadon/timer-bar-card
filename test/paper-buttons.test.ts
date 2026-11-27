import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement, PlaywrightPage } from "hass-taste-test";

const CONFIGURATION_YAML = `
timer:
  ${multiply(1, (i) => `
  test${i}:
    duration: "00:05:00"
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// #173, #227: a new paper-buttons-row was created (and registered with HA forever) on every tick.
// It's loaded after the card renders, so the card must also replace its placeholder once loaded.
it("Reuses the paper-buttons-row element while the timer runs", async () => {
  const dashboard = await hass.Dashboard([{
    type: "custom:timer-bar-card",
    entity: "timer.test1",
    extend_paper_buttons_row: { position: "right", buttons: [{ name: "Start" }] },
  }]);
  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  const page = (dashboard.page as PlaywrightPage).playwright;
  await page.addScriptTag({ path: __dirname + "/resources/paper-buttons-row.js", type: "module" });
  await sleep(500);
  const paperButtons = dashboard.cards[0].narrow("paper-buttons-row");

  const before = await paperButtons.element();
  await sleep(2000); // a few ticks
  const after = await paperButtons.element();
  expect(await before.evaluate((a, b) => a === b, after)).toBe(true);
});
