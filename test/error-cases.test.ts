import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchDualSnapshot } from "./util";

expect.extend({ toMatchDualSnapshot });

const CONFIGURATION_YAML = `
timer:
  ${multiply(2, (i) => `
  test${i}:
    duration: "00:${i}:00"
`)}
`;

let hass: HomeAssistant<PlaywrightElement>;

// Mushroom is deliberately not loaded here
beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new PlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Mushroom with entities", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entities: ["timer.test1"], mushroom: { color: "green" } },
  ]);
  const card = dashboard.cards[0];
  await (await card.element()).waitForSelector("hui-error-card");
  await expect(card).toMatchDualSnapshot("error");
});

it("Mushroom not installed", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test2", mushroom: null },
  ]);
  const card = dashboard.cards[0];
  await (await card.element()).waitForSelector("hui-warning", { timeout: 5000 });
  await expect(card).toMatchDualSnapshot("warning");
});
