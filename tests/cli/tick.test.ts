import fs from "fs";
import path from "path";
import os from "os";
import { jest } from "@jest/globals";
import { runTick } from "../../src/cli/tick";

let tempHome: string;
let logSpy: jest.SpiedFunction<typeof console.log>;

beforeEach(() => {
  tempHome = path.join(
    os.tmpdir(),
    `catchem-tick-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  fs.mkdirSync(path.join(tempHome, ".catchem"), { recursive: true });
  jest.spyOn(os, "homedir").mockReturnValue(tempHome);
  logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  fs.rmSync(tempHome, { recursive: true, force: true });
});

function writeState(rate: number): void {
  const statePath = path.join(tempHome, ".catchem", "state.json");
  fs.writeFileSync(
    statePath,
    JSON.stringify({
      version: 1,
      creatures: {},
      totalCatches: 0,
      currentCatchRate: rate,
      stats: { sessionsPlayed: 0, firstSession: "" },
    }),
  );
}

function joinedOutput(): string {
  return logSpy.mock.calls.map((c) => c.join(" ")).join("\n");
}

describe("runTick", () => {
  it("emits nothing on miss (no banner, no directive)", () => {
    // currentCatchRate = 0 + default rng = Math.random() ∈ [0,1) ⇒ guaranteed miss
    writeState(0);

    runTick();

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("emits a scope-limited catch directive on success", () => {
    // currentCatchRate = 1 ⇒ guaranteed catch regardless of rng.
    writeState(1);

    runTick();

    const out = joinedOutput();
    expect(out).toMatch(/mention this catch/i);
    // Without explicit scope, the directive lingers in conversation history
    // and Claude replays the same catch on every later prompt (issue #3).
    // Either phrasing — "this response only" or "do not repeat / subsequent" —
    // is acceptable; both anchor the directive to the current turn.
    expect(out).toMatch(/this response only|do not repeat|subsequent response/i);
  });

  it("still saves state on miss (pity timer must advance)", () => {
    writeState(0);

    runTick();

    const saved = JSON.parse(
      fs.readFileSync(path.join(tempHome, ".catchem", "state.json"), "utf8"),
    );
    expect(saved.currentCatchRate).toBeGreaterThan(0);
  });
});
