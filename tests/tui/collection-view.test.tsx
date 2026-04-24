import React from "react";
import { render } from "ink-testing-library";
import { CollectionView } from "../../src/tui/collection-view";
import { GameState, INITIAL_CATCH_RATE } from "../../src/core/types";

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
    expect(lastFrame()).toContain("1/44");
  });

  it("shows total catches", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("5");
  });

  it("shows 0 discovered for empty state", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toContain("0/44");
  });

  it("shows CatchEm header", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("CatchEm");
  });

  it("shows theme separator", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toContain("Elemental Beasts");
  });

  it("shows scroll indicator when more below", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    // With 44 creatures and viewport of 5, there should be more below
    expect(lastFrame()).toContain("▼");
  });

  it("does not render all 44 creatures at once", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    const frame = lastFrame()!;
    // Count undiscovered "???" lines — should be at most VIEWPORT_SIZE (5)
    // plus 1 for the expanded detail of the selected undiscovered creature
    const undiscoveredLines = frame.split("\n").filter((l: string) => l.includes("???"));
    expect(undiscoveredLines.length).toBeLessThanOrEqual(6);
  });

  it("shows navigation instructions", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toContain("navigate");
  });
});
