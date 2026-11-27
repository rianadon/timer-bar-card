import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement, HassCard } from "hass-taste-test";
import { getEntity } from "./util";

// #114: one tap on a running timer ran the action several times, because elements with their own
// action handlers were nested inside an ancestor (mushroom-state-item, the full_row div) with one too.
// Test i shows timer.test{i}, whose actions increment input_number.taps{i}.
const CONFIGURATION_YAML = `
timer:
  ${multiply(4, (i) => `
  test${i}:
    duration: "00:05:00"
`)}
input_number:
  ${multiply(4, (i) => `
  taps${i}:
    min: 0
    max: 100
    initial: 0
`)}
`;

let hass: HomeAssistant<PlaywrightElement>;

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
  await hass.addResource(__dirname + "/resources/mushroom.js", "module");
}, 30000);
afterAll(async () => await hass.close());

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const taps = async (i: number) => parseFloat((await getEntity(hass, `input_number.taps${i}`)).state);
const increment = (i: number) => ({ action: "call-service", service: "input_number.increment", target: { entity_id: `input_number.taps${i}` } });

/** Show a card for timer.test{i} whose `action` increments taps{i}, and start the timer. */
async function runningCard(i: number, config: object, action = "tap_action") {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: `timer.test${i}`, [action]: increment(i), ...config },
  ]);
  await hass.callService("timer", "start", {}, { entity_id: `timer.test${i}` });
  await sleep(1000); // let the bar render
  return dashboard.cards[0];
}

/** Click once, then wait out HA's double-tap window and the service call. */
async function clickOn(card: HassCard<PlaywrightElement>, selector: string) {
  await (await card.narrow(selector).element()).click();
  await sleep(1200);
}

it("Default row: each tap runs tap_action once", async () => {
  const card = await runningCard(1, {});
  await clickOn(card, ".bar-container");
  expect(await taps(1)).toBe(1);
  await clickOn(card, ".text-content");
  expect(await taps(1)).toBe(2);
}, 20000);

it("full_row: each tap runs tap_action once", async () => {
  const card = await runningCard(2, { layout: "full_row" });
  await clickOn(card, ".bar-container");
  expect(await taps(2)).toBe(1);
  await clickOn(card, ".text-content");
  expect(await taps(2)).toBe(2);
}, 20000);

it("Mushroom: each tap runs tap_action once", async () => {
  const card = await runningCard(3, { mushroom: {} });
  await clickOn(card, ".bar-container");
  expect(await taps(3)).toBe(1);
  await clickOn(card, ".text-content");
  expect(await taps(3)).toBe(2);
  await clickOn(card, "mushroom-shape-icon");
  expect(await taps(3)).toBe(3);
}, 20000);

it("Mushroom: one tap does not run double_tap_action", async () => {
  const card = await runningCard(4, { mushroom: {}, tap_action: { action: "none" } }, "double_tap_action");
  await clickOn(card, ".bar-container");
  expect(await taps(4)).toBe(0);
}, 20000);
