"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RARITY_LABELS = exports.CATCH_RATE_INCREMENT = exports.BASE_CATCH_RATE = exports.INITIAL_CATCH_RATE = exports.MAX_LEVEL = exports.LEVEL_THRESHOLDS = exports.RARITY_WEIGHTS = void 0;
exports.RARITY_WEIGHTS = {
    common: 50,
    uncommon: 25,
    rare: 12,
    epic: 7,
    legendary: 4,
    mythic: 2,
};
exports.LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];
exports.MAX_LEVEL = exports.LEVEL_THRESHOLDS.length;
exports.INITIAL_CATCH_RATE = 1.0;
exports.BASE_CATCH_RATE = 0.2;
exports.CATCH_RATE_INCREMENT = 0.05;
exports.RARITY_LABELS = {
    common: "⬜ Common",
    uncommon: "🟩 Uncommon",
    rare: "🟦 Rare",
    epic: "🟪 Epic",
    legendary: "🟧 Legendary",
    mythic: "🟥 Mythic",
};
//# sourceMappingURL=types.js.map