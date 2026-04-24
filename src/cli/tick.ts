import { StateManager } from "../core/state.js";
import { tryCatch } from "../core/engine.js";
import { formatCatchNotification } from "../core/notification.js";
import { getNextLevelThreshold } from "../core/leveling.js";

export function runTick(): void {
  // Skip in subagent contexts — only catch in the main session
  if (process.env.CLAUDE_AGENT_ID || process.env.AGENT_ID) return;

  const mgr = new StateManager();
  const state = mgr.load();

  const result = tryCatch(state);
  mgr.save(state); // save on both hit and miss (pity timer)

  if (!result) return; // miss — silent

  const uniqueCount = Object.keys(state.creatures).length;
  const output = formatCatchNotification(result, uniqueCount);
  console.log(output);
  const nextThreshold = getNextLevelThreshold(result.level);
  console.log(`— mention this catch naturally in your response, show the creature art in a code block. Show level (Lv.${result.level}) and progress (${result.catchCount}/${nextThreshold ?? result.catchCount}). Describe what was done in a few creative words as if ${result.creature.name} ("${result.creature.description}") is commenting on it.`);
}
