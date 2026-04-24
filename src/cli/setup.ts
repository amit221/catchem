import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

function getCatchemRoot(): string {
  try {
    // ESM context
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.join(__dirname, "../..");
  } catch {
    // CJS context (compiled output)
    // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
    return path.join((global as any).__dirname ?? __dirname, "../..");
  }
}

function installClaudeCode(): void {
  const configDir = path.join(os.homedir(), ".claude");
  const settingsPath = path.join(configDir, "settings.json");
  const root = getCatchemRoot();

  let settings: any = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {}

  if (!settings.hooks) settings.hooks = {};

  const tickCommand = `node "${path.join(root, "scripts", "tick.js")}"`;
  const updateCommand = `node -e "const fs=require('fs'),p=require('path'),os=require('os');const f=p.join(os.homedir(),'.catchem','last-update-check');try{const t=Number(fs.readFileSync(f,'utf8'));if(Date.now()-t<86400000)process.exit(0)}catch{}try{require('child_process').execSync('npm update -g catchem',{stdio:'ignore'});fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,Date.now().toString())}catch{}"`;

  const hookEvents = ["UserPromptSubmit", "PostToolUse", "Stop"];
  for (const event of hookEvents) {
    if (!settings.hooks[event]) settings.hooks[event] = [];
    settings.hooks[event] = settings.hooks[event].filter(
      (h: any) => !JSON.stringify(h).includes("catchem")
    );
    settings.hooks[event].push({ type: "command", command: tickCommand });
  }

  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
    (h: any) => !JSON.stringify(h).includes("catchem")
  );
  settings.hooks.SessionStart.push({ type: "command", command: tickCommand });
  settings.hooks.SessionStart.push({ type: "command", command: updateCommand });

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

  // Write skills
  const skillsDir = path.join(configDir, "skills");
  fs.mkdirSync(skillsDir, { recursive: true });

  const collectionSkill = `---
name: catchem-collection
description: View your CatchEm creature collection, evolution stages, and discovery progress
---

Run the following command to open the CatchEm TUI collection viewer:

\`\`\`bash
node "${path.join(root, "scripts", "launch-collection.mjs")}"
\`\`\`

This launches an interactive terminal UI. Run it with the Bash tool.
`;

  fs.writeFileSync(path.join(skillsDir, "catchem-collection.md"), collectionSkill);
}

interface DetectedPlatform {
  name: string;
  detected: boolean;
  install: () => void;
}

function getAllPlatforms(): DetectedPlatform[] {
  return [
    {
      name: "Claude Code",
      detected: fs.existsSync(path.join(os.homedir(), ".claude")),
      install: installClaudeCode,
    },
  ];
}

export function runSetup(auto: boolean = false): void {
  if (!auto) console.log("🎮 CatchEm Setup\n");

  const platforms = getAllPlatforms();
  const detected = platforms.filter((p) => p.detected);

  if (detected.length === 0) {
    if (!auto) {
      console.log("No supported platforms detected.");
      console.log("Supported: Claude Code, Cursor, GitHub Copilot, Codex, OpenCode");
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

  for (const p of detected) {
    p.install();
    if (!auto) console.log(`  ✅ ${p.name} — hooks & skills installed`);
  }

  if (!auto) console.log("\n🎉 Setup complete! Creatures will start appearing as you code.");
}
