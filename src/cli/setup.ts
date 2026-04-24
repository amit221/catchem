import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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

function setHooks(
  obj: any,
  hooksKey: string,
  events: Record<string, string>,
  wrapInHooksArray: boolean = false,
): void {
  if (!obj[hooksKey]) obj[hooksKey] = {};
  for (const [event, command] of Object.entries(events)) {
    if (!obj[hooksKey][event]) obj[hooksKey][event] = [];
    obj[hooksKey][event] = (obj[hooksKey][event] as any[]).filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    const entry = wrapInHooksArray
      ? { hooks: [{ type: "command", command }] }
      : { type: "command", command };
    obj[hooksKey][event].push(entry);
  }
}

// ---------------------------------------------------------------------------
// Platform adapters
// ---------------------------------------------------------------------------

function installClaudeCode(root: string, autoUpdate: boolean): void {
  const configDir = path.join(os.homedir(), ".claude");
  const settingsPath = path.join(configDir, "settings.json");

  let settings: any = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = {
    UserPromptSubmit: tick,
    PostToolUse: tick,
    Stop: tick,
    SessionStart: tick,
  };

  setHooks(settings, "hooks", events, true);

  // Auto-update hook in SessionStart
  if (autoUpdate) {
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
    openCmd = `cmd.exe /c "start \\"CatchEm Collection\\" node ${launchScript}"`;
  } else if (isMac) {
    openCmd = `open -a Terminal "${launchScript}"`;
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

function installCursor(root: string, autoUpdate: boolean): void {
  const hooksDir = path.join(os.homedir(), ".cursor", "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const hooksPath = path.join(hooksDir, "hooks.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = {
    postToolUse: tick,
    stop: tick,
    sessionStart: tick,
  };

  setHooks(config, "hooks", events);

  if (autoUpdate) {
    config.hooks.sessionStart.push({
      type: "command",
      command: getUpdateCommand(),
    });
  }

  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
}

function installCopilot(root: string, autoUpdate: boolean): void {
  const hooksDir = path.join(os.homedir(), ".github", "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const hooksPath = path.join(hooksDir, "catchem.json");

  const tick = getTickCommand(root);

  const events: Record<string, string> = {
    userPromptSubmitted: tick,
    postToolUse: tick,
    sessionStart: tick,
  };

  const config: any = { version: 1 };
  setHooks(config, "hooks", events);

  if (autoUpdate) {
    config.hooks.sessionStart.push({
      type: "command",
      command: getUpdateCommand(),
    });
  }

  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
}

function installCodex(root: string, autoUpdate: boolean): void {
  const configDir = path.join(os.homedir(), ".codex");
  fs.mkdirSync(configDir, { recursive: true });
  const hooksPath = path.join(configDir, "hooks.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = {
    UserPromptSubmit: tick,
    PostToolUse: tick,
    Stop: tick,
  };

  setHooks(config, "hooks", events);

  if (autoUpdate) {
    if (!config.hooks.SessionStart) config.hooks.SessionStart = [];
    config.hooks.SessionStart = (config.hooks.SessionStart as any[]).filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    config.hooks.SessionStart.push({
      type: "command",
      command: getUpdateCommand(),
    });
  }

  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
}

function installOpenCode(root: string, _autoUpdate: boolean): void {
  const pluginsDir = path.join(
    os.homedir(),
    ".config",
    "opencode",
    "plugins",
  );
  fs.mkdirSync(pluginsDir, { recursive: true });
  const pluginPath = path.join(pluginsDir, "catchem.mjs");

  const tick = getTickCommand(root).replace(/\\/g, "\\\\");

  const content = `export default async ({ client }) => ({
  hooks: {
    "tool.execute.after": async () => { require('child_process').execSync('${tick}', { stdio: 'inherit' }); },
    "session.created": async () => { require('child_process').execSync('${tick}', { stdio: 'inherit' }); },
    "chat.message": async () => { require('child_process').execSync('${tick}', { stdio: 'inherit' }); }
  }
});
`;

  fs.writeFileSync(pluginPath, content);
}

function installGemini(root: string, autoUpdate: boolean): void {
  const hooksDir = path.join(os.homedir(), ".gemini", "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const hooksPath = path.join(hooksDir, "catchem.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = {
    postToolUse: tick,
    sessionStart: tick,
  };

  setHooks(config, "hooks", events);

  if (autoUpdate) {
    config.hooks.sessionStart.push({
      type: "command",
      command: getUpdateCommand(),
    });
  }

  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

interface DetectedPlatform {
  name: string;
  detected: boolean;
  install: (root: string, autoUpdate: boolean) => void;
}

function ghCliExists(): boolean {
  try {
    execSync("gh --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getAllPlatforms(): DetectedPlatform[] {
  const home = os.homedir();
  return [
    {
      name: "Claude Code",
      detected: fs.existsSync(path.join(home, ".claude")),
      install: installClaudeCode,
    },
    {
      name: "Cursor",
      detected: fs.existsSync(path.join(home, ".cursor")),
      install: installCursor,
    },
    {
      name: "GitHub Copilot",
      detected:
        ghCliExists() ||
        fs.existsSync(path.join(home, ".config", "github-copilot")),
      install: installCopilot,
    },
    {
      name: "Codex CLI",
      detected: fs.existsSync(path.join(home, ".codex")),
      install: installCodex,
    },
    {
      name: "OpenCode",
      detected: fs.existsSync(path.join(home, ".config", "opencode")),
      install: installOpenCode,
    },
    {
      name: "Gemini CLI",
      detected: fs.existsSync(path.join(home, ".gemini")),
      install: installGemini,
    },
  ];
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
  if (!auto) console.log("🎮 CatchEm Setup\n");

  const platforms = getAllPlatforms();
  const detected = platforms.filter((p) => p.detected);

  if (detected.length === 0) {
    if (!auto) {
      console.log("No supported platforms detected.");
      console.log(
        "Supported: Claude Code, Cursor, GitHub Copilot, Codex, OpenCode, Gemini CLI",
      );
    }
    return;
  }

  if (!auto) {
    console.log("Detected platforms:");
    for (const p of detected) {
      console.log(`  ✓ ${p.name}`);
    }
    console.log();
  }

  // Determine auto-update preference
  let autoUpdate = false;
  if (!auto && process.stdin.isTTY) {
    const answer = await askQuestion(
      "Enable auto-updates? CatchEm will check for updates daily. (y/n): ",
    );
    autoUpdate = answer === "y" || answer === "yes";
  }

  // Persist preference
  const config = loadConfig();
  config.autoUpdate = autoUpdate;
  saveConfig(config);

  const root = getCatchemRoot();

  for (const p of detected) {
    p.install(root, autoUpdate);
    if (!auto) console.log(`  ✅ ${p.name} — hooks & skills installed`);
  }

  if (!auto)
    console.log(
      "\n🎉 Setup complete! Creatures will start appearing as you code.",
    );
}
