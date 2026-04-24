import { getCreature, getAllCreatures, pickRandomCreature } from "../../src/core/registry";

describe("getAllCreatures", () => {
  it("returns 24 creatures", () => {
    expect(getAllCreatures()).toHaveLength(24);
  });

  it("every creature has non-empty art", () => {
    for (const c of getAllCreatures()) {
      expect(c.art.length).toBeGreaterThan(0);
    }
  });

  it("every creature has a unique id", () => {
    const ids = getAllCreatures().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains all four themes", () => {
    const themes = new Set(getAllCreatures().map((c) => c.theme));
    expect(themes).toEqual(
      new Set(["elemental-beasts", "galactic-warriors", "marvel-heroes", "legends-arena"])
    );
  });
});

describe("getCreature", () => {
  it("returns creature by id", () => {
    const c = getCreature("zappik");
    expect(c).toBeDefined();
    expect(c!.name).toBe("Zappik");
  });

  it("returns undefined for unknown id", () => {
    expect(getCreature("nonexistent")).toBeUndefined();
  });
});

describe("pickRandomCreature", () => {
  it("returns a valid creature", () => {
    const c = pickRandomCreature(() => 0.5);
    expect(c).toBeDefined();
    expect(c.id).toBeTruthy();
  });

  it("returns first creature when rng returns 0", () => {
    const c = pickRandomCreature(() => 0);
    expect(c).toBeDefined();
  });

  it("returns last creature when rng returns 0.99", () => {
    const c = pickRandomCreature(() => 0.99);
    expect(c).toBeDefined();
  });

  it("weighted selection favors common creatures", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const c = pickRandomCreature(Math.random);
      counts[c.rarity] = (counts[c.rarity] || 0) + 1;
    }
    expect(counts["common"]!).toBeGreaterThan(counts["rare"]!);
  });
});
