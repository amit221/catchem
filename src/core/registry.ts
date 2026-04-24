import path from "path";
import { CreatureDefinition, RARITY_WEIGHTS } from "./types";

const creaturesPath = path.join(__dirname, "../../creatures/creatures.json");
const creatures: CreatureDefinition[] = JSON.parse(
  require("fs").readFileSync(creaturesPath, "utf8")
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
