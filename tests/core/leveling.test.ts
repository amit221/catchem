import { getLevel, getNextLevelThreshold, getCatchesForNextLevel } from "../../src/core/leveling";

describe("getLevel", () => {
  it("returns 1 for 1 catch", () => {
    expect(getLevel(1)).toBe(1);
  });

  it("returns 1 for 2 catches", () => {
    expect(getLevel(2)).toBe(1);
  });

  it("returns 2 for 3 catches", () => {
    expect(getLevel(3)).toBe(2);
  });

  it("returns 3 for 7 catches", () => {
    expect(getLevel(7)).toBe(3);
  });

  it("returns 4 for 17 catches", () => {
    expect(getLevel(17)).toBe(4);
  });

  it("returns 13 for 9587 catches", () => {
    expect(getLevel(9587)).toBe(13);
  });

  it("returns 13 for catches above max threshold", () => {
    expect(getLevel(99999)).toBe(13);
  });

  it("returns 0 for 0 catches", () => {
    expect(getLevel(0)).toBe(0);
  });

  it("returns 0 for negative catches", () => {
    expect(getLevel(-5)).toBe(0);
  });
});

describe("getNextLevelThreshold", () => {
  it("returns 3 for level 1", () => {
    expect(getNextLevelThreshold(1)).toBe(3);
  });

  it("returns 7 for level 2", () => {
    expect(getNextLevelThreshold(2)).toBe(7);
  });

  it("returns null for max level", () => {
    expect(getNextLevelThreshold(13)).toBeNull();
  });

  it("returns 1 for level 0", () => {
    expect(getNextLevelThreshold(0)).toBe(1);
  });
});

describe("getCatchesForNextLevel", () => {
  it("returns remaining catches needed", () => {
    expect(getCatchesForNextLevel(1, 1)).toBe(2);
  });

  it("returns 0 at max level", () => {
    expect(getCatchesForNextLevel(13, 9587)).toBe(0);
  });

  it("returns correct count mid-level", () => {
    expect(getCatchesForNextLevel(2, 5)).toBe(2);
  });
});
