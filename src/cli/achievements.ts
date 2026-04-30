import { StateManager } from "../core/state.js";
import { loadAchievementDefinitions, checkAchievements, applyUnlocks } from "../core/achievements.js";
import { updateTracking } from "../core/achievement-tracker.js";
import { isGitRepo, getCommitCount, getRepoId, getCommitStats } from "../core/git.js";

const CATEGORY_LABELS: Record<string, string> = {
  "early-game": "Early Game",
  "catch-milestones": "Catch Milestones",
  "discovery": "Discovery",
  "leveling": "Leveling",
  "themes": "Theme Completion",
  "streak": "Streak & Consistency",
  "time": "Time-Based",
  "git": "Git Activity",
  "tools": "Tool Usage",
  "social": "Social / GitHub",
  "special": "Special",
};

export function showAchievements(): void {
  const mgr = new StateManager();
  const state = mgr.load();

  // Update git stats on demand
  if (isGitRepo()) {
    try {
      const repoId = getRepoId();
      if (repoId) {
        const stats = getCommitStats();
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        updateTracking(state.achievementTracking, {
          today: todayStr,
          git: {
            commitCount: getCommitCount(),
            fixCommits: stats.fixCommits,
            refactorCommits: stats.refactorCommits,
            biggestDiff: stats.biggestDiff,
            repoId,
          },
        });
        // Check if any new achievements unlocked
        const newAchievements = checkAchievements(state, today);
        if (newAchievements.length > 0) {
          applyUnlocks(state, newAchievements);
          mgr.save(state);
          for (const a of newAchievements) {
            console.log(`🏆 Achievement Unlocked: ${a.name}!`);
          }
        }
      }
    } catch { /* git unavailable */ }
  }

  const defs = loadAchievementDefinitions();

  const unlocked = Object.keys(state.achievements).length;
  const total = defs.length;
  console.log(`\n🏆 Achievements: ${unlocked}/${total}\n`);

  const grouped = new Map<string, typeof defs>();
  for (const def of defs) {
    const cat = def.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(def);
  }

  for (const [category, achievements] of grouped) {
    const label = CATEGORY_LABELS[category] ?? category;
    console.log(`── ${label} ──`);
    for (const def of achievements) {
      const achieved = state.achievements[def.id];
      if (def.hidden && !achieved) {
        console.log(`  ⬜ ??? — Hidden achievement`);
      } else if (achieved) {
        const tierStr = achieved.tier ? ` (${achieved.tier})` : "";
        console.log(`  ✅ ${def.name}${tierStr} — ${def.unlocks.length} Bytling(s) unlocked`);
      } else {
        console.log(`  ⬜ ${def.name} — ${formatCondition(def)}`);
      }
    }
    console.log();
  }
}

function formatCondition(def: ReturnType<typeof loadAchievementDefinitions>[0]): string {
  const { condition } = def;
  switch (condition.type) {
    case "totalCatches": return `Catch ${condition.threshold} Bytlings`;
    case "uniqueDiscovered": return `Discover ${condition.threshold} unique Bytlings`;
    case "maxLevel": return `Level any Bytling to Lv.${condition.threshold}`;
    case "themesCompleted": return `Complete ${condition.threshold} theme(s)`;
    case "streak": return `Code ${condition.threshold} days in a row`;
    case "promptCount": return `Submit ${condition.threshold} prompt(s)`;
    case "commits": return `${condition.threshold} total commits`;
    case "fixCommits": return `${condition.threshold} fix commits`;
    case "refactorCommits": return `${condition.threshold} refactor commits`;
    case "bigDiff": return `${condition.threshold}+ lines in a single commit`;
    case "repos": return `Use CatchEm in ${condition.threshold}+ repos`;
    case "toolUsage": return `Use ${condition.toolName} tool ${condition.threshold} times`;
    case "timeOfDay": return `Catch between ${condition.timeRange?.[0]}:00–${condition.timeRange?.[1]}:00`;
    case "dayOfWeek": return `Catch on a weekend`;
    case "daysPlayed": return `Play for ${condition.threshold}+ days`;
    case "creatureCatches": return `Catch ${condition.creatureId} ${condition.threshold} times`;
    case "prsMerged": return `Merge ${condition.threshold} PRs`;
    case "prsReviewed": return `Review ${condition.threshold} PRs`;
    case "firstSession": return `Complete your first session`;
    default: return "???";
  }
}
