import fs from "fs";
import path from "path";
import os from "os";

export interface DetectedPlatform {
  name: string;
  detected: boolean;
  configPath: string;
}

export function detectClaudeCode(): DetectedPlatform {
  const configDir = path.join(os.homedir(), ".claude");
  return {
    name: "Claude Code",
    detected: fs.existsSync(configDir),
    configPath: configDir,
  };
}

export function detectAllPlatforms(): DetectedPlatform[] {
  return [
    detectClaudeCode(),
  ];
}
