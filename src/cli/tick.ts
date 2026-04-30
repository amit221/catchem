import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { StateManager } from "../core/state.js";
import { tryCatch } from "../core/engine.js";
import { formatCatchNotification, formatAchievementUnlock } from "../core/notification.js";
import { getNextLevelThreshold } from "../core/leveling.js";
import { updateTracking, TrackingInput } from "../core/achievement-tracker.js";
import { checkAchievements, applyUnlocks } from "../core/achievements.js";
import { generateGistMarkdown } from "../social/gist.js";

const GIST_SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function runTick(toolName?: string): void {
  const mgr = new StateManager();
  const state = mgr.load();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Track session stats
  if (!state.stats.firstSession) {
    state.stats.firstSession = now.toISOString();
  }
  state.stats.sessionsPlayed = (state.stats.sessionsPlayed ?? 0) + 1;

  // PostToolUse ticks: only update tool counter and save, skip catch logic
  if (toolName) {
    const trackingInput: TrackingInput = { today, toolName };
    updateTracking(state.achievementTracking, trackingInput);
    // Check tool-based achievements only
    const newAchievements = checkAchievements(state, now, false);
    if (newAchievements.length > 0) {
      applyUnlocks(state, newAchievements);
      for (const achievement of newAchievements) {
        console.log(formatAchievementUnlock(achievement.name, achievement.unlocks));
      }
    }
    mgr.save(state);
    return;
  }

  // --- UserPromptSubmit tick: full catch logic ---

  // Build tracking input
  const trackingInput: TrackingInput = { today, isPrompt: true };
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
  const newAchievements = checkAchievements(state, now, !!result);
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

  // Sync gist (rate-limited: once every 4 hours, synchronous but silent)
  if (result) {
    try {
      const configPath = path.join(os.homedir(), ".catchem", "config.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
        gist?: { enabled?: boolean; gistId?: string; username?: string };
        lastGistSync?: string;
      };
      if (config.gist?.enabled && config.gist.gistId && config.gist.username) {
        const lastSync = config.lastGistSync ? new Date(config.lastGistSync).getTime() : 0;
        if (now.getTime() - lastSync > GIST_SYNC_INTERVAL_MS) {
          const md = generateGistMarkdown(state, config.gist.username);
          const tmpFile = path.join(os.tmpdir(), "catchem-gist-sync.md");
          fs.writeFileSync(tmpFile, md, "utf8");
          // Update last sync time immediately (prevents retries if gh is slow)
          config.lastGistSync = now.toISOString();
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          // Fire-and-forget async — never blocks the prompt
          exec(`gh gist edit ${config.gist.gistId} --add "${tmpFile}"`, {
            timeout: 30000, windowsHide: true,
          }, () => {
            try { fs.unlinkSync(tmpFile); } catch {}
          });
        }
      }
    } catch { /* gist sync failed silently */ }
  }
}
