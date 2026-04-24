import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { CreatureDefinition, RARITY_WEIGHTS } from "./types";

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: __dirname available in CJS; construct equivalent for ESM
const _dir: string = typeof __dirname !== "undefined"
  ? __dirname
  // @ts-ignore
  : path.dirname(fileURLToPath(import.meta.url));
/* eslint-enable @typescript-eslint/ban-ts-comment */

const creaturesPath = path.join(_dir, "../../creatures/creatures.json");
const creatures: CreatureDefinition[] = JSON.parse(
  fs.readFileSync(creaturesPath, "utf8")
);
const creatureMap = new Map(creatures.map((c) => [c.id, c]));

export function getAllCreatures(): CreatureDefinition[] {
  return creatures;
}

export function getCreature(id: string): CreatureDefinition | undefined {
  return creatureMap.get(id);
}

export function pickRandomCreature(rng: () => number = Math.random): CreatureDefinition {
  const totalWeight = creatures.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0);
  let roll = rng() * totalWeight;
  for (const creature of creatures) {
    roll -= RARITY_WEIGHTS[creature.rarity];
    if (roll <= 0) return creature;
  }
  return creatures[creatures.length - 1];
}
