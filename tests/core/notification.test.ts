import { formatCatchNotification } from "../../src/core/notification";
import { CatchResult } from "../../src/core/types";
import { getAllCreatures } from "../../src/core/registry";

function makeCatchResult(overrides: Partial<CatchResult> = {}): CatchResult {
  return {
    creature: getAllCreatures()[0],
    isNew: false,
    leveledUp: false,
    level: 3,
    catchCount: 10,
    totalCatches: 50,
    flavorText: "was eating your semicolons",
    ...overrides,
  };
}

describe("formatCatchNotification", () => {
  it("shows NEW CREATURE for first discovery", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("NEW CREATURE");
    expect(output).toContain(result.creature.name);
  });

  it("shows rarity label for new creature", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("Common");
  });

  it("shows discovery count for new creature", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("5/24");
  });

  it("shows LEVEL UP for level-up catch", () => {
    const result = makeCatchResult({ leveledUp: true, level: 3 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("LEVEL UP");
    expect(output).toContain("Level 3");
  });

  it("shows normal catch with count and level", () => {
    const result = makeCatchResult({ catchCount: 10, level: 3 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("x10");
    expect(output).toContain("Lv.3");
  });

  it("includes creature art", () => {
    const result = makeCatchResult();
    const output = formatCatchNotification(result, 10);
    for (const line of result.creature.art) {
      expect(output).toContain(line);
    }
  });

  it("includes flavor text", () => {
    const result = makeCatchResult({ flavorText: "was eating your semicolons" });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("was eating your semicolons");
  });

  it("shows MAX LEVEL for max level creature", () => {
    const result = makeCatchResult({ leveledUp: true, level: 13, catchCount: 9587 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("MAX LEVEL");
  });

  it("shows progress bar in normal catch", () => {
    const result = makeCatchResult({ catchCount: 5, level: 2 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("█");
  });
});
