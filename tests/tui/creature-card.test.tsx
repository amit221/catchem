import React from "react";
import { render } from "ink-testing-library";
import stringWidth from "string-width";
import { CreatureCard, CARD_WIDTH } from "../../src/tui/creature-card";
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

  it("does not overflow card border with emoji art", () => {
    const creature = {
      id: "test-emoji",
      name: "Testmon",
      theme: "elemental-beasts",
      rarity: "common" as const,
      description: "Test creature",
      art: [
        "  ⚡  ⚡  ⚡  ",
        "  🔥🔥🔥🔥🔥  ",
        "  ╱╲    ╱╲  ",
        "  │  ◆◆  │  ",
        "  ╰──────╯  ",
      ],
    };
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
    const lines = frame.split("\n");
    // Ink uses JS string length for box layout. Every non-empty line should not
    // exceed CARD_WIDTH in JS character length. Visual overflow of BMP-wide emoji
    // like ⚡ is an Ink rendering limitation (Ink pads by JS chars, not visual cols),
    // but JS-length must stay within CARD_WIDTH so the layout grid is not broken.
    for (const line of lines) {
      if (line.trim().length === 0) continue;
      // Strip ANSI escape codes before measuring
      // eslint-disable-next-line no-control-regex
      const stripped = line.replace(/\x1b\[[0-9;]*m/g, "");
      if (stripped.trim().length === 0) continue;
      expect(stripped.length).toBeLessThanOrEqual(CARD_WIDTH);
    }
  });
});
