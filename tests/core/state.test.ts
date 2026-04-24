import fs from "fs";
import path from "path";
import os from "os";
import { StateManager } from "../../src/core/state";
import { INITIAL_CATCH_RATE } from "../../src/core/types";

function tempStatePath(): string {
  return path.join(os.tmpdir(), `catchem-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

describe("StateManager", () => {
  it("returns default state when file does not exist", () => {
    const mgr = new StateManager(tempStatePath());
    const state = mgr.load();
    expect(state.version).toBe(1);
    expect(state.totalCatches).toBe(0);
    expect(state.creatures).toEqual({});
    expect(state.currentCatchRate).toBe(INITIAL_CATCH_RATE);
  });

  it("saves and loads state round-trip", () => {
    const filePath = tempStatePath();
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    state.totalCatches = 42;
    state.currentCatchRate = 0.35;
    state.creatures["zappik"] = {
      name: "Zappik",
      catchCount: 5,
      level: 2,
      firstCaught: "2026-01-01T00:00:00Z",
      lastCaught: "2026-01-02T00:00:00Z",
    };
    mgr.save(state);

    const loaded = mgr.load();
    expect(loaded.totalCatches).toBe(42);
    expect(loaded.currentCatchRate).toBe(0.35);
    expect(loaded.creatures["zappik"].catchCount).toBe(5);
    expect(loaded.creatures["zappik"].level).toBe(2);
  });

  it("handles corrupted file gracefully", () => {
    const filePath = tempStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "not json at all");
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    expect(state.version).toBe(1);
    expect(state.totalCatches).toBe(0);
  });

  it("creates directory if it does not exist", () => {
    const filePath = path.join(os.tmpdir(), `catchem-deep-${Date.now()}`, "nested", "state.json");
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    state.totalCatches = 1;
    mgr.save(state);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
