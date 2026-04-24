#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const detect_1 = require("../adapters/detect");
const claude_code_1 = require("../adapters/claude-code");
const args = process.argv.slice(2);
const command = args[0];
function printUsage() {
    console.log(`
CatchEm - Passive Creature Collection Game

Usage:
  catchem setup          Set up hooks for your coding platform
  catchem collection     View your creature collection (TUI)
  catchem help           Show this help message
`);
}
function setup() {
    console.log("🎮 CatchEm Setup\n");
    const platforms = (0, detect_1.detectAllPlatforms)();
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
    const projectRoot = path_1.default.join(__dirname, "../..");
    for (const p of detected) {
        if (p.name === "Claude Code") {
            (0, claude_code_1.installClaudeCode)(projectRoot);
            console.log(`  ✅ ${p.name} — hooks installed`);
        }
    }
    console.log("\n🎉 Setup complete! Creatures will start appearing as you code.");
}
function collection() {
    const { launchTUI } = require("../tui/app");
    launchTUI();
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
//# sourceMappingURL=index.js.map