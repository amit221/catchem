import React from "react";
import { render } from "ink-testing-library";
import { CreatureCard } from "../../src/tui/creature-card";
import { getAllCreatures } from "../../src/core/registry";

describe("CreatureCard", () => {
  it("renders discovered creature with name and level", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={3}
        catchCount={10}
        nextThreshold={17}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain(creature.name);
    expect(frame).toContain("Lv.3");
  });

  it("renders undiscovered creature as mystery", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={false}
        level={0}
        catchCount={0}
        nextThreshold={null}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain("???");
    expect(frame).toContain("Undiscovered");
  });

  it("highlights selected creature", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={1}
        catchCount={1}
        nextThreshold={3}
        selected={true}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain(creature.name);
    // Selected creature shows pointer
    expect(frame).toContain("▸");
  });

  it("shows compact one-line summary for unselected creature", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={2}
        catchCount={5}
        nextThreshold={7}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain(creature.name);
    expect(frame).toContain("x5");
    // Unselected should NOT show art (no expanded card)
    // Art lines are multiple lines, compact is one line
    const lines = frame.split("\n").filter((l: string) => l.trim().length > 0);
    expect(lines.length).toBe(1);
  });

  it("shows expanded card with art for selected creature", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={2}
        catchCount={5}
        nextThreshold={7}
        selected={true}
      />
    );
    const frame = lastFrame()!;
    // Selected shows expanded art + details (multiple lines)
    const lines = frame.split("\n").filter((l: string) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(3);
  });

  it("shows rarity icon in compact line", () => {
    const creature = getAllCreatures()[0]; // common creature
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={1}
        catchCount={1}
        nextThreshold={3}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain("⬜");
  });

  it("shows progress bar for selected creature with nextThreshold", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={2}
        catchCount={5}
        nextThreshold={7}
        selected={true}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain("5/7");
    expect(frame).toContain("Next:");
  });
});
