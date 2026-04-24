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
    flavorText: string;
}
export interface CatchOptions {
    rng: () => number;
}
export declare const RARITY_WEIGHTS: Record<Rarity, number>;
export declare const LEVEL_THRESHOLDS: readonly [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];
export declare const MAX_LEVEL: 13;
export declare const INITIAL_CATCH_RATE = 1;
export declare const BASE_CATCH_RATE = 0.2;
export declare const CATCH_RATE_INCREMENT = 0.05;
export declare const RARITY_LABELS: Record<Rarity, string>;
