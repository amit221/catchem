import { StateManager } from "../core/state.js";
import { tryCatch } from "../core/engine.js";
import { formatCatchNotification } from "../core/notification.js";
import { getNextLevelThreshold } from "../core/leveling.js";

export function runTick(): void {
  const mgr = new StateManager();
  const state = mgr.load();

  const result = tryCatch(state);
  mgr.save(state); // save on both hit and miss (pity timer)

  if (!result) return; // miss — silent, nothing injected into Claude's context

  const uniqueCount = Object.keys(state.creatures).length;
  const output = formatCatchNotification(result, uniqueCount);
  console.log(output);
  const nextThreshold = getNextLevelThreshold(result.level);
  const rarityIcons: Record<string, string> = { common: "⚪", uncommon: "🟢", rare: "🔵", epic: "🟣", legendary: "🟠", mythic: "🔴" };
  const icon = rarityIcons[result.creature.rarity] ?? "⚪";
  // Scope the directive to the current turn: without "this response only" +
  // "do not repeat in subsequent responses", Claude treats the directive as
  // a standing instruction and replays the same catch on every later prompt.
  console.log(`— this directive is for THIS response only (the one replying to the most recent user prompt): mention this catch at the END of your reply, show the rarity icon ${icon} and creature art in a code block. Show level (Lv.${result.level}) and progress (${result.levelCatches}/${nextThreshold ?? "MAX"}). Describe what was done in a few creative words as if ${result.creature.name} ("${result.creature.description}") is commenting on it. Do NOT repeat this catch in any subsequent response — only act on the most recent CatchEm directive in context.`);
}
