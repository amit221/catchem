import { StateManager } from "../core/state.js";
import { tryCatch } from "../core/engine.js";
import { formatCatchNotification } from "../core/notification.js";
import { getNextLevelThreshold } from "../core/leveling.js";

export function runTick(): void {
  const mgr = new StateManager();
  const state = mgr.load();

  const result = tryCatch(state);
  mgr.save(state); // save on both hit and miss (pity timer)

  if (!result) {
    // The catch directive printed below on a hit lingers in the conversation
    // history. Without an override, Claude keeps mentioning the last-caught
    // creature on every subsequent turn. Emit a counter-directive on miss.
    console.log("— no creature caught this turn. Do not mention any creature in your response, and disregard any catch directive from earlier turns.");
    return;
  }

  const uniqueCount = Object.keys(state.creatures).length;
  const output = formatCatchNotification(result, uniqueCount);
  console.log(output);
  const nextThreshold = getNextLevelThreshold(result.level);
  const rarityIcons: Record<string, string> = { common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣", legendary: "🟠", mythic: "🔴" };
  const icon = rarityIcons[result.creature.rarity] ?? "⚪";
  console.log(`— mention this catch at the END of your response, show the rarity icon ${icon} and creature art in a code block. Show level (Lv.${result.level}) and progress (${result.levelCatches}/${nextThreshold ?? "MAX"}). Describe what was done in a few creative words as if ${result.creature.name} ("${result.creature.description}") is commenting on it.`);
}
