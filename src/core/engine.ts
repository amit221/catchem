import { GameState, CatchOptions, CatchResult, BASE_CATCH_RATE, CATCH_RATE_INCREMENT, LEVEL_THRESHOLDS, MAX_LEVEL } from "./types.js";
import { pickRandomCreature } from "./registry.js";


export function tryCatch(
  state: GameState,
  options: Partial<CatchOptions> = {}
): CatchResult | null {
  const { rng = Math.random } = options;

  const catchRate = state.currentCatchRate;

  // Roll for catch
  if (rng() >= catchRate) {
    // Miss — increase catch rate
    state.currentCatchRate = Math.min(1.0, state.currentCatchRate + CATCH_RATE_INCREMENT);
    return null;
  }

  // Successful catch — reset rate
  state.currentCatchRate = BASE_CATCH_RATE;

  const creature = pickRandomCreature(rng, state.unlockedBytlings);
  const isNew = !(creature.id in state.creatures);
  const now = new Date().toISOString();

  if (isNew) {
    state.creatures[creature.id] = {
      name: creature.name,
      catchCount: 0,
      levelCatches: 0,
      level: 0,
      firstCaught: now,
      lastCaught: now,
    };
  }

  const entry = state.creatures[creature.id];
  // Migrate old state missing levelCatches
  if (entry.levelCatches == null) entry.levelCatches = 0;
  entry.catchCount += 1;
  entry.levelCatches += 1;
  entry.lastCaught = now;
  state.totalCatches += 1;

  // Level up: check if levelCatches reached the threshold for current level
  let leveledUp = false;
  if (entry.level < MAX_LEVEL && entry.levelCatches >= LEVEL_THRESHOLDS[entry.level]) {
    entry.level += 1;
    entry.levelCatches = 1; // reset — this catch counts as 1 toward next level
    leveledUp = true;
  }

  return {
    creature,
    isNew,
    leveledUp,
    level: entry.level,
    catchCount: entry.catchCount,
    levelCatches: entry.levelCatches,
    totalCatches: state.totalCatches,
  };
}
