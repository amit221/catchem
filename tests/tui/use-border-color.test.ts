import { getBorderColor } from "../../src/tui/use-border-color";

describe("getBorderColor", () => {
  it("returns cyan-family color for selected cards", () => {
    const color = getBorderColor("common", true, 0);
    expect(["cyan", "cyanBright"]).toContain(color);
  });

  it("returns static rarity color for unselected common cards", () => {
    expect(getBorderColor("common", false, 0)).toBe("white");
    expect(getBorderColor("uncommon", false, 0)).toBe("green");
    expect(getBorderColor("rare", false, 0)).toBe("blue");
    expect(getBorderColor("epic", false, 0)).toBe("magenta");
  });

  it("returns animated color for unselected legendary cards", () => {
    const colors = [0, 1, 2].map(frame => getBorderColor("legendary", false, frame));
    // Should cycle through yellow family
    expect(colors.every(c => ["yellow", "yellowBright"].includes(c))).toBe(true);
    // Should not all be the same (animation cycles)
    expect(new Set(colors).size).toBeGreaterThan(1);
  });

  it("returns animated color for unselected mythic cards", () => {
    const colors = [0, 1, 2].map(frame => getBorderColor("mythic", false, frame));
    expect(colors.every(c => ["red", "redBright"].includes(c))).toBe(true);
    expect(new Set(colors).size).toBeGreaterThan(1);
  });
});
