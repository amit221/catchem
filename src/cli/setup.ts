import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { fileURLToPath } from "url";

function getCatchemRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  return path.join(__dirname, "../..");
}

function getTickCommand(root: string): string {
  return `node "${path.join(root, "scripts", "tick.js")}"`;
}

function getUpdateCommand(): string {
  return `node -e "const fs=require('fs'),p=require('path'),os=require('os');const f=p.join(os.homedir(),'.catchem','last-update-check');try{const t=Number(fs.readFileSync(f,'utf8'));if(Date.now()-t<86400000)process.exit(0)}catch{}try{require('child_process').execSync('npm update -g catchem',{stdio:'ignore'});fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,Date.now().toString())}catch{}"`;
}

// ---------------------------------------------------------------------------
// Config persistence
// ---------------------------------------------------------------------------

function getConfigPath(): string {
  return path.join(os.homedir(), ".catchem", "config.json");
}

function loadConfig(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(getConfigPath(), "utf8"));
  } catch {
    return {};
  }
}

function saveConfig(config: Record<string, unknown>): void {
  const dir = path.dirname(getConfigPath());
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
}

// ---------------------------------------------------------------------------
// Helper: set hooks on a JSON structure, deduplicating catchem entries
// ---------------------------------------------------------------------------

function cleanOldHooks(obj: any, hooksKey: string): void {
  if (!obj[hooksKey]) return;
  for (const event of Object.keys(obj[hooksKey])) {
    if (!Array.isArray(obj[hooksKey][event])) continue;
    obj[hooksKey][event] = obj[hooksKey][event].filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    if (obj[hooksKey][event].length === 0) delete obj[hooksKey][event];
  }
}

function setHooks(
  obj: any,
  hooksKey: string,
  events: Record<string, string>,
  wrapInHooksArray: boolean = false,
): void {
  cleanOldHooks(obj, hooksKey);
  if (!obj[hooksKey]) obj[hooksKey] = {};
  for (const [event, command] of Object.entries(events)) {
    if (!obj[hooksKey][event]) obj[hooksKey][event] = [];
    const entry = wrapInHooksArray
      ? { hooks: [{ type: "command", command }] }
      : { type: "command", command };
    obj[hooksKey][event].push(entry);
  }
}

// ---------------------------------------------------------------------------
// Claude Code adapter
// ---------------------------------------------------------------------------

function installClaudeCode(root: string, autoUpdate: boolean): void {
  const configDir = path.join(os.homedir(), ".claude");
  const settingsPath = path.join(configDir, "settings.json");

  let settings: any = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = { UserPromptSubmit: tick };

  setHooks(settings, "hooks", events, true);

  // Auto-update hook in SessionStart
  if (autoUpdate) {
    if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
    settings.hooks.SessionStart.push({
      hooks: [{ type: "command", command: getUpdateCommand() }],
    });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  // Write skills — must be in subdirectory with SKILL.md filename
  const skillDir = path.join(configDir, "skills", "catchem-collection");
  fs.mkdirSync(skillDir, { recursive: true });

  // Remove old flat file if it exists
  const oldSkillPath = path.join(configDir, "skills", "catchem-collection.md");
  try { fs.unlinkSync(oldSkillPath); } catch {}

  const launchScript = path.join(root, "scripts", "launch-collection.mjs").replace(/\\/g, "/");
  const isWindows = process.platform === "win32";
  const isMac = process.platform === "darwin";

  let openCmd: string;
  if (isWindows) {
    openCmd = `cmd.exe /c "start /max \\"CatchEm Collection\\" node ${launchScript}"`;
  } else if (isMac) {
    openCmd = `osascript -e 'tell application "Terminal" to do script "node ${launchScript}"'`;
  } else {
    openCmd = `x-terminal-emulator -e node "${launchScript}" 2>/dev/null || gnome-terminal -- node "${launchScript}" 2>/dev/null || xterm -e "node ${launchScript}"`;
  }

  const collectionSkill = `---
name: catchem-collection
description: View your CatchEm creature collection, evolution stages, and discovery progress
---

Open the CatchEm TUI collection viewer in a new terminal window:

\`\`\`bash
${openCmd}
\`\`\`

This opens a new terminal with an interactive UI where the user can browse their caught creatures. Do NOT run it inside the current Bash tool — it must open in a separate terminal window.
`;

  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    collectionSkill,
  );
}

function uninstallClaudeCode(): void {
  const configDir = path.join(os.homedir(), ".claude");
  const settingsPath = path.join(configDir, "settings.json");

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    cleanOldHooks(settings, "hooks");
    if (settings.hooks && Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch {}

  // Remove skills
  const skillDir = path.join(configDir, "skills", "catchem-collection");
  try { fs.rmSync(skillDir, { recursive: true }); } catch {}
  const oldSkillPath = path.join(configDir, "skills", "catchem-collection.md");
  try { fs.unlinkSync(oldSkillPath); } catch {}
}

// ---------------------------------------------------------------------------
// Interactive prompt helper
// ---------------------------------------------------------------------------

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runSetup(auto: boolean = false): Promise<void> {
  const home = os.homedir();
  const claudeDetected = fs.existsSync(path.join(home, ".claude"));

  if (!claudeDetected) {
    if (!auto) {
      console.log("Claude Code not detected (~/.claude not found).");
      console.log("CatchEm currently only supports Claude Code.");
    }
    return;
  }

  const config = loadConfig();
  const root = getCatchemRoot();

  // Auto mode: install silently
  if (auto) {
    const autoUpdate = (config.autoUpdate as boolean) || false;
    config.autoUpdate = autoUpdate;
    saveConfig(config);
    installClaudeCode(root, autoUpdate);
    return;
  }

  console.log("🎮 CatchEm Setup\n");
  console.log("  Platform: Claude Code ✓\n");

  // Determine auto-update preference
  let autoUpdate = (config.autoUpdate as boolean) || false;
  if (process.stdin.isTTY) {
    const answer = await askQuestion(
      "Enable auto-updates? CatchEm will check for updates daily. (y/n): ",
    );
    autoUpdate = answer === "y" || answer === "yes";
  }

  config.autoUpdate = autoUpdate;
  saveConfig(config);

  installClaudeCode(root, autoUpdate);
  console.log("  ✅ Claude Code — hooks & skills installed");

  console.log(
    "\n🎉 Setup complete! Creatures will start appearing during your coding sessions.",
  );
}

// ---------------------------------------------------------------------------
// Uninstall — remove all hooks and skills
// ---------------------------------------------------------------------------

export async function runUninstall(): Promise<void> {
  console.log("🗑️  CatchEm Uninstall\n");

  uninstallClaudeCode();
  console.log("  ✅ Claude Code — hooks & skills removed");

  // Clear config
  const config = loadConfig();
  delete config.enabledPlatforms;
  saveConfig(config);

  console.log("\n🎉 CatchEm has been uninstalled.");
  console.log("Your creature collection in ~/.catchem/state.json is preserved.");
}
