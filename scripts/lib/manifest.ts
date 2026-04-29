import fs from "fs";
import path from "path";
import type { Manifest, CreatureProgress } from "./types.js";

const DEFAULT_PROGRESS: CreatureProgress = {
  concept: "pending",
  sprite: "pending",
  animation: "pending",
};

export function readManifest(filePath: string): Manifest {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function writeManifest(filePath: string, manifest: Manifest): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(manifest, null, 2));
}

export function getProgress(manifest: Manifest, creatureId: string): CreatureProgress {
  return manifest[creatureId] ?? { ...DEFAULT_PROGRESS };
}

export function markStep(
  manifest: Manifest,
  creatureId: string,
  step: keyof CreatureProgress,
  filePath: string
): Manifest {
  const progress = getProgress(manifest, creatureId);
  progress[step] = "completed";
  manifest[creatureId] = progress;
  writeManifest(filePath, manifest);
  return manifest;
}
