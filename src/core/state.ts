import fs from "fs";
import path from "path";
import os from "os";
import { GameState, INITIAL_CATCH_RATE, STARTER_BYTLINGS, AchievementTracking } from "./types.js";

function defaultTracking(): AchievementTracking {
  return {
    totalCommits: 0,
    repos: [],
    fixCommits: 0,
    refactorCommits: 0,
    streakDays: 0,
    longestStreak: 0,
    lastActiveDate: "",
    toolUsage: {},
    promptCount: 0,
    prsMerged: 0,
    prsReviewed: 0,
  };
}

function defaultState(): GameState {
  return {
    version: 2,
    creatures: {},
    totalCatches: 0,
    currentCatchRate: INITIAL_CATCH_RATE,
    stats: { sessionsPlayed: 0, firstSession: "" },
    unlockedBytlings: [...STARTER_BYTLINGS],
    achievements: {},
    achievementTracking: defaultTracking(),
    catchHistory: [],
  };
}

export function migrateState(state: any): GameState {
  if (state.version === 2) return state as GameState;

  const caughtIds = Object.keys(state.creatures || {});
  const unlocked = new Set([...STARTER_BYTLINGS, ...caughtIds]);

  return {
    ...state,
    version: 2,
    unlockedBytlings: [...unlocked],
    achievements: {},
    achievementTracking: defaultTracking(),
    catchHistory: [],
  };
}

export const DEFAULT_STATE_PATH = path.join(os.homedir(), ".catchem", "state.json");

export class StateManager {
  constructor(
    private filePath: string = path.join(os.homedir(), ".catchem", "state.json"),
  ) {}

  load(): GameState {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.version) {
        return defaultState();
      }
      return migrateState(data);
    } catch {
      return defaultState();
    }
  }

  save(state: GameState): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = this.filePath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.renameSync(tmpPath, this.filePath);
    } catch {
      fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2));
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  }
}
