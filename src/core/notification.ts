import { CatchResult, RARITY_LABELS, LEVEL_THRESHOLDS } from "./types.js";
import { getAllCreatures } from "./registry.js";
import { getNextLevelThreshold, getCatchesForNextLevel } from "./leveling.js";

export function formatCatchNotification(result: CatchResult, uniqueCount: number): string {
  const totalCreatures = getAllCreatures().length;

  if (result.isNew) {
    return formatNewCreature(result, uniqueCount, totalCreatures);
  }
  if (result.leveledUp) {
    return formatLevelUp(result);
  }
  return formatNormalCatch(result);
}

function formatNewCreature(result: CatchResult, uniqueCount: number, totalCreatures: number): string {
  const border = "✨🌟✨🌟✨🌟✨🌟✨🌟✨🌟✨";
  const rarityLabel = RARITY_LABELS[result.creature.rarity];
  const lines = [
    border,
    `🌟 NEW CREATURE DISCOVERED! 🌟`,
    `✨ ${result.creature.name} ✨`,
    `${rarityLabel}`,
    border,
    "",
    `[Lv.${result.level}]  "${result.flavorText}"`,
    ...result.creature.art,
    "",
    `${uniqueCount}/${totalCreatures} discovered`,
    border,
  ];
  return lines.join("\n");
}

function formatLevelUp(result: CatchResult): string {
  const border = "🎉✨🎉✨🎉✨🎉✨🎉✨🎉✨🎉";
  const nextThreshold = getNextLevelThreshold(result.level);
  const remaining = getCatchesForNextLevel(result.level, result.catchCount);
  const progressLine = nextThreshold
    ? `⭐ Next level: ${remaining} more catches ⭐`
    : "✦ MAX LEVEL ✦";

  const lines = [
    border,
    `🌟 LEVEL UP! 🌟`,
    `✨ ${result.creature.name} reached Level ${result.level}! ✨`,
    border,
    "",
    `[Lv.${result.level}] ${makeProgressBar(result.catchCount, nextThreshold)} ${result.catchCount}/${nextThreshold ?? result.catchCount}  "${result.flavorText}"`,
    ...result.creature.art,
    "",
    progressLine,
    border,
  ];
  return lines.join("\n");
}

function formatNormalCatch(result: CatchResult): string {
  const nextThreshold = getNextLevelThreshold(result.level);
  const lines = [
    `✨ You caught a ${result.creature.name}! (x${result.catchCount})`,
    `[Lv.${result.level}] ${makeProgressBar(result.catchCount, nextThreshold)} ${result.catchCount}/${nextThreshold ?? result.catchCount}  "${result.flavorText}"`,
    ...result.creature.art,
  ];
  return lines.join("\n");
}

function makeProgressBar(current: number, target: number | null): string {
  if (!target) return "██████████";
  const idx = (LEVEL_THRESHOLDS as readonly number[]).indexOf(target);
  const prev = idx > 0 ? LEVEL_THRESHOLDS[idx - 1] : 0;
  const progress = (current - prev) / (target - prev);
  const filled = Math.min(10, Math.floor(progress * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}
