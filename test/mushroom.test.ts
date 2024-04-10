import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { synchronizeTimerPaused, toMatchDualSnapshot } from "./util";
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
  await hass.addResource(__dirname + '/resources/mushroom.js', 'module');
}, 30000);
afterAll(async () => await hass.close());

it("Basic mushroom", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test1", mushroom: true },
  ]);
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("idle");

  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  await expect(card).toMatchDualSnapshot("running");

  await synchronizeTimerPaused(hass, "timer.test1", "00:00:58");
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test1" });
  await expect(card).toMatchDualSnapshot("paused");
});

it("Vertical mushroom", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test2", mushroom: { layout: 'vertical' } },
  ]);
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("idle");

  await hass.callService("timer", "start", {}, { entity_id: "timer.test2" });
  await expect(card).toMatchDualSnapshot("running");

  await synchronizeTimerPaused(hass, "timer.test2", "00:01:58");
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test2" });
  await expect(card).toMatchDualSnapshot("paused");
});

it("Mushroom customization", async () => {
  const dashboard = await hass.Dashboard([{
    type: "grid",
    columns: 2,
    square: false,
    cards: [{
      type: "custom:timer-bar-card",
      entity: "timer.test3",
      mushroom: {
        primary_info: 'state',
        secondary_info: 'none'
      }
    }, {
      type: "custom:timer-bar-card",
      entity: "timer.test3",
      name: 'No icon',
      mushroom: {
        icon_type: 'none',
      }
    }],
  }]);
  const card = dashboard.cards[0];
  await hass.callService("timer", "start", {}, { entity_id: "timer.test3" });
  await hass.callService("timer", "finish", {}, { entity_id: "timer.test3" });
  await expect(card).toMatchDualSnapshot("infos");
});

it("Mushroom fill_container", async () => {
  const dashboard = await hass.Dashboard([{
    type: "grid",
    columns: 2,
    square: true,
    cards: [{
      type: "custom:timer-bar-card",
      entity: "timer.test4",
      mushroom: {
        fill_container: false
      }
    }, {
      type: "custom:timer-bar-card",
      entity: "timer.test4",
      mushroom: {
        fill_container: true
      }
    }],
  }]);
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("fill_container");
});
