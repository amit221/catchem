#!/usr/bin/env node
import { runTick } from "../dist/cli/tick.js";

// Parse --tool argument for PostToolUse hooks
const args = process.argv.slice(2);
const toolIdx = args.indexOf("--tool");
const toolName = toolIdx !== -1 && args[toolIdx + 1] ? args[toolIdx + 1] : undefined;

// Read stdin (hook event data) then run
let input = "";
let handled = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { if (!handled) { handled = true; try { runTick(toolName); } catch(e) { console.error("[catchem error]", e.message); } } });
setTimeout(() => { if (!handled) { handled = true; try { runTick(toolName); } catch(e) { console.error("[catchem error]", e.message); } } }, 100);
