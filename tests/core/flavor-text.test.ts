import { getRandomFlavorText } from "../../src/core/flavor-text";

describe("getRandomFlavorText", () => {
  it("returns a string", () => {
    expect(typeof getRandomFlavorText()).toBe("string");
  });

  it("returns deterministic text with fixed rng", () => {
    const text = getRandomFlavorText(() => 0);
    expect(text).toBe("was eating your semicolons");
  });

  it("returns valid text at high rng value", () => {
    const text = getRandomFlavorText(() => 0.99);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
  });
});
