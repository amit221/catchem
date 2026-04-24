import React from "react";
import { render } from "ink-testing-library";
import { ProgressBar } from "../../src/tui/progress-bar";

describe("ProgressBar", () => {
  it("renders empty bar at 0%", () => {
    const { lastFrame } = render(<ProgressBar current={0} total={10} />);
    expect(lastFrame()).toContain("░░░░░░░░░░");
  });

  it("renders full bar at 100%", () => {
    const { lastFrame } = render(<ProgressBar current={10} total={10} />);
    expect(lastFrame()).toContain("██████████");
  });

  it("renders half bar at 50%", () => {
    const { lastFrame } = render(<ProgressBar current={5} total={10} />);
    expect(lastFrame()).toContain("█████░░░░░");
  });

  it("handles total of 0", () => {
    const { lastFrame } = render(<ProgressBar current={0} total={0} />);
    expect(lastFrame()).toContain("░░░░░░░░░░");
  });

  it("clamps when current exceeds total", () => {
    const { lastFrame } = render(<ProgressBar current={15} total={10} />);
    expect(lastFrame()).toContain("██████████");
  });
});
