"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCatchNotification = formatCatchNotification;
const types_1 = require("./types");
const registry_1 = require("./registry");
const leveling_1 = require("./leveling");
function formatCatchNotification(result, uniqueCount) {
    const totalCreatures = (0, registry_1.getAllCreatures)().length;
    if (result.isNew) {
        return formatNewCreature(result, uniqueCount, totalCreatures);
    }
    if (result.leveledUp) {
        return formatLevelUp(result);
    }
    return formatNormalCatch(result);
}
function formatNewCreature(result, uniqueCount, totalCreatures) {
    const border = "✨🌟✨🌟✨🌟✨🌟✨🌟✨🌟✨";
    const rarityLabel = types_1.RARITY_LABELS[result.creature.rarity];
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
function formatLevelUp(result) {
    const border = "🎉✨🎉✨🎉✨🎉✨🎉✨🎉✨🎉";
    const nextThreshold = (0, leveling_1.getNextLevelThreshold)(result.level);
    const remaining = (0, leveling_1.getCatchesForNextLevel)(result.level, result.catchCount);
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
function formatNormalCatch(result) {
    const nextThreshold = (0, leveling_1.getNextLevelThreshold)(result.level);
    const lines = [
        `✨ You caught a ${result.creature.name}! (x${result.catchCount})`,
        `[Lv.${result.level}] ${makeProgressBar(result.catchCount, nextThreshold)} ${result.catchCount}/${nextThreshold ?? result.catchCount}  "${result.flavorText}"`,
        ...result.creature.art,
    ];
    return lines.join("\n");
}
function makeProgressBar(current, target) {
    if (!target)
        return "██████████";
    const idx = types_1.LEVEL_THRESHOLDS.indexOf(target);
    const prev = idx > 0 ? types_1.LEVEL_THRESHOLDS[idx - 1] : 0;
    const progress = (current - prev) / (target - prev);
    const filled = Math.min(10, Math.floor(progress * 10));
    return "█".repeat(filled) + "░".repeat(10 - filled);
}
//# sourceMappingURL=notification.js.map