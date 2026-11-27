import { stateMode } from "../src/helpers";

function hassWithState(state: string) {
  return {
    states: {
      "timer.test": {
        entity_id: "timer.test",
        state,
        attributes: { remaining: "00:00:08" },
        last_changed: "2026-01-01T00:00:00.000Z",
      },
    },
  } as any;
}

const config = {
  type: "custom:timer-bar-card",
  entity: "timer.test",
  active_state: ["active", "paused"],
  pause_state: "paused",
  waiting_state: "waiting",
} as any;

it("prioritizes pause_state when it overlaps active_state", () => {
  expect(stateMode(hassWithState("paused"), config, 0)).toBe("pause");
});

it("keeps waiting_state ahead of active_state", () => {
  expect(stateMode(hassWithState("waiting"), {
    ...config,
    active_state: ["active", "waiting"],
  }, 0)).toBe("waiting");
});
