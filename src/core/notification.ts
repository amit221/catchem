import { CatchResult } from "./types.js";
import { getAllCreatures } from "./registry.js";
import { getNextLevelThreshold } from "./leveling.js";

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
  const nextThreshold = getNextLevelThreshold(result.level);
  const lines = [
    border,
    `🌟 NEW CREATURE DISCOVERED! 🌟`,
    `✨ ${rarityTag(result.creature.rarity)} ${result.creature.name} ✨`,
    border,
    "",
    formatProgress(result.level, result.levelCatches, nextThreshold),
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
  const remaining = nextThreshold ? nextThreshold - result.levelCatches : 0;
  const progressLine = nextThreshold
    ? `⭐ Next level: ${remaining} more catches ⭐`
    : "✦ MAX LEVEL ✦";

  const lines = [
    border,
    `🌟 LEVEL UP! 🌟`,
    `✨ ${rarityTag(result.creature.rarity)} ${result.creature.name} reached Level ${result.level}! ✨`,
    border,
    "",
    formatProgress(result.level, result.levelCatches, nextThreshold),
    ...result.creature.art,
    "",
    progressLine,
    border,
  ];
  return lines.join("\n");
}

function rarityTag(rarity: string): string {
  const map: Record<string, string> = {
    common: "⚪", uncommon: "🟢", rare: "🔵",
    epic: "🟣", legendary: "🟠", mythic: "🔴",
  };
  return map[rarity] ?? rarity;
}

function formatNormalCatch(result: CatchResult): string {
  const nextThreshold = getNextLevelThreshold(result.level);
  const tag = rarityTag(result.creature.rarity);
  const lines = [
    `✨ ${tag} You caught a ${result.creature.name}! (x${result.catchCount})`,
    formatProgress(result.level, result.levelCatches, nextThreshold),
    ...result.creature.art,
  ];
  return lines.join("\n");
}

function makeProgressBar(levelCatches: number, target: number | null): string {
  if (!target) return "██████████";
  const progress = levelCatches / target;
  const filled = Math.min(10, Math.floor(progress * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function formatProgress(level: number, levelCatches: number, nextThreshold: number | null): string {
  return `[Lv.${level}] ${makeProgressBar(levelCatches, nextThreshold)} ${levelCatches}/${nextThreshold ?? "MAX"}`;
}
