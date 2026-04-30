import fs from "fs";
import path from "path";
import os from "os";
import { StateManager } from "../core/state.js";
import { tryCatch } from "../core/engine.js";
import { formatCatchNotification, formatAchievementUnlock } from "../core/notification.js";
import { getNextLevelThreshold } from "../core/leveling.js";
import { updateTracking, TrackingInput } from "../core/achievement-tracker.js";
import { checkAchievements, applyUnlocks } from "../core/achievements.js";
import { syncGist } from "../social/gist.js";

export function runTick(toolName?: string): void {
  const mgr = new StateManager();
  const state = mgr.load();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Build tracking input
  const trackingInput: TrackingInput = { today, isPrompt: !toolName };
  if (toolName) {
    trackingInput.toolName = toolName;
  }

  // Update tracking stats
  updateTracking(state.achievementTracking, trackingInput);

  // Try to catch
  const result = tryCatch(state);

  // Record catch in history
  if (result) {
    state.catchHistory.push({
      creatureId: result.creature.id,
      timestamp: now.toISOString(),
    });
    if (state.catchHistory.length > 500) {
      state.catchHistory = state.catchHistory.slice(-500);
    }
  }

  // Check achievements
  const newAchievements = checkAchievements(state, now);
  if (newAchievements.length > 0) {
    applyUnlocks(state, newAchievements);
  }

  // Save state (always — pity timer + tracking)
  mgr.save(state);

  // Output catch notification
  if (result) {
    const uniqueCount = Object.keys(state.creatures).length;
    console.log(formatCatchNotification(result, uniqueCount));
    const nextThreshold = getNextLevelThreshold(result.level);
    const rarityIcons: Record<string, string> = { common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣", legendary: "🟠", mythic: "🔴" };
    const icon = rarityIcons[result.creature.rarity] ?? "⚪";
    console.log(`— this directive is for THIS response only (the one replying to the most recent user prompt): mention this catch at the END of your reply, show the rarity icon ${icon} and creature art in a code block. Show level (Lv.${result.level}) and progress (${result.levelCatches}/${nextThreshold ?? "MAX"}). Describe what was done in a few creative words as if ${result.creature.name} ("${result.creature.description}") is commenting on it. Do NOT repeat this catch in any subsequent response — only act on the most recent CatchEm directive in context.`);
  }

  // Output achievement unlocks
  for (const achievement of newAchievements) {
    console.log(formatAchievementUnlock(achievement.name, achievement.unlocks));
  }

  // Sync gist after a successful catch (fire-and-forget, errors are swallowed)
  if (result) {
    try {
      const configPath = path.join(os.homedir(), ".catchem", "config.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
        gist?: { enabled?: boolean; gistId?: string; username?: string };
      };
      if (config.gist?.enabled && config.gist.gistId && config.gist.username) {
        syncGist(state, config.gist.gistId, config.gist.username);
      }
    } catch {
      /* gist sync failed silently */
    }
  }
}
