import { CreatureDefinition } from "./types";
export declare function getAllCreatures(): CreatureDefinition[];
export declare function getCreature(id: string): CreatureDefinition | undefined;
export declare function pickRandomCreature(rng?: () => number): CreatureDefinition;
