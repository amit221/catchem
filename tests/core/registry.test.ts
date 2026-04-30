import { getCreature, getAllCreatures, pickRandomCreature } from "../../src/core/registry";

describe("getAllCreatures", () => {
  it("returns all creatures", () => {
    expect(getAllCreatures().length).toBeGreaterThanOrEqual(80);
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

  it("contains all themes", () => {
    const themes = new Set(getAllCreatures().map((c) => c.theme));
    for (const expected of ["elemental-beasts", "galactic-warriors", "marvel-heroes", "legends-arena", "lotr-legends", "greek-myths", "egyptian-myths"]) {
      expect(themes).toContain(expected);
    }
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

describe("pickRandomCreature with pool filter", () => {
  it("only picks from provided pool", () => {
    const pool = ["zappik", "blazard"];
    for (let i = 0; i < 50; i++) {
      const creature = pickRandomCreature(Math.random, pool);
      expect(pool).toContain(creature.id);
    }
  });

  it("picks from all creatures when no pool provided", () => {
    const creature = pickRandomCreature(() => 0.001);
    expect(creature).toBeDefined();
  });

  it("respects rarity weights within pool", () => {
    const pool = ["zappik", "spectrex"]; // common(50) vs rare(12)
    const counts: Record<string, number> = { zappik: 0, spectrex: 0 };
    for (let i = 0; i < 1000; i++) {
      const c = pickRandomCreature(Math.random, pool);
      counts[c.id]++;
    }
    expect(counts.zappik).toBeGreaterThan(counts.spectrex * 2);
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
