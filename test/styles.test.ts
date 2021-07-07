import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { toMatchDualSnapshot, waitForTimerTime } from "./util";

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

it("Widths", async () => {
  const dashboard = await hass.Dashboard([
    {
      type: "custom:timer-bar-card",
      name: "Progress bar should be munched",
      entities: ["timer.test1"],
      bar_width: "50px",
      text_width: "10px",
    },
  ]);
  const card = dashboard.cards[0];
  await expect(card).toMatchDualSnapshot("idle");

  await hass.callService("timer", "start", { duration: "10:00:00" }, { entity_id: "timer.test1" });
  await expect(card).toMatchDualSnapshot("running");
});

it("Colors and icons", async () => {
  const dashboard = await hass.Dashboard([
    {
      type: "custom:timer-bar-card",
      bar_height: "20px",
      bar_background: "#222",
      bar_foreground: "linear-gradient(to right, red, violet)",
      entities: ["timer.test2"],
    },
  ]);
  const card = dashboard.cards[0];

  await hass.callService("timer", "start", { duration: "00:00:10" }, { entity_id: "timer.test2" });
  await waitForTimerTime(card, "00:00:08");
  await expect(card).toMatchDualSnapshot("running");
});


it("Receding progress bar", async () => {
  const dashboard = await hass.Dashboard([
    {
      type: "custom:timer-bar-card",
      bar_direction: "rtl",
      bar_foreground: "#eee",
      bar_background: "var(--mdc-theme-primary, #6200ee)",
      entities: ["timer.test3"],
    },
  ]);
  const card = dashboard.cards[0];

  await hass.callService("timer", "start", { duration: "00:00:10" }, { entity_id: "timer.test3" });
  await waitForTimerTime(card, "00:00:08");
  await expect(card).toMatchDualSnapshot("running");
});
