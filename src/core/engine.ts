import { GameState, CatchOptions, CatchResult, INITIAL_CATCH_RATE, BASE_CATCH_RATE, CATCH_RATE_INCREMENT } from "./types";
import { pickRandomCreature } from "./registry";
import { getLevel } from "./leveling";
import { getRandomFlavorText } from "./flavor-text";

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

  const creature = pickRandomCreature(rng);
  const isNew = !(creature.id in state.creatures);
  const now = new Date().toISOString();

  if (isNew) {
    state.creatures[creature.id] = {
      name: creature.name,
      catchCount: 0,
      level: 0,
      firstCaught: now,
      lastCaught: now,
    };
  }

  const entry = state.creatures[creature.id];
  entry.catchCount += 1;
  entry.lastCaught = now;
  state.totalCatches += 1;

  const newLevel = getLevel(entry.catchCount);
  const leveledUp = newLevel > entry.level;
  entry.level = newLevel;

  return {
    creature,
    isNew,
    leveledUp,
    level: newLevel,
    catchCount: entry.catchCount,
    totalCatches: state.totalCatches,
    flavorText: getRandomFlavorText(rng),
  };
}
