import React from "react";
import { render } from "ink-testing-library";
import { CollectionView } from "../../src/tui/collection-view";
import { GameState, INITIAL_CATCH_RATE } from "../../src/core/types";
import { patternFill } from "../../src/tui/background";

function emptyState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    currentCatchRate: INITIAL_CATCH_RATE,
    stats: { sessionsPlayed: 0, firstSession: "" },
  };
}

function stateWithCatch(): GameState {
  return {
    version: 1,
    creatures: {
      zappik: {
        name: "Zappik",
        catchCount: 5,
        level: 2,
        firstCaught: "2026-01-01T00:00:00Z",
        lastCaught: "2026-01-02T00:00:00Z",
      },
    },
    totalCatches: 5,
    currentCatchRate: 0.2,
    stats: { sessionsPlayed: 1, firstSession: "2026-01-01T00:00:00Z" },
  };
}

describe("CollectionView", () => {
  it("shows discovery count", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toMatch(/1\/\d+/);
  });

  it("shows total catches", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("5");
  });

  it("shows 0 discovered for empty state", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toMatch(/0\/\d+/);
  });

  it("shows CatchEm header", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("CatchEm");
  });

  it("shows scroll indicator when more below", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    // With many creatures, multiple rows, showing a few at a time
    expect(lastFrame()).toContain("↓↓↓");
  });

  it("shows cards in grid layout (multiple cards per row)", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    const frame = lastFrame()!;
    // Each row should contain multiple ??? cards side by side
    // Look for multiple "???" on the same conceptual row
    const lines = frame.split("\n");
    // Cards have borders, so we should see multiple │ chars on content lines
    const borderLines = lines.filter((l: string) => (l.match(/│/g) || []).length >= 2);
    expect(borderLines.length).toBeGreaterThan(0);
  });

  it("limits visible cards to 4 rows (12 cards)", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    const frame = lastFrame()!;
    // Count undiscovered "???" occurrences — should be at most 12 (4 rows x 3 cols)
    const undiscoveredMatches = frame.match(/\?\?\?/g) || [];
    expect(undiscoveredMatches.length).toBeLessThanOrEqual(12);
  });

  it("shows navigation instructions", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toContain("scroll rows");
  });

  it("renders background pattern characters in empty card slots", () => {
    // 91 creatures: 91 % 3 = 1, so the last row has 1 card and 2 empty pattern slots
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    const frame = lastFrame()!;
    expect(frame).toMatch(/·/);
  });
});

describe("patternFill", () => {
  it("generates dot pattern of correct length", () => {
    const result = patternFill(10);
    expect(result).toContain("·");
    expect(result.length).toBe(10);
  });

  it("alternates dots and spaces", () => {
    const result = patternFill(6);
    expect(result).toBe("· · · ");
  });

  it("respects offset parameter", () => {
    const result = patternFill(6, 1);
    // offset=1: col+offset starts at 1, so odd → space first
    expect(result).toBe(" · · ·");
  });
});
