// scripts/generate-assets.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import type { Creature, PipelineOptions } from "./lib/types.js";
import { readManifest, getProgress, markStep } from "./lib/manifest.js";
import { generateConceptArt } from "./lib/openai-client.js";
import { createSprite, createIdleAnimation, disconnectPixelLab } from "./lib/pixellab-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CREATURES_PATH = path.join(PROJECT_ROOT, "creatures", "creatures.json");
const ASSETS_DIR = path.join(PROJECT_ROOT, "assets");
const MANIFEST_PATH = path.join(ASSETS_DIR, "manifest.json");

function parseArgs(): PipelineOptions {
  const args = process.argv.slice(2);
  const opts: PipelineOptions = { auto: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--creature":
        opts.creature = args[++i];
        break;
      case "--from":
        opts.from = args[++i];
        break;
      case "--auto":
        opts.auto = true;
        break;
      case "--step":
        opts.step = args[++i] as PipelineOptions["step"];
        break;
    }
  }
  return opts;
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function processCreature(
  creature: Creature,
  manifest: ReturnType<typeof readManifest>,
  opts: PipelineOptions
): Promise<ReturnType<typeof readManifest>> {
  const creatureDir = path.join(ASSETS_DIR, "creatures", creature.id);
  const progress = getProgress(manifest, creature.id);

  console.log(`\n=== ${creature.name} (${creature.id}) ===`);

  // Step 1: Concept Art
  if ((!opts.step || opts.step === "concept") && progress.concept !== "completed") {
    console.log("[1/3] Generating concept art via GPT...");
    try {
      const conceptPath = await generateConceptArt(creature, creatureDir);
      console.log(`  ✓ Saved: ${conceptPath}`);

      if (!opts.auto) {
        const answer = await prompt("  (y) continue  (r) retry  (s) skip > ");
        if (answer === "s") return manifest;
        if (answer === "r") return processCreature(creature, manifest, opts);
      }

      manifest = markStep(manifest, creature.id, "concept", MANIFEST_PATH);
    } catch (err) {
      console.error(`  ✗ Concept art failed: ${err}`);
      return manifest;
    }
  }

  // Step 2: Sprite
  if ((!opts.step || opts.step === "sprite") && progress.sprite !== "completed") {
    const conceptPath = path.join(creatureDir, "concept.png");
    if (!fs.existsSync(conceptPath)) {
      console.log("  ⚠ No concept art found, skipping sprite generation");
      return manifest;
    }

    console.log("[2/3] Creating pixel art sprite via PixelLab...");
    try {
      const { objectId, spritePath } = await createSprite(creature, conceptPath, creatureDir);
      console.log(`  ✓ Saved: ${spritePath} (object: ${objectId})`);

      // Store objectId in manifest for animation step
      (manifest[creature.id] as any).objectId = objectId;

      if (!opts.auto) {
        const answer = await prompt("  (y) continue  (r) retry  (s) skip > ");
        if (answer === "s") return manifest;
        if (answer === "r") {
          manifest[creature.id].sprite = "pending";
          return processCreature(creature, manifest, opts);
        }
      }

      manifest = markStep(manifest, creature.id, "sprite", MANIFEST_PATH);
    } catch (err) {
      console.error(`  ✗ Sprite generation failed: ${err}`);
      return manifest;
    }
  }

  // Step 3: Animation
  if ((!opts.step || opts.step === "animation") && progress.animation !== "completed") {
    const objectId = (manifest[creature.id] as any)?.objectId;
    if (!objectId) {
      console.log("  ⚠ No object ID found, skipping animation");
      return manifest;
    }

    console.log("[3/3] Creating idle animation via PixelLab...");
    try {
      const idleDir = await createIdleAnimation(objectId, creatureDir, creature.id);
      console.log(`  ✓ Saved: ${idleDir}`);

      if (!opts.auto) {
        const answer = await prompt("  (y) continue  (r) retry  (s) skip > ");
        if (answer === "s") return manifest;
        if (answer === "r") {
          manifest[creature.id].animation = "pending";
          return processCreature(creature, manifest, opts);
        }
      }

      manifest = markStep(manifest, creature.id, "animation", MANIFEST_PATH);
    } catch (err) {
      console.error(`  ✗ Animation failed: ${err}`);
      return manifest;
    }
  }

  return manifest;
}

async function main() {
  const opts = parseArgs();

  // Validate env
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY not set in .env");
    process.exit(1);
  }
  if (!process.env.PIXELLAB_API_KEY) {
    console.error("Error: PIXELLAB_API_KEY not set in .env");
    process.exit(1);
  }

  // Load creatures
  const creatures: Creature[] = JSON.parse(fs.readFileSync(CREATURES_PATH, "utf-8"));
  let manifest = readManifest(MANIFEST_PATH);

  // Filter creatures based on CLI flags
  let toProcess = creatures;

  if (opts.creature) {
    toProcess = creatures.filter((c) => c.id === opts.creature);
    if (toProcess.length === 0) {
      console.error(`Creature "${opts.creature}" not found`);
      process.exit(1);
    }
  }

  if (opts.from) {
    const startIdx = creatures.findIndex((c) => c.id === opts.from);
    if (startIdx === -1) {
      console.error(`Creature "${opts.from}" not found`);
      process.exit(1);
    }
    toProcess = creatures.slice(startIdx);
  }

  // Count already completed
  const alreadyDone = toProcess.filter(
    (c) => getProgress(manifest, c.id).animation === "completed"
  ).length;

  console.log(`Asset Pipeline — ${toProcess.length} creatures (${alreadyDone} already complete)`);
  console.log(`Mode: ${opts.auto ? "auto" : "interactive"}`);
  if (opts.step) console.log(`Step filter: ${opts.step} only`);
  console.log("");

  for (const creature of toProcess) {
    const progress = getProgress(manifest, creature.id);

    // Skip fully completed creatures
    if (
      !opts.step &&
      progress.concept === "completed" &&
      progress.sprite === "completed" &&
      progress.animation === "completed"
    ) {
      console.log(`⏭ ${creature.name} — already complete`);
      continue;
    }

    manifest = await processCreature(creature, manifest, opts);
  }

  await disconnectPixelLab();

  const completed = Object.values(manifest).filter(
    (p) => p.concept === "completed" && p.sprite === "completed" && p.animation === "completed"
  ).length;
  console.log(`\nDone! ${completed}/${creatures.length} creatures fully processed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
