import { LEVEL_THRESHOLDS, MAX_LEVEL } from "./types.js";

export function getLevel(catchCount: number): number {
  if (catchCount <= 0) return 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (catchCount >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

export function getNextLevelThreshold(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return LEVEL_THRESHOLDS[level];
}

export function getCatchesForNextLevel(level: number, catchCount: number): number {
  const next = getNextLevelThreshold(level);
  if (next === null) return 0;
  return Math.max(0, next - catchCount);
}
