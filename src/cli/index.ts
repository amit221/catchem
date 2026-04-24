#!/usr/bin/env node

import path from "path";
import { detectAllPlatforms } from "../adapters/detect";
import { installClaudeCode } from "../adapters/claude-code";

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
CatchEm - Passive Creature Collection Game

Usage:
  catchem setup          Set up hooks for your coding platform
  catchem collection     View your creature collection (TUI)
  catchem help           Show this help message
`);
}

function setup(): void {
  console.log("🎮 CatchEm Setup\n");
  const platforms = detectAllPlatforms();
  const detected = platforms.filter((p) => p.detected);

  if (detected.length === 0) {
    console.log("No supported platforms detected.");
    console.log("Supported: Claude Code, Cursor, GitHub Copilot, Codex, OpenCode");
    process.exit(1);
  }

  console.log("Detected platforms:");
  for (const p of detected) {
    console.log(`  ✓ ${p.name}`);
  }
  console.log();

  const projectRoot = path.join(__dirname, "../..");

  for (const p of detected) {
    if (p.name === "Claude Code") {
      installClaudeCode(projectRoot);
      console.log(`  ✅ ${p.name} — hooks installed`);
    }
  }

  console.log("\n🎉 Setup complete! Creatures will start appearing as you code.");
}

function collection(): void {
  console.log("TUI collection viewer — coming soon!");
  console.log("For now, check your state at ~/.catchem/state.json");
}

switch (command) {
  case "setup":
    setup();
    break;
  case "collection":
    collection();
    break;
  case "help":
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
