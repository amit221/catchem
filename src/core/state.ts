import fs from "fs";
import path from "path";
import os from "os";
import { GameState, INITIAL_CATCH_RATE } from "./types";

function defaultState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    currentCatchRate: INITIAL_CATCH_RATE,
    stats: {
      sessionsPlayed: 0,
      firstSession: "",
    },
  };
}

export const DEFAULT_STATE_PATH = path.join(os.homedir(), ".catchem", "state.json");

export class StateManager {
  constructor(private filePath: string = DEFAULT_STATE_PATH) {}

  load(): GameState {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.version) {
        return defaultState();
      }
      return data as GameState;
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
