import { multiply, HomeAssistant, HassCard, PlaywrightBrowser, PlaywrightElement, PlaywrightPage } from "hass-taste-test";
import { Browser, BrowserContext } from "playwright";

const CONFIGURATION_YAML = `
timer:
  ${multiply(6, (i) => `
  test${i}:
    duration: "00:01:00"
`)}
  ${multiply(8, (i) => `
  countdown${i}:
    duration: "00:00:06"
`)}

input_boolean:
  attr_timer_on:
    initial: false

input_number:
  attr_timer_bump:
    min: 0
    max: 100
    initial: 0

template:
  - sensor:
    - name: Attr timer
      state: '{{ states("input_boolean.attr_timer_on") }}'
      attributes:
        end_time: '{{ (states.input_boolean.attr_timer_on.last_changed + timedelta(seconds=60)).isoformat() }}'
        bump: '{{ states("input_number.attr_timer_bump") }}'
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

it("Attribute-only update does not skew fixed clock", async () => {
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entity: "sensor.attr_timer", end_time: { attribute: "end_time" }, sync_issues: "fix" },
  ]);
  const card = dashboard.cards[0];
  await waitForState(card, "off");

  await hass.callService("input_boolean", "turn_on", {}, { entity_id: "input_boolean.attr_timer_on" });
  await waitForState(card, "on");

  // Change only an attribute a few seconds after the state change. last_changed stays at the
  // start time, so measuring the clock offset from it would mistake elapsed time for clock skew.
  await new Promise(r => setTimeout(r, 2500));
  await hass.callService("input_number", "set_value", { value: 1 }, { entity_id: "input_number.attr_timer_bump" });
  await new Promise(r => setTimeout(r, 500));

  // ~3s into a 60s timer. A skewed correction would push this back up to 60.
  const remaining = parseInt(await card.narrow(".text-content").text());
  expect(remaining).toBeLessThanOrEqual(58);
});

it("Fixed clock counts down without skipping seconds", async () => {
  // With sync_issues: fix, the remaining time is a whole number when the update arrives, so ticks
  // that aren't scheduled carefully land right on the second boundary and jitter skips digits (#66).
  // Several timers started at different moments each get their own chance to skip.
  const entities = Array.from({ length: 8 }, (_, i) => `timer.countdown${i + 1}`);
  const dashboard = await hass.Dashboard([
    { type: "custom:timer-bar-card", entities, sync_issues: "fix" },
  ], { title: "1500" });
  const page = (dashboard.page as PlaywrightPage).playwright;
  const texts = page.locator("timer-bar-entity-row .text-content");
  await page.waitForFunction(() => (window as any).offset != 0);
  while ((await texts.allTextContents()).filter(t => /idle/i.test(t)).length < entities.length)
    await new Promise(r => setTimeout(r, 50));

  for (const entity_id of entities) await hass.callService("timer", "start", {}, { entity_id });

  // Record every number each row displays
  const shown: number[][] = entities.map(() => []);
  const end = Date.now() + 6500;
  while (Date.now() < end) {
    (await texts.allTextContents()).forEach((text, i) => {
      const n = parseInt(text);
      if (!isNaN(n) && shown[i][shown[i].length - 1] !== n) shown[i].push(n);
    });
  }

  for (const row of shown) expect(row).toEqual(row.map((_, i) => row[0] - i)); // e.g. 6,5,4,3,2,1
}, 20000);
