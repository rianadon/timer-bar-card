import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { MatchImageSnapshotOptions, toMatchImageSnapshot } from "jest-image-snapshot";
import { synchronizeTimerPaused } from "./util";
expect.extend({ toMatchImageSnapshot });

const CONFIGURATION_YAML = `
timer:
  ${multiply(10, (i) => `
  test${i}:
    duration: "00:${i}:00"
`)}
`;

let hass: HomeAssistant<PlaywrightElement>;

function id(name: string): MatchImageSnapshotOptions {
  return { customSnapshotIdentifier: ({ defaultIdentifier }) => `${defaultIdentifier}-${name}`};
}

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Entity Row Styles", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test1" },
  ]);
  const card = dashboard.cards[0];
  expect(await card.screenshot()).toMatchImageSnapshot(id("idle"));

  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  expect(await card.screenshot()).toMatchImageSnapshot(id("running"));

  await synchronizeTimerPaused(hass, "timer.test1", 1);
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test1" });
  expect(await card.screenshot()).toMatchImageSnapshot(id("paused"));

});

it("Card UI Styles", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entities: ["timer.test2", "timer.test3"] },
  ]);
  const card = dashboard.cards[0];
  expect(await card.screenshot()).toMatchImageSnapshot(id("idle"));

  await hass.callService("timer", "start", {}, { entity_id: "timer.test2" });
  expect(await card.screenshot()).toMatchImageSnapshot(id("running"));

  await synchronizeTimerPaused(hass, "timer.test2", 1);
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test2" });
  expect(await card.screenshot()).toMatchImageSnapshot(id("paused"));
});

it("Debug window appears", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entities: ["timer.test4", "timer.test5"], debug: true },
  ]);
  const element = await dashboard.cards[0].element()
  expect(await element.$$eval("code", (els) => els.length)).toBe(2)
});
