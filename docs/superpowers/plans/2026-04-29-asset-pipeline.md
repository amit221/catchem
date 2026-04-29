# Asset Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automate the conversion of all 91 CatchEm creatures from ASCII art → GPT concept art → PixelLab pixel art sprites → idle animation.

**Architecture:** A standalone TypeScript script (`scripts/generate-assets.ts`) with helper modules. Uses OpenAI SDK for image generation and the MCP SDK (`@modelcontextprotocol/sdk`) to call PixelLab tools programmatically over their streamable HTTP endpoint. A JSON manifest tracks progress for resumability.

**Tech Stack:** TypeScript (tsx runner), OpenAI SDK, MCP SDK, dotenv, native fetch

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install required packages**

```bash
npm install --save-dev openai dotenv @modelcontextprotocol/sdk
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('openai'); require('dotenv'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai, dotenv, mcp-sdk for asset pipeline"
```

---

### Task 2: Shared Types & Manifest Module

**Files:**
- Create: `scripts/lib/types.ts`
- Create: `scripts/lib/manifest.ts`
- Create: `scripts/tests/manifest.test.ts`

- [ ] **Step 1: Write the types file**

```typescript
// scripts/lib/types.ts

export interface Creature {
  id: string;
  name: string;
  theme: string;
  rarity: string;
  description: string;
  art: string[];
}

export type StepStatus = "pending" | "completed";

export interface CreatureProgress {
  concept: StepStatus;
  sprite: StepStatus;
  animation: StepStatus;
}

export interface Manifest {
  [creatureId: string]: CreatureProgress;
}

export interface PipelineOptions {
  creature?: string;    // --creature <id>: process single creature
  from?: string;        // --from <id>: start from this creature
  auto: boolean;        // --auto: skip confirmations
  step?: "concept" | "sprite" | "animation";  // --step: run only this step
}
```

- [ ] **Step 2: Write the failing manifest test**

```typescript
// scripts/tests/manifest.test.ts
import { readManifest, writeManifest, getProgress, markStep } from "../lib/manifest.js";
import fs from "fs";
import path from "path";
import os from "os";

let testDir: string;

beforeEach(() => {
  testDir = fs.mkdtempSync(path.join(os.tmpdir(), "manifest-test-"));
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

test("readManifest returns empty object when file does not exist", () => {
  const manifest = readManifest(path.join(testDir, "manifest.json"));
  expect(manifest).toEqual({});
});

test("writeManifest and readManifest round-trip", () => {
  const filePath = path.join(testDir, "manifest.json");
  const manifest = {
    zappik: { concept: "completed" as const, sprite: "pending" as const, animation: "pending" as const },
  };
  writeManifest(filePath, manifest);
  const result = readManifest(filePath);
  expect(result).toEqual(manifest);
});

test("getProgress returns default pending for unknown creature", () => {
  const progress = getProgress({}, "zappik");
  expect(progress).toEqual({ concept: "pending", sprite: "pending", animation: "pending" });
});

test("getProgress returns existing progress", () => {
  const manifest = {
    zappik: { concept: "completed" as const, sprite: "pending" as const, animation: "pending" as const },
  };
  expect(getProgress(manifest, "zappik").concept).toBe("completed");
});

test("markStep updates manifest and writes to disk", () => {
  const filePath = path.join(testDir, "manifest.json");
  let manifest = {};
  manifest = markStep(manifest, "zappik", "concept", filePath);
  expect(manifest).toEqual({
    zappik: { concept: "completed", sprite: "pending", animation: "pending" },
  });
  const onDisk = readManifest(filePath);
  expect(onDisk).toEqual(manifest);
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx tsx --test scripts/tests/manifest.test.ts 2>&1 || node --experimental-vm-modules node_modules/jest/bin/jest.js scripts/tests/manifest.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 4: Implement manifest module**

```typescript
// scripts/lib/manifest.ts
import fs from "fs";
import path from "path";
import type { Manifest, CreatureProgress, StepStatus } from "./types.js";

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
```

- [ ] **Step 5: Run test to verify it passes**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js scripts/tests/manifest.test.ts
```

Expected: All 5 tests PASS

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/types.ts scripts/lib/manifest.ts scripts/tests/manifest.test.ts
git commit -m "feat(assets): add types and manifest module with tests"
```

---

### Task 3: OpenAI Concept Art Client

**Files:**
- Create: `scripts/lib/openai-client.ts`

- [ ] **Step 1: Write OpenAI client module**

```typescript
// scripts/lib/openai-client.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import type { Creature } from "./types.js";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

function buildPrompt(creature: Creature): string {
  const asciiArt = creature.art.join("\n");
  return `Here is the ASCII art of a creature called "${creature.name}":

${asciiArt}

${creature.description}

Create a front-facing concept art image of this creature.
Make it look like it was hand drawn.
The style should be suitable as a reference for pixel art conversion.
White or transparent background.`;
}

export async function generateConceptArt(
  creature: Creature,
  outputDir: string
): Promise<string> {
  const openai = getClient();
  const outputPath = path.join(outputDir, "concept.png");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const prompt = buildPrompt(creature);

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
  });

  const imageData = response.data[0];

  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64");
    fs.writeFileSync(outputPath, buffer);
  } else if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
  } else {
    throw new Error(`No image data returned for ${creature.name}`);
  }

  return outputPath;
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/openai-client.ts
git commit -m "feat(assets): add OpenAI concept art generation client"
```

---

### Task 4: PixelLab MCP Client

**Files:**
- Create: `scripts/lib/pixellab-client.ts`

- [ ] **Step 1: Write PixelLab client module**

This module connects to PixelLab's MCP server as a client and calls the `create_object`, `get_object`, and `animate_object` tools programmatically.

```typescript
// scripts/lib/pixellab-client.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";
import type { Creature } from "./types.js";

const PIXELLAB_MCP_URL = "https://api.pixellab.ai/mcp";
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60; // 10 minutes max

let client: Client | null = null;

async function getClient(): Promise<Client> {
  if (client) return client;

  const apiKey = process.env.PIXELLAB_API_KEY;
  if (!apiKey) throw new Error("PIXELLAB_API_KEY not set");

  const transport = new StreamableHTTPClientTransport(
    new URL(PIXELLAB_MCP_URL),
    {
      requestInit: {
        headers: { Authorization: `Bearer ${apiKey}` },
      },
    }
  );

  client = new Client({ name: "catchem-asset-pipeline", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const c = await getClient();
  const result = await c.callTool({ name, arguments: args });
  if (result.isError) {
    const errorText = result.content
      ?.map((c: any) => (c.type === "text" ? c.text : ""))
      .join(" ");
    throw new Error(`PixelLab ${name} failed: ${errorText}`);
  }
  return result.content;
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");
}

function extractImageUrl(content: unknown): string | null {
  if (!Array.isArray(content)) return null;
  for (const c of content as any[]) {
    if (c.type === "text") {
      const urlMatch = c.text.match(/https:\/\/[^\s"]+\.(png|gif)[^\s"]*/);
      if (urlMatch) return urlMatch[0];
    }
    if (c.type === "image") {
      return c.data; // base64
    }
  }
  return null;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.PIXELLAB_API_KEY}` },
  });
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

async function pollUntilComplete(
  toolName: string,
  idParam: Record<string, string>,
  label: string
): Promise<unknown> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const content = await callTool(toolName, idParam);
    const text = extractText(content);

    if (text.includes("completed") || text.includes("review")) {
      return content;
    }
    if (text.includes("failed") || text.includes("error")) {
      throw new Error(`${label} failed: ${text}`);
    }

    console.log(`  [${label}] Polling... (${(i + 1) * 10}s)`);
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error(`${label} timed out after ${MAX_POLL_ATTEMPTS * 10}s`);
}

export async function createSprite(
  creature: Creature,
  conceptArtPath: string,
  outputDir: string
): Promise<{ objectId: string; spritePath: string }> {
  const conceptBase64 = fs.readFileSync(conceptArtPath).toString("base64");

  const content = await callTool("create_object", {
    description: `${creature.name} — ${creature.description}`,
    size: 64,
    directions: 8,
    view: "side",
    reference_image_base64: conceptBase64,
  });

  const text = extractText(content);
  const idMatch = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
  if (!idMatch) throw new Error(`No object ID in response: ${text}`);
  const objectId = idMatch[0];

  console.log(`  [${creature.id}] Object created: ${objectId}, polling...`);

  const completedContent = await pollUntilComplete(
    "get_object",
    { object_id: objectId },
    creature.id
  );

  // Download the sprite image
  const spritePath = path.join(outputDir, "sprite.png");
  const imageUrl = extractImageUrl(completedContent);
  if (imageUrl && imageUrl.startsWith("http")) {
    await downloadImage(imageUrl, spritePath);
  } else if (imageUrl) {
    // base64 data
    fs.writeFileSync(spritePath, Buffer.from(imageUrl, "base64"));
  } else {
    // Try download URL pattern
    const downloadUrl = `${PIXELLAB_MCP_URL}/objects/${objectId}/download`;
    await downloadImage(downloadUrl, spritePath);
  }

  return { objectId, spritePath };
}

export async function createIdleAnimation(
  objectId: string,
  outputDir: string,
  creatureId: string
): Promise<string> {
  const content = await callTool("animate_object", {
    object_id: objectId,
    animation_description: "idle breathing",
    frame_count: 8,
  });

  const text = extractText(content);
  console.log(`  [${creatureId}] Animation queued, polling...`);

  // Poll for completion — animate_object may return job IDs
  // Wait a bit for animation to process
  await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

  // Poll the object to check animation status
  const completedContent = await pollUntilComplete(
    "get_object",
    { object_id: objectId },
    `${creatureId}-anim`
  );

  const idleDir = path.join(outputDir, "idle");
  if (!fs.existsSync(idleDir)) fs.mkdirSync(idleDir, { recursive: true });

  // Extract animation frame URLs/data from completed content
  const completedText = extractText(completedContent);
  const urls = completedText.match(/https:\/\/[^\s"]+/g) || [];

  for (let i = 0; i < urls.length; i++) {
    const framePath = path.join(idleDir, `frame-${i}.png`);
    await downloadImage(urls[i], framePath);
  }

  return idleDir;
}

export async function disconnectPixelLab(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/lib/pixellab-client.ts
git commit -m "feat(assets): add PixelLab MCP client for sprite and animation generation"
```

---

### Task 5: Main Pipeline Script

**Files:**
- Create: `scripts/generate-assets.ts`

- [ ] **Step 1: Write the main orchestration script**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add scripts/generate-assets.ts
git commit -m "feat(assets): add main pipeline script with interactive/auto modes"
```

---

### Task 6: Jest Config for Scripts Tests

**Files:**
- Modify: `jest.config.ts` or `package.json` (jest config)

The existing jest config only covers `tests/` — we need it to also find tests in `scripts/tests/`.

- [ ] **Step 1: Check current jest config**

Look at existing jest configuration (in `package.json` or `jest.config.*`) and add `scripts/tests` to the test roots or test match patterns.

- [ ] **Step 2: Update jest config to include scripts/tests**

If jest config is in `package.json`, add to the `jest` section:

```json
"testMatch": ["**/tests/**/*.test.ts", "**/scripts/tests/**/*.test.ts"]
```

If in a separate `jest.config.*` file, add `scripts/tests` to `roots` or `testMatch`.

- [ ] **Step 3: Run manifest tests to verify config**

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js scripts/tests/manifest.test.ts
```

Expected: All tests PASS

- [ ] **Step 4: Run all tests to verify nothing broke**

```bash
npm test
```

Expected: All existing tests still pass, plus the new manifest tests

- [ ] **Step 5: Commit**

```bash
git add jest.config.* package.json
git commit -m "chore: extend jest config to cover scripts/tests"
```

---

### Task 7: Add .env to .gitignore & Update Spec

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Ensure .env and assets/ are in .gitignore**

Check `.gitignore` and add if missing:

```
.env
assets/creatures/
```

The `assets/creatures/` directory will contain large binary files (PNGs) that shouldn't be committed. The `assets/manifest.json` CAN be committed (it's small JSON tracking progress).

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore .env and generated creature assets"
```

---

### Task 8: End-to-End Smoke Test with One Creature

**Files:** None (manual verification)

- [ ] **Step 1: Run pipeline for a single creature in interactive mode**

```bash
npx tsx scripts/generate-assets.ts --creature zappik
```

Expected output:
```
Asset Pipeline — 1 creatures (0 already complete)
Mode: interactive

=== Zappik (zappik) ===
[1/3] Generating concept art via GPT...
  ✓ Saved: assets/creatures/zappik/concept.png
  (y) continue  (r) retry  (s) skip >
```

- [ ] **Step 2: Verify concept art looks correct**

Open `assets/creatures/zappik/concept.png` and confirm it looks like a hand-drawn version of the ASCII Zappik.

Press `y` to continue to sprite generation.

- [ ] **Step 3: Verify sprite generation**

After PixelLab completes:
```
[2/3] Creating pixel art sprite via PixelLab...
  ✓ Saved: assets/creatures/zappik/sprite.png (object: <uuid>)
  (y) continue  (r) retry  (s) skip >
```

Open `assets/creatures/zappik/sprite.png` and verify it's a pixel art version of the creature.

Press `y` to continue.

- [ ] **Step 4: Verify animation**

```
[3/3] Creating idle animation via PixelLab...
  ✓ Saved: assets/creatures/zappik/idle
  (y) continue  (r) retry  (s) skip >
```

Check `assets/creatures/zappik/idle/` for frame PNGs.

- [ ] **Step 5: Verify manifest**

Check `assets/manifest.json` shows zappik as fully completed:
```json
{
  "zappik": {
    "concept": "completed",
    "sprite": "completed",
    "animation": "completed",
    "objectId": "<uuid>"
  }
}
```

- [ ] **Step 6: Verify resume — re-running skips completed creature**

```bash
npx tsx scripts/generate-assets.ts --creature zappik
```

Expected: `⏭ Zappik — already complete`

- [ ] **Step 7: Fix any issues found during smoke test**

Debug and fix any API integration issues. Common things to watch for:
- OpenAI response format differences (b64_json vs URL)
- PixelLab MCP response parsing (object ID extraction, image URL extraction)
- File path issues on Windows

- [ ] **Step 8: Commit any fixes**

```bash
git add scripts/
git commit -m "fix(assets): fixes from smoke test"
```

---

### Task 9: Test with 2-3 More Creatures, Then Full Run

- [ ] **Step 1: Test a few more creatures interactively**

```bash
npx tsx scripts/generate-assets.ts --creature blazard
npx tsx scripts/generate-assets.ts --creature spectrex
npx tsx scripts/generate-assets.ts --creature anubrix
```

Verify quality across different themes and rarities.

- [ ] **Step 2: Run full auto pipeline**

Once satisfied with quality:

```bash
npx tsx scripts/generate-assets.ts --auto
```

Monitor output. The script will skip already-completed creatures and process the rest.

- [ ] **Step 3: Check final manifest**

Verify `assets/manifest.json` shows all 91 creatures completed.
