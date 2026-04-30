import { checkAchievements, loadAchievementDefinitions, applyUnlocks } from "../../src/core/achievements";
import { GameState, STARTER_BYTLINGS, AchievementTracking } from "../../src/core/types";

function emptyTracking(): AchievementTracking {
  return {
    totalCommits: 0, repos: [], fixCommits: 0, refactorCommits: 0,
    streakDays: 0, longestStreak: 0, lastActiveDate: "",
    toolUsage: {}, promptCount: 0, prsMerged: 0, prsReviewed: 0,
  };
}

function testState(overrides: Partial<GameState> = {}): GameState {
  return {
    version: 2,
    creatures: {},
    totalCatches: 0,
    currentCatchRate: 1.0,
    stats: { sessionsPlayed: 0, firstSession: "" },
    unlockedBytlings: [...STARTER_BYTLINGS],
    achievements: {},
    achievementTracking: emptyTracking(),
    catchHistory: [],
    ...overrides,
  };
}

describe("loadAchievementDefinitions", () => {
  it("loads all 57 definitions", () => {
    const defs = loadAchievementDefinitions();
    expect(defs.length).toBe(57);
  });

  it("each definition has required fields", () => {
    const defs = loadAchievementDefinitions();
    for (const def of defs) {
      expect(def.id).toBeTruthy();
      expect(def.name).toBeTruthy();
      expect(def.condition).toBeDefined();
      expect(Array.isArray(def.unlocks)).toBe(true);
      expect(def.unlocks.length).toBeGreaterThan(0);
    }
  });
});

describe("checkAchievements", () => {
  it("returns empty array when no achievements are new", () => {
    const state = testState();
    const result = checkAchievements(state);
    expect(result).toEqual([]);
  });

  it("unlocks first-steps on promptCount >= 1", () => {
    const state = testState();
    state.achievementTracking.promptCount = 1;
    const result = checkAchievements(state);
    const firstSteps = result.find(r => r.id === "first-steps");
    expect(firstSteps).toBeDefined();
    expect(firstSteps!.unlocks).toContain("blazard");
    expect(firstSteps!.unlocks).toContain("rustbot");
  });

  it("unlocks first-catch on totalCatches >= 1", () => {
    const state = testState({ totalCatches: 1 });
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "first-catch")).toBeDefined();
  });

  it("does not re-unlock already achieved", () => {
    const state = testState({ totalCatches: 1 });
    state.achievements["first-catch"] = { unlockedAt: "2026-01-01", bytlingsUnlocked: ["aquashell", "frostbow"] };
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "first-catch")).toBeUndefined();
  });

  it("unlocks streak achievements", () => {
    const state = testState();
    state.achievementTracking.streakDays = 7;
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "on-a-roll")).toBeDefined();
    expect(result.find(r => r.id === "dedicated")).toBeDefined();
  });

  it("unlocks discovery milestone", () => {
    const state = testState();
    for (let i = 0; i < 10; i++) {
      state.creatures[`creature-${i}`] = { name: `C${i}`, catchCount: 1, levelCatches: 1, level: 1, firstCaught: "", lastCaught: "" };
    }
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "explorer")).toBeDefined();
  });

  it("unlocks max level achievement", () => {
    const state = testState();
    state.creatures.zappik = { name: "Zappik", catchCount: 100, levelCatches: 10, level: 5, firstCaught: "", lastCaught: "" };
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "dedicated-trainer")).toBeDefined();
  });

  it("unlocks night-owl at 2am", () => {
    const state = testState({ totalCatches: 1 });
    const nightTime = new Date("2026-04-30T02:00:00");
    const result = checkAchievements(state, nightTime);
    expect(result.find(r => r.id === "night-owl")).toBeDefined();
  });

  it("unlocks git commit achievement", () => {
    const state = testState();
    state.achievementTracking.totalCommits = 100;
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "hundred-commits")).toBeDefined();
  });

  it("unlocks tool usage achievement", () => {
    const state = testState();
    state.achievementTracking.toolUsage.Edit = 100;
    const result = checkAchievements(state);
    expect(result.find(r => r.id === "file-surgeon")).toBeDefined();
  });
});

describe("applyUnlocks", () => {
  it("adds achievements to state", () => {
    const state = testState();
    applyUnlocks(state, [{ id: "first-catch", name: "First Catch", unlocks: ["aquashell", "frostbow"] }]);
    expect(state.achievements["first-catch"]).toBeDefined();
    expect(state.achievements["first-catch"].bytlingsUnlocked).toEqual(["aquashell", "frostbow"]);
  });

  it("adds unlocked bytlings to pool", () => {
    const state = testState();
    applyUnlocks(state, [{ id: "first-catch", name: "First Catch", unlocks: ["aquashell", "frostbow"] }]);
    expect(state.unlockedBytlings).toContain("aquashell");
    expect(state.unlockedBytlings).toContain("frostbow");
  });

  it("does not duplicate bytlings in pool", () => {
    const state = testState();
    state.unlockedBytlings.push("aquashell");
    applyUnlocks(state, [{ id: "first-catch", name: "First Catch", unlocks: ["aquashell", "frostbow"] }]);
    const count = state.unlockedBytlings.filter(b => b === "aquashell").length;
    expect(count).toBe(1);
  });
});
