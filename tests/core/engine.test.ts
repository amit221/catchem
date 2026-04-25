import { tryCatch } from "../../src/core/engine";
import { GameState, INITIAL_CATCH_RATE, BASE_CATCH_RATE, CATCH_RATE_INCREMENT } from "../../src/core/types";

function emptyState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    currentCatchRate: INITIAL_CATCH_RATE,
    stats: { sessionsPlayed: 0, firstSession: "" },
  };
}

describe("tryCatch", () => {
  it("guarantees first catch (100% rate)", () => {
    const state = emptyState();
    const result = tryCatch(state, { rng: () => 0.99 });
    expect(result).not.toBeNull();
    expect(result!.isNew).toBe(true);
  });

  it("resets catch rate after successful catch", () => {
    const state = emptyState();
    tryCatch(state, { rng: () => 0.01 });
    expect(state.currentCatchRate).toBe(BASE_CATCH_RATE);
  });

  it("returns null when rng exceeds current catch rate", () => {
    const state = emptyState();
    state.currentCatchRate = BASE_CATCH_RATE;
    const result = tryCatch(state, { rng: () => 0.5 });
    expect(result).toBeNull();
  });

  it("increases catch rate on miss", () => {
    const state = emptyState();
    state.currentCatchRate = BASE_CATCH_RATE;
    tryCatch(state, { rng: () => 0.9 }); // miss
    expect(state.currentCatchRate).toBeCloseTo(BASE_CATCH_RATE + CATCH_RATE_INCREMENT);
  });

  it("caps catch rate at 100%", () => {
    const state = emptyState();
    state.currentCatchRate = 0.98;
    tryCatch(state, { rng: () => 0.99 }); // miss
    expect(state.currentCatchRate).toBe(1.0);
  });

  it("catches when rng is below current rate", () => {
    const state = emptyState();
    state.currentCatchRate = BASE_CATCH_RATE;
    const result = tryCatch(state, { rng: () => 0.01 });
    expect(result).not.toBeNull();
    expect(result!.creature).toBeDefined();
  });

  it("mutates state on successful catch", () => {
    const state = emptyState();
    tryCatch(state, { rng: () => 0.01 });
    expect(state.totalCatches).toBe(1);
    expect(Object.keys(state.creatures)).toHaveLength(1);
  });

  it("detects new creature correctly", () => {
    const state = emptyState();
    const result1 = tryCatch(state, { rng: () => 0.01 });
    expect(result1!.isNew).toBe(true);

    state.currentCatchRate = 1.0; // force catch
    const result2 = tryCatch(state, { rng: () => 0.01 });
    expect(result2!.isNew).toBe(false);
  });

  it("detects level up", () => {
    const state = emptyState();
    // Catch same creature 3 times (level 1 to 2 at 3 catches)
    tryCatch(state, { rng: () => 0.01 });
    state.currentCatchRate = 1.0;
    tryCatch(state, { rng: () => 0.01 });
    state.currentCatchRate = 1.0;
    const result = tryCatch(state, { rng: () => 0.01 });
    expect(result!.leveledUp).toBe(true);
    expect(result!.level).toBe(2);
  });

  it("increments totalCatches across multiple catches", () => {
    const state = emptyState();
    tryCatch(state, { rng: () => 0.01 });
    state.currentCatchRate = 1.0;
    tryCatch(state, { rng: () => 0.01 });
    state.currentCatchRate = 1.0;
    tryCatch(state, { rng: () => 0.01 });
    expect(state.totalCatches).toBe(3);
  });

  it("pity timer accumulates over multiple misses", () => {
    const state = emptyState();
    state.currentCatchRate = BASE_CATCH_RATE;
    // Miss 3 times
    tryCatch(state, { rng: () => 0.9 });
    tryCatch(state, { rng: () => 0.9 });
    tryCatch(state, { rng: () => 0.9 });
    expect(state.currentCatchRate).toBeCloseTo(BASE_CATCH_RATE + 3 * CATCH_RATE_INCREMENT);
  });

  it("treats rng exactly at catch rate as a miss", () => {
    const state = emptyState();
    state.currentCatchRate = 0.5;
    const result = tryCatch(state, { rng: () => 0.5 });
    expect(result).toBeNull();
    expect(state.currentCatchRate).toBeCloseTo(0.5 + CATCH_RATE_INCREMENT);
  });

  it("works with no options argument", () => {
    const state = emptyState();
    // First catch should always succeed (rate = 1.0)
    const result = tryCatch(state);
    expect(result).not.toBeNull();
  });
});
