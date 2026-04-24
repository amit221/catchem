#!/usr/bin/env node
import { runTick } from "../dist/cli/tick.js";

// Read stdin (hook event data) then run
let input = "";
let handled = false;
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { if (!handled) { handled = true; try { runTick(); } catch(e) { console.error("[catchem error]", e.message); } } });
setTimeout(() => { if (!handled) { handled = true; try { runTick(); } catch(e) { console.error("[catchem error]", e.message); } } }, 100);
