import fs from "fs";
import path from "path";
import os from "os";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  isGhAvailable,
  getGhUsername,
  findUserGist,
  createGist,
  generateGistMarkdown,
} from "../social/gist.js";

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
    PostToolUse: `${tick} --tool-tick`,
  };

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

function installCursor(root: string, autoUpdate: boolean): void {
  const hooksPath = path.join(os.homedir(), ".cursor", "hooks.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  } catch {}

  config.version = 1;
  const tick = getTickCommand(root);

  const events: Record<string, string> = { beforeSubmitPrompt: tick };

  setHooks(config, "hooks", events);

  if (autoUpdate) {
    if (!config.hooks.sessionStart) config.hooks.sessionStart = [];
    config.hooks.sessionStart = config.hooks.sessionStart.filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    config.hooks.sessionStart.push({
      type: "command",
      command: getUpdateCommand(),
    });
  }

  fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
}

// Note: Copilot CLI only supports per-repo hooks (.github/hooks/), not global.
// We install to CWD's .github/hooks/ — user must re-run setup per project.
function installCopilot(root: string, autoUpdate: boolean): void {
  const hooksDir = path.join(process.cwd(), ".github", "hooks");
  fs.mkdirSync(hooksDir, { recursive: true });
  const hooksPath = path.join(hooksDir, "catchem.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
  } catch {}

  config.version = 1;
  const tick = getTickCommand(root);

  const events: Record<string, string> = { userPromptSubmitted: tick };

  setHooks(config, "hooks", events);

  if (autoUpdate) {
    if (!config.hooks.sessionStart) config.hooks.sessionStart = [];
    config.hooks.sessionStart = config.hooks.sessionStart.filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
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

  const events: Record<string, string> = { UserPromptSubmit: tick };

  setHooks(config, "hooks", events, true);

  if (autoUpdate) {
    if (!config.hooks.SessionStart) config.hooks.SessionStart = [];
    config.hooks.SessionStart = (config.hooks.SessionStart as any[]).filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    config.hooks.SessionStart.push({
      hooks: [{ type: "command", command: getUpdateCommand() }],
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

  const content = `import { execSync } from "child_process";

export const CatchEm = async ({ client, $ }) => ({
  event: async ({ event }) => {
    if (event.type === "message.updated") {
      execSync('${tick}', { stdio: 'inherit' });
    }
  }
});
`;

  fs.writeFileSync(pluginPath, content);
}

function installGemini(root: string, autoUpdate: boolean): void {
  const settingsPath = path.join(os.homedir(), ".gemini", "settings.json");

  let config: any = {};
  try {
    config = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {}

  const tick = getTickCommand(root);

  const events: Record<string, string> = { BeforeAgent: tick };

  setHooks(config, "hooks", events, true);

  if (autoUpdate) {
    if (!config.hooks.SessionStart) config.hooks.SessionStart = [];
    config.hooks.SessionStart = (config.hooks.SessionStart as any[]).filter(
      (h: any) => !JSON.stringify(h).includes("catchem"),
    );
    config.hooks.SessionStart.push({
      hooks: [{ type: "command", command: getUpdateCommand() }],
    });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2));

  // Clean up old hooks file if it exists
  const oldHooksPath = path.join(os.homedir(), ".gemini", "hooks", "catchem.json");
  try { fs.unlinkSync(oldHooksPath); } catch {}
}

// ---------------------------------------------------------------------------
// Platform uninstall adapters
// ---------------------------------------------------------------------------

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
  // Remove old flat file too
  const oldSkillPath = path.join(configDir, "skills", "catchem-collection.md");
  try { fs.unlinkSync(oldSkillPath); } catch {}
}

function uninstallCursor(): void {
  const hooksPath = path.join(os.homedir(), ".cursor", "hooks.json");
  try {
    const config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
    cleanOldHooks(config, "hooks");
    if (config.hooks && Object.keys(config.hooks).length === 0) {
      delete config.hooks;
    }
    fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
  } catch {}
}

function uninstallCopilot(): void {
  const hooksPath = path.join(process.cwd(), ".github", "hooks", "catchem.json");
  try { fs.unlinkSync(hooksPath); } catch {}
}

function uninstallCodex(): void {
  const hooksPath = path.join(os.homedir(), ".codex", "hooks.json");
  try {
    const config = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
    cleanOldHooks(config, "hooks");
    if (config.hooks && Object.keys(config.hooks).length === 0) {
      delete config.hooks;
    }
    fs.writeFileSync(hooksPath, JSON.stringify(config, null, 2));
  } catch {}
}

function uninstallOpenCode(): void {
  const pluginPath = path.join(
    os.homedir(), ".config", "opencode", "plugins", "catchem.mjs",
  );
  try { fs.unlinkSync(pluginPath); } catch {}
}

function uninstallGemini(): void {
  const settingsPath = path.join(os.homedir(), ".gemini", "settings.json");
  try {
    const config = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
    cleanOldHooks(config, "hooks");
    if (config.hooks && Object.keys(config.hooks).length === 0) {
      delete config.hooks;
    }
    fs.writeFileSync(settingsPath, JSON.stringify(config, null, 2));
  } catch {}
  // Clean up old hooks file
  const oldHooksPath = path.join(os.homedir(), ".gemini", "hooks", "catchem.json");
  try { fs.unlinkSync(oldHooksPath); } catch {}
}

// ---------------------------------------------------------------------------
// Platform detection
// ---------------------------------------------------------------------------

interface DetectedPlatform {
  name: string;
  id: string;
  detected: boolean;
  install: (root: string, autoUpdate: boolean) => void;
  uninstall: () => void;
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
      id: "claude-code",
      detected: fs.existsSync(path.join(home, ".claude")),
      install: installClaudeCode,
      uninstall: uninstallClaudeCode,
    },
    {
      name: "Cursor",
      id: "cursor",
      detected: fs.existsSync(path.join(home, ".cursor")),
      install: installCursor,
      uninstall: uninstallCursor,
    },
    {
      name: "GitHub Copilot (per-project)",
      id: "copilot",
      detected: ghCliExists(),
      install: installCopilot,
      uninstall: uninstallCopilot,
    },
    {
      name: "Codex CLI",
      id: "codex",
      detected: fs.existsSync(path.join(home, ".codex")),
      install: installCodex,
      uninstall: uninstallCodex,
    },
    {
      name: "OpenCode",
      id: "opencode",
      detected: fs.existsSync(path.join(home, ".config", "opencode")),
      install: installOpenCode,
      uninstall: uninstallOpenCode,
    },
    {
      name: "Gemini CLI",
      id: "gemini",
      detected: fs.existsSync(path.join(home, ".gemini")),
      install: installGemini,
      uninstall: uninstallGemini,
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

  const config = loadConfig();
  const enabledPlatforms: string[] = (config.enabledPlatforms as string[]) || [];

  // Auto mode: install all detected (or previously enabled) platforms silently
  if (auto) {
    const root = getCatchemRoot();
    const autoUpdate = (config.autoUpdate as boolean) || false;
    if (enabledPlatforms.length === 0) {
      config.enabledPlatforms = detected.map((p) => p.id);
    }
    config.autoUpdate = autoUpdate;

    // Auto gist sync: enable if gh is available and not yet configured
    if (isGhAvailable() && !(config.gist as any)?.gistId) {
      const ghUsername = getGhUsername();
      if (ghUsername) {
        const existingId = findUserGist(ghUsername);
        if (existingId) {
          config.gist = { enabled: true, gistId: existingId, username: ghUsername };
        } else {
          const mgr = await import("../core/state.js").then((m) => new m.StateManager());
          const state = mgr.load();
          const initialMd = generateGistMarkdown(state, ghUsername);
          const created = createGist(
            initialMd,
            "catchem-collection.md",
            `CatchEm Collection - @${ghUsername}`,
          );
          if (created) {
            config.gist = { enabled: true, gistId: created, username: ghUsername };
          }
        }
      }
    }

    saveConfig(config);
    for (const p of detected) {
      if (enabledPlatforms.length === 0 || enabledPlatforms.includes(p.id)) {
        p.install(root, autoUpdate);
      }
    }
    return;
  }

  // Interactive mode: let user choose which platforms to enable/disable
  console.log("Detected platforms:");
  for (let i = 0; i < detected.length; i++) {
    const p = detected[i];
    const enabled = enabledPlatforms.length === 0 || enabledPlatforms.includes(p.id);
    const status = enabled ? "enabled" : "disabled";
    console.log(`  ${i + 1}. ${p.name} [${status}]`);
  }
  console.log();

  if (process.stdin.isTTY) {
    console.log("Enter platform numbers to toggle (e.g. 1,3), or press Enter to keep current:");
    const answer = await askQuestion("> ");

    if (answer) {
      const toggleNums = answer.split(/[\s,]+/).map(Number).filter((n) => n >= 1 && n <= detected.length);
      // Start from current state (default all enabled if first run)
      const currentEnabled = new Set<string>(
        enabledPlatforms.length === 0 ? detected.map((p) => p.id) : enabledPlatforms,
      );
      for (const num of toggleNums) {
        const id = detected[num - 1].id;
        if (currentEnabled.has(id)) {
          currentEnabled.delete(id);
        } else {
          currentEnabled.add(id);
        }
      }
      config.enabledPlatforms = [...currentEnabled];
    } else if (enabledPlatforms.length === 0) {
      // First run, no toggle — enable all detected
      config.enabledPlatforms = detected.map((p) => p.id);
    }
  } else if (enabledPlatforms.length === 0) {
    config.enabledPlatforms = detected.map((p) => p.id);
  }

  // Determine auto-update preference
  let autoUpdate = (config.autoUpdate as boolean) || false;
  if (process.stdin.isTTY) {
    const answer = await askQuestion(
      "Enable auto-updates? CatchEm will check for updates daily. (y/n): ",
    );
    autoUpdate = answer === "y" || answer === "yes";
  }

  config.autoUpdate = autoUpdate;

  // Gist sync detection (interactive mode)
  if (isGhAvailable()) {
    const ghUsername = getGhUsername();
    let enableGist = false;
    if (ghUsername && process.stdin.isTTY) {
      const answer = await askQuestion(
        `GitHub detected (@${ghUsername}). Enable gist sync? (Y/n): `,
      );
      enableGist = answer === "" || answer === "y" || answer === "yes";
    } else if (ghUsername) {
      enableGist = true;
    }

    if (enableGist && ghUsername) {
      let gistId = (config.gist as any)?.gistId as string | undefined;
      if (!gistId) {
        // Check if one already exists
        const existingId = findUserGist(ghUsername);
        if (existingId) {
          gistId = existingId;
        } else {
          const mgr = await import("../core/state.js").then((m) => new m.StateManager());
          const state = mgr.load();
          const initialMd = generateGistMarkdown(state, ghUsername);
          const created = createGist(
            initialMd,
            "catchem-collection.md",
            `CatchEm Collection - @${ghUsername}`,
          );
          if (created) {
            gistId = created;
          }
        }
      }

      if (gistId) {
        config.gist = { enabled: true, gistId, username: ghUsername };
        console.log(`  ✅ Gist sync enabled — https://gist.github.com/${gistId}`);
      } else {
        console.log("  ⚠️  Gist sync: could not create gist. Skipping.");
      }
    } else if (!enableGist) {
      config.gist = { enabled: false };
    }
  }

  saveConfig(config);

  const root = getCatchemRoot();
  const finalEnabled = new Set<string>(config.enabledPlatforms as string[]);

  for (const p of detected) {
    if (finalEnabled.has(p.id)) {
      p.install(root, autoUpdate);
      console.log(`  ✅ ${p.name} — hooks & skills installed`);
    } else {
      p.uninstall();
      console.log(`  ❌ ${p.name} — hooks & skills removed`);
    }
  }

  console.log(
    "\n🎉 Setup complete! Creatures will start appearing on enabled platforms.",
  );
}

// ---------------------------------------------------------------------------
// Uninstall — remove all hooks and skills from every platform
// ---------------------------------------------------------------------------

export async function runUninstall(): Promise<void> {
  console.log("🗑️  CatchEm Uninstall\n");

  const platforms = getAllPlatforms();
  const detected = platforms.filter((p) => p.detected);

  for (const p of detected) {
    p.uninstall();
    console.log(`  ✅ ${p.name} — hooks & skills removed`);
  }

  // Clear enabled platforms from config but keep other settings
  const config = loadConfig();
  delete config.enabledPlatforms;
  saveConfig(config);

  console.log("\n🎉 CatchEm has been uninstalled from all platforms.");
  console.log("Your creature collection in ~/.catchem/state.json is preserved.");
}
