#!/usr/bin/env node

import { runSetup } from "./setup.js";

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
CatchEm - Passive Creature Collection Game

Usage:
  catchem setup            Set up hooks for your coding platform
  catchem setup --auto     Silent auto-setup (used by postinstall)
  catchem collection       View your creature collection (TUI)
  catchem help             Show this help message
`);
}

async function collection(): Promise<void> {
  const { launchTUI } = await import("../tui/app.js");
  launchTUI();
}

switch (command) {
  case "setup":
    void runSetup(args.includes("--auto"));
    break;
  case "collection":
    void collection();
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
