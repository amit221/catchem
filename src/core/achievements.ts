import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AchievementDefinition, GameState } from "./types.js";
import { getAllCreatures } from "./registry.js";

const _dir = path.dirname(fileURLToPath(import.meta.url));
const defsPath = path.join(_dir, "../../creatures/achievement-definitions.json");

let _definitions: AchievementDefinition[] | null = null;

export function loadAchievementDefinitions(): AchievementDefinition[] {
  if (!_definitions) {
    _definitions = JSON.parse(fs.readFileSync(defsPath, "utf8"));
  }
  return _definitions!;
}

export interface AchievementUnlock {
  id: string;
  name: string;
  unlocks: string[];
  tier?: string;
}

export function checkAchievements(state: GameState, now: Date = new Date()): AchievementUnlock[] {
  const defs = loadAchievementDefinitions();
  const newUnlocks: AchievementUnlock[] = [];

  for (const def of defs) {
    if (state.achievements[def.id]) continue;
    if (isConditionMet(def, state, now)) {
      newUnlocks.push({ id: def.id, name: def.name, unlocks: def.unlocks, tier: def.tier });
    }
  }

  return newUnlocks;
}

function isConditionMet(def: AchievementDefinition, state: GameState, now: Date): boolean {
  const { condition } = def;
  const tracking = state.achievementTracking;

  switch (condition.type) {
    case "totalCatches":
      return state.totalCatches >= (condition.threshold ?? 0);

    case "uniqueDiscovered":
      return Object.keys(state.creatures).length >= (condition.threshold ?? 0);

    case "maxLevel": {
      const maxLvl = Object.values(state.creatures).reduce((max, c) => Math.max(max, c.level), 0);
      return maxLvl >= (condition.threshold ?? 0);
    }

    case "themesCompleted": {
      const allCreatures = getAllCreatures();
      const themes = new Map<string, Set<string>>();
      for (const c of allCreatures) {
        if (!themes.has(c.theme)) themes.set(c.theme, new Set());
        themes.get(c.theme)!.add(c.id);
      }
      let completed = 0;
      for (const [, themeCreatures] of themes) {
        const allCaught = [...themeCreatures].every((id) => id in state.creatures);
        if (allCaught) completed++;
      }
      return completed >= (condition.threshold ?? 0);
    }

    case "streak":
      return tracking.streakDays >= (condition.threshold ?? 0);

    case "promptCount":
      return tracking.promptCount >= (condition.threshold ?? 0);

    case "commits":
      return tracking.totalCommits >= (condition.threshold ?? 0);

    case "fixCommits":
      return tracking.fixCommits >= (condition.threshold ?? 0);

    case "refactorCommits":
      return tracking.refactorCommits >= (condition.threshold ?? 0);

    case "bigDiff":
      return false; // Tracked via git stats during tick — needs live data

    case "repos":
      return tracking.repos.length >= (condition.threshold ?? 0);

    case "toolUsage": {
      const toolName = condition.toolName ?? "";
      return (tracking.toolUsage[toolName] ?? 0) >= (condition.threshold ?? 0);
    }

    case "timeOfDay": {
      if (!condition.timeRange || state.totalCatches === 0) return false;
      const hour = now.getHours();
      return hour >= condition.timeRange[0] && hour < condition.timeRange[1];
    }

    case "dayOfWeek": {
      if (!condition.days || state.totalCatches === 0) return false;
      return condition.days.includes(now.getDay());
    }

    case "newYear": {
      if (state.totalCatches === 0) return false;
      return now.getMonth() === 0 && now.getDate() === 1;
    }

    case "firstSession":
      return (state.stats.sessionsPlayed ?? 0) >= 1;

    case "daysPlayed": {
      if (!state.stats.firstSession) return false;
      const first = new Date(state.stats.firstSession);
      const diffDays = Math.floor((now.getTime() - first.getTime()) / 86400000);
      return diffDays >= (condition.threshold ?? 0);
    }

    case "creatureCatches": {
      const creatureId = condition.creatureId ?? "";
      const entry = state.creatures[creatureId];
      return entry ? entry.catchCount >= (condition.threshold ?? 0) : false;
    }

    case "prsMerged":
      return tracking.prsMerged >= (condition.threshold ?? 0);

    case "prsReviewed":
      return tracking.prsReviewed >= (condition.threshold ?? 0);

    case "ossContrib":
    case "connected":
    case "starredRepo":
      return false; // Requires connect — Phase 3

    default:
      return false;
  }
}

export function applyUnlocks(state: GameState, unlocks: AchievementUnlock[]): void {
  const now = new Date().toISOString();
  for (const unlock of unlocks) {
    state.achievements[unlock.id] = {
      tier: unlock.tier as any,
      unlockedAt: now,
      bytlingsUnlocked: unlock.unlocks,
    };
    for (const creatureId of unlock.unlocks) {
      if (!state.unlockedBytlings.includes(creatureId)) {
        state.unlockedBytlings.push(creatureId);
      }
    }
  }
}
