import { GameState } from "./types";
export declare const DEFAULT_STATE_PATH: string;
export declare class StateManager {
    private filePath;
    constructor(filePath?: string);
    load(): GameState;
    save(state: GameState): void;
}
