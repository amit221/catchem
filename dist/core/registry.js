"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCreatures = getAllCreatures;
exports.getCreature = getCreature;
exports.pickRandomCreature = pickRandomCreature;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const url_1 = require("url");
const types_1 = require("./types");
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore: __dirname available in CJS; construct equivalent for ESM
const _dir = typeof __dirname !== "undefined"
    ? __dirname
    // @ts-ignore
    : path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
/* eslint-enable @typescript-eslint/ban-ts-comment */
const creaturesPath = path_1.default.join(_dir, "../../creatures/creatures.json");
const creatures = JSON.parse(fs_1.default.readFileSync(creaturesPath, "utf8"));
const creatureMap = new Map(creatures.map((c) => [c.id, c]));
function getAllCreatures() {
    return creatures;
}
function getCreature(id) {
    return creatureMap.get(id);
}
function pickRandomCreature(rng = Math.random) {
    const totalWeight = creatures.reduce((sum, c) => sum + types_1.RARITY_WEIGHTS[c.rarity], 0);
    let roll = rng() * totalWeight;
    for (const creature of creatures) {
        roll -= types_1.RARITY_WEIGHTS[creature.rarity];
        if (roll <= 0)
            return creature;
    }
    return creatures[creatures.length - 1];
}
//# sourceMappingURL=registry.js.map