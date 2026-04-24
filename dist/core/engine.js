"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryCatch = tryCatch;
const types_1 = require("./types");
const registry_1 = require("./registry");
const leveling_1 = require("./leveling");
const flavor_text_1 = require("./flavor-text");
function tryCatch(state, options = {}) {
    const { rng = Math.random } = options;
    const catchRate = state.currentCatchRate;
    // Roll for catch
    if (rng() >= catchRate) {
        // Miss — increase catch rate
        state.currentCatchRate = Math.min(1.0, state.currentCatchRate + types_1.CATCH_RATE_INCREMENT);
        return null;
    }
    // Successful catch — reset rate
    state.currentCatchRate = types_1.BASE_CATCH_RATE;
    const creature = (0, registry_1.pickRandomCreature)(rng);
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
    const newLevel = (0, leveling_1.getLevel)(entry.catchCount);
    const leveledUp = newLevel > entry.level;
    entry.level = newLevel;
    return {
        creature,
        isNew,
        leveledUp,
        level: newLevel,
        catchCount: entry.catchCount,
        totalCatches: state.totalCatches,
        flavorText: (0, flavor_text_1.getRandomFlavorText)(rng),
    };
}
//# sourceMappingURL=engine.js.map