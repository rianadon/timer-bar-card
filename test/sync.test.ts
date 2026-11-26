import { multiply, HomeAssistant, HassCard, PlaywrightBrowser, PlaywrightElement, PlaywrightPage } from "hass-taste-test";
import { Browser, BrowserContext } from "playwright";

const CONFIGURATION_YAML = `
timer:
  ${multiply(6, (i) => `
  test${i}:
    duration: "00:01:00"
`)}
`;

let hass: HomeAssistant<PlaywrightElement>;
let testNumber = 0;

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

/** Wait until the card's entity row has rendered the given timer state */
async function waitForState(card: HassCard<PlaywrightElement>, state: string) {
  const deadline = Date.now() + 5000;
  while (!(await card.html()).includes(`data-state="${state}"`)) {
    if (Date.now() > deadline) throw new Error(`Timed out waiting for the card to show state ${state}`);
    await new Promise(r => setTimeout(r, 50));
  }
}

async function setupTest(offset: number, sync_issues?: string) {
  const entity = `timer.test${++testNumber}`
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity, sync_issues, debug: true },
  ], { title: String(offset) });
  const card = dashboard.cards[0];

  const page = (dashboard.page as PlaywrightPage).playwright;
  await page.waitForFunction(() => (window as any).offset != 0); // Wait for offset to update
  // The card only measures clock offset on state *changes*, so it must have rendered the idle
  // state before the timer starts. Otherwise the start arrives as the card's first render, is
  // never measured, and the card can't confirm the offset with two matching measurements.
  await waitForState(card, "idle");

  await new Promise(r => setTimeout(r, 1100 - Date.now() % 1000));
  const started = Date.now();
  await hass.callService("timer", "start", {}, { entity_id: entity });
  await waitForState(card, "active");
  await new Promise(r => setTimeout(r, Math.max(0, started + 1000 - Date.now())));
  // Update the timer state twice so that the card catches the sync error
  await hass.callService("timer", "pause", {}, { entity_id: entity });
  await waitForState(card, "paused");
  return card;
}


beforeAll(async () => {
  hass = await HomeAssistant.create(CONFIGURATION_YAML, {
    browser: new ModPlaywrightBrowser(process.env.BROWSER || "firefox"),
  });
  await hass.addResource(__dirname + "/../dist/timer-bar-card.js", "module");
}, 30000);
afterAll(async () => await hass.close());

it("Browser behind", async () => {
  const card = await setupTest(1000);
  expect(await card.html()).toContain('Detected sync issues');
  expect(await card.html()).toContain('behind app time');
});

it("Browser behind, ignored", async () => {
  const card = await setupTest(1000, 'ignore');
  expect(await card.html()).not.toContain('Detected sync issues');
  expect(await card.html()).not.toContain('behind app time');
});

it("Browser behind, fixed", async () => {
  const card = await setupTest(5000, 'fix');
  expect(await card.narrow(".text-content").text()).toBe('59');
});

it("Browser ahead", async () => {
  const card = await setupTest(-1000);
  expect(await card.html()).toContain('Detected sync issues');
  expect(await card.html()).toContain('ahead of app time');
});

it("Browser ahead, ignored", async () => {
  const card = await setupTest(-1000, 'ignore');
  expect(await card.html()).not.toContain('Detected sync issues');
  expect(await card.html()).not.toContain('behind app time');
});

it("Browser ahead, fixed", async () => {
  const card = await setupTest(-5000, 'fix');
  expect(await card.narrow(".text-content").text()).toBe('59');
});
