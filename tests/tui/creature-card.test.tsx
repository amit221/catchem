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
    expect(frame).toContain("L3");
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

  it("highlights selected card with double border", () => {
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
    // Double border uses ╔ character
    expect(frame).toContain("╔");
  });

  it("shows card as bordered box with creature name", () => {
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
    // Single border uses ┌ or │
    expect(frame).toContain("│");
  });

  it("shows rarity icon in card header", () => {
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

  it("shows catch count and progress bar", () => {
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
    expect(frame).toContain("x5");
    expect(frame).toContain("5/7");
  });

  it("shows art lines inside the card", () => {
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
    // Card should have multiple lines (header + art + footer + borders)
    const lines = frame.split("\n").filter((l: string) => l.trim().length > 0);
    expect(lines.length).toBeGreaterThan(3);
  });

  it("shows dimmed silhouette art for undiscovered", () => {
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
    // Undiscovered should have masked art with ░ characters
    expect(frame).toContain("░");
  });
});
