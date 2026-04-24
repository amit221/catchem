#!/usr/bin/env node
import { runTick } from "../dist/cli/tick.js";

// Read stdin (hook event data) then run
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { runTick(); });
setTimeout(() => { if (!input) runTick(); }, 100);
