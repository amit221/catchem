import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { CreatureDefinition, RARITY_WEIGHTS } from "./types.js";

const _dir = path.dirname(fileURLToPath(import.meta.url));

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

export function pickRandomCreature(
  rng: () => number = Math.random,
  pool?: string[],
): CreatureDefinition {
  const available = pool
    ? pool.map((id) => creatureMap.get(id)).filter(Boolean) as CreatureDefinition[]
    : creatures;

  if (available.length === 0) return creatures[0]; // fallback safety

  const totalWeight = available.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0);
  let roll = rng() * totalWeight;
  for (const creature of available) {
    roll -= RARITY_WEIGHTS[creature.rarity];
    if (roll <= 0) return creature;
  }
  return available[available.length - 1];
}
