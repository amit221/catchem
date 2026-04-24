import fs from "fs";
import path from "path";
import os from "os";
import { jest } from "@jest/globals";
import { runSetup } from "../../src/cli/setup";

let tempHome: string;

beforeEach(() => {
  tempHome = path.join(os.tmpdir(), `catchem-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(tempHome, { recursive: true });
  // Create fake .claude dir so Claude Code is "detected"
  fs.mkdirSync(path.join(tempHome, ".claude"), { recursive: true });
  jest.spyOn(os, "homedir").mockReturnValue(tempHome);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("runSetup", () => {
  it("writes settings.json with hooks for Claude Code", async () => {
    await runSetup(true);
    const settingsPath = path.join(tempHome, ".claude", "settings.json");
    expect(fs.existsSync(settingsPath)).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    expect(settings.hooks).toBeDefined();
    expect(settings.hooks.UserPromptSubmit).toBeDefined();
    expect(settings.hooks.SessionStart).toBeDefined();
  });

  it("hooks reference tick.js", async () => {
    await runSetup(true);
    const settingsPath = path.join(tempHome, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const hookCmd = JSON.stringify(settings.hooks.UserPromptSubmit);
    expect(hookCmd).toContain("tick.js");
  });

  it("writes collection skill file", async () => {
    await runSetup(true);
    const skillPath = path.join(tempHome, ".claude", "skills", "catchem-collection.md");
    expect(fs.existsSync(skillPath)).toBe(true);
    const content = fs.readFileSync(skillPath, "utf8");
    expect(content).toContain("launch-collection.mjs");
  });

  it("does not include auto-update hook in --auto mode", async () => {
    await runSetup(true);
    const settingsPath = path.join(tempHome, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    const sessionHooks = JSON.stringify(settings.hooks.SessionStart);
    expect(sessionHooks).not.toContain("npm update -g catchem");
  });

  it("preserves existing settings", async () => {
    const settingsPath = path.join(tempHome, ".claude", "settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify({ existingKey: "keep" }, null, 2));
    await runSetup(true);
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    expect(settings.existingKey).toBe("keep");
    expect(settings.hooks).toBeDefined();
  });

  it("does not duplicate hooks on re-run", async () => {
    await runSetup(true);
    await runSetup(true);
    const settingsPath = path.join(tempHome, ".claude", "settings.json");
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    expect(settings.hooks.UserPromptSubmit.length).toBe(1);
  });

  it("stores autoUpdate preference in config.json", async () => {
    await runSetup(true);
    const configPath = path.join(tempHome, ".catchem", "config.json");
    expect(fs.existsSync(configPath)).toBe(true);
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config.autoUpdate).toBe(false);
  });

  it("defaults autoUpdate to false in --auto mode", async () => {
    await runSetup(true);
    const configPath = path.join(tempHome, ".catchem", "config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    expect(config.autoUpdate).toBe(false);
  });
});
