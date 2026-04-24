export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface CreatureDefinition {
  id: string;
  name: string;
  theme: string;
  rarity: Rarity;
  description: string;
  art: string[];
  frames?: string[][];
}

export interface CreatureState {
  name: string;
  catchCount: number;
  level: number;
  firstCaught: string;
  lastCaught: string;
}

export interface GameStats {
  sessionsPlayed: number;
  firstSession: string;
}

export interface GameState {
  version: number;
  creatures: Record<string, CreatureState>;
  totalCatches: number;
  currentCatchRate: number;
  stats: GameStats;
}

export interface CatchResult {
  creature: CreatureDefinition;
  isNew: boolean;
  leveledUp: boolean;
  level: number;
  catchCount: number;
  totalCatches: number;
}

export interface CatchOptions {
  rng: () => number;
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 12,
  epic: 7,
  legendary: 4,
  mythic: 2,
};

export const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const INITIAL_CATCH_RATE = 1.0;
export const BASE_CATCH_RATE = 0.2;
export const CATCH_RATE_INCREMENT = 0.05;

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "⬜ Common",
  uncommon: "🟩 Uncommon",
  rare: "🟦 Rare",
  epic: "🟪 Epic",
  legendary: "🟧 Legendary",
  mythic: "🟥 Mythic",
};
