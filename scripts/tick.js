#!/usr/bin/env node
import { runTick } from "../dist/cli/tick.js";

// Parse args
const args = process.argv.slice(2);
const isToolTick = args.includes("--tool-tick");

// Read stdin (hook event data) then run
let input = "";
let handled = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => {
  if (!handled) {
    handled = true;
    try {
      let toolName = undefined;
      if (isToolTick && input) {
        try {
          const data = JSON.parse(input);
          toolName = data.tool_name || data.toolName || "unknown";
        } catch { toolName = "unknown"; }
      }
      runTick(toolName);
    } catch(e) { console.error("[catchem error]", e.message); }
  }
});
setTimeout(() => {
  if (!handled) {
    handled = true;
    try {
      runTick(isToolTick ? "unknown" : undefined);
    } catch(e) { console.error("[catchem error]", e.message); }
  }
}, 100);
