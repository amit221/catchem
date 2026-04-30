import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { StateManager } from "../core/state.js";
import { getAllCreatures } from "../core/registry.js";
import { loadAchievementDefinitions } from "../core/achievements.js";
import { generateViewerHtml } from "../social/viewer.js";

export function openViewer(): void {
  const mgr = new StateManager();
  const state = mgr.load();
  const creatures = getAllCreatures();
  const achievements = loadAchievementDefinitions();

  const html = generateViewerHtml(state, creatures, achievements);

  const outDir = path.join(os.homedir(), ".catchem");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "collection.html");
  fs.writeFileSync(outPath, html, "utf8");

  console.log(`Collection viewer written to ${outPath}`);
  console.log("Opening in browser...");

  // Open in default browser
  try {
    const platform = process.platform;
    if (platform === "win32") {
      execSync(`start "" "${outPath}"`, { stdio: "ignore" });
    } else if (platform === "darwin") {
      execSync(`open "${outPath}"`, { stdio: "ignore" });
    } else {
      execSync(`xdg-open "${outPath}"`, { stdio: "ignore" });
    }
  } catch {
    console.log(`Could not auto-open. Open manually: ${outPath}`);
  }
}
