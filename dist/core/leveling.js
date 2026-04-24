"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLevel = getLevel;
exports.getNextLevelThreshold = getNextLevelThreshold;
exports.getCatchesForNextLevel = getCatchesForNextLevel;
const types_1 = require("./types");
function getLevel(catchCount) {
    if (catchCount <= 0)
        return 0;
    for (let i = types_1.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (catchCount >= types_1.LEVEL_THRESHOLDS[i])
            return i + 1;
    }
    return 0;
}
function getNextLevelThreshold(level) {
    if (level >= types_1.MAX_LEVEL)
        return null;
    return types_1.LEVEL_THRESHOLDS[level];
}
function getCatchesForNextLevel(level, catchCount) {
    const next = getNextLevelThreshold(level);
    if (next === null)
        return 0;
    return Math.max(0, next - catchCount);
}
//# sourceMappingURL=leveling.js.map