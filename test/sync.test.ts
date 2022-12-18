import { multiply, HomeAssistant, PlaywrightBrowser, PlaywrightElement } from "hass-taste-test";
import { Browser, BrowserContext } from "playwright";

const CONFIGURATION_YAML = `
timer:
  ${multiply(3, (i) => `
  test${i}:
    duration: "00:${i}:00"
`)}
`;

let hass: HomeAssistant<PlaywrightElement>;

/** Override the local time by a specified offset */
function overrideDate() {
  const oldNow = Date.now;
  (window as any).offset = 0;
  // @ts-ignore
  window.Date = class extends Date {
    constructor(arg: any) {
      if (arg) super(arg);
      else super(oldNow() + (window as any).offset);
    }
  }
  window.Date.now = () => oldNow() + (window as any).offset;
  setInterval(() => (window as any).offset = parseInt(document.title) || 0, 100);
}

class ModPlaywrightBrowser extends PlaywrightBrowser {
  async newPage(browser: Browser | BrowserContext) {
    const page = await super.newPage(browser);
    page.addInitScript(overrideDate);
    return page;
  }
}

beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new ModPlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());


it("Browser behind", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test1", debug: true },
  ], { title: '1000'});
  const card = dashboard.cards[0];

  await new Promise(r => setTimeout(r, 500)); // Wait for time offset to update
  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  expect(await card.html()).toContain('Detected sync issues');
  expect(await card.html()).toContain('behind local time');
});

it("Browser ahead", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "timer.test1", debug: true },
  ], { title: '-1000'});
  const card = dashboard.cards[0];

  await new Promise(r => setTimeout(r, 500)); // Wait for time offset to update
  await hass.callService("timer", "start", {}, { entity_id: "timer.test1" });
  expect(await card.html()).toContain('Detected sync issues');
  expect(await card.html()).toContain('ahead of local time');
});
