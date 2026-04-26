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
  it("emits a clear-directive on miss so the previous catch directive doesn't persist", () => {
    // currentCatchRate = 0 + default rng = Math.random() ∈ [0,1) ⇒ guaranteed miss
    writeState(0);

    runTick();

    // A miss must inject *something* — otherwise the previous turn's
    // "mention this catch" directive lingers in the conversation history
    // and Claude keeps mentioning the last creature found.
    expect(logSpy).toHaveBeenCalled();
    expect(joinedOutput()).toMatch(/no.*(catch|creature)|disregard|ignore/i);
  });

  it("does not include any creature name or art in the miss output", () => {
    writeState(0);

    runTick();

    const out = joinedOutput();
    // Miss output should be a short directive — no creature art / banner.
    expect(out).not.toContain("NEW CREATURE DISCOVERED");
    expect(out).not.toContain("LEVEL UP");
  });

  it("emits the catch directive on a successful catch", () => {
    // currentCatchRate = 1 ⇒ guaranteed catch regardless of rng.
    writeState(1);

    runTick();

    expect(joinedOutput()).toMatch(/mention this catch/i);
  });
});
