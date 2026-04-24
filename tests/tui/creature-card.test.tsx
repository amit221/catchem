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
  });
});
