import fs from "fs";
import path from "path";

export function generateHooksJson(hookScriptPath: string): object {
  const command = `node "${hookScriptPath}"`;
  const hookEntry = { hooks: [{ type: "command", command }] };
  return {
    hooks: {
      UserPromptSubmit: [hookEntry],
      PostToolUse: [hookEntry],
      Stop: [hookEntry],
      SessionStart: [hookEntry],
    },
  };
}

export function generatePluginJson(version: string): object {
  return {
    name: "catchem",
    version,
    description: "Passive creature collection — catch creatures as you code",
    author: { name: "catchem" },
    license: "MIT",
    keywords: ["game", "terminal", "creatures", "collection"],
  };
}

export function installClaudeCode(projectRoot: string): void {
  const hookScriptPath = path.join(projectRoot, "scripts", "tick-hook.js");
  const pluginDir = path.join(projectRoot, ".claude-plugin");
  const hooksDir = path.join(projectRoot, "hooks");

  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(hooksDir, { recursive: true });

  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  fs.writeFileSync(
    path.join(pluginDir, "plugin.json"),
    JSON.stringify(generatePluginJson(pkg.version), null, 2)
  );
  fs.writeFileSync(
    path.join(hooksDir, "hooks.json"),
    JSON.stringify(generateHooksJson(hookScriptPath), null, 2)
  );
}
