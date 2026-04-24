#!/usr/bin/env node

import { runSetup } from "./setup";

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
  const { launchTUI } = await import("../tui/app");
  launchTUI();
}

switch (command) {
  case "setup":
    runSetup(args.includes("--auto"));
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
