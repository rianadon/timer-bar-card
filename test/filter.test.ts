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
  // One timer should show up initially
  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  await new Promise(r => setTimeout(r, 100));

  const card = await dashboard.cards[0].element();
  expect(await card.$$eval('timer-bar-entity-row', e => e.length)).toBe(1);

  // Two timers should show up now that the timer has been started
  await hass.callService("timer", "start", {}, { entity_id: "timer.test2" });
  await new Promise(r => setTimeout(r, 100));
  expect(await card.$$eval('timer-bar-entity-row', e => e.length)).toBe(2);
});

it("Hides the card when no entities match the filter", async () => {
  const entities = { type: "entities", entities: ["timer.test9"] };
  const dashboard = await hass.Dashboard([{ type: "vertical-stack", cards: [
    entities,
    { type: "custom:timer-bar-card", entities: ["timer.test10"], filter: true },
    entities,
  ]}]);
  const stack = dashboard.cards[0];
  const visible = async () => (await stack.element()).evaluate((e: Element) => {
    // Search through shadow roots for the timer-bar-card
    const find = (root: ParentNode): Element | null => root.querySelector("timer-bar-card") ??
      [...root.querySelectorAll("*")].reduce<Element | null>((f, n) => f ?? (n.shadowRoot && find(n.shadowRoot)), null);
    return find(e.shadowRoot ?? e)?.checkVisibility() ?? false;
  });

  // No gap is left between the entities cards
  expect(await visible()).toBe(false);
  await expect(stack).toMatchDualSnapshot("empty");

  // The card comes back when a timer starts
  await hass.callService("timer", "start", {}, { entity_id: "timer.test10" });
  await new Promise(r => setTimeout(r, 100));
  expect(await visible()).toBe(true);

  await synchronizeTimerPaused(hass, "timer.test10", "00:09:58");
  await hass.callService("timer", "pause", {}, { entity_id: "timer.test10" });
  await expect(stack).toMatchDualSnapshot("paused");

  await hass.callService("timer", "cancel", {}, { entity_id: "timer.test10" });
  await new Promise(r => setTimeout(r, 100));
  expect(await visible()).toBe(false);
});
