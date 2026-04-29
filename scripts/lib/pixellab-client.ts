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

async function callTool(name: string, args: Record<string, unknown>, retries = 3): Promise<unknown> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const c = await getClient();
      const result = await c.callTool({ name, arguments: args });
      if (result.isError) {
        const errorText = result.content
          ?.map((c: any) => (c.type === "text" ? c.text : ""))
          .join(" ");
        throw new Error(`PixelLab ${name} failed: ${errorText}`);
      }
      return result.content;
    } catch (err: any) {
      if (err.message?.includes("fetch failed") || err.message?.includes("Timeout")) {
        console.log(`  [MCP] Connection error (attempt ${attempt}/${retries}), reconnecting...`);
        client = null; // Force reconnect
        if (attempt < retries) await new Promise((r) => setTimeout(r, 5000));
        else throw err;
      } else {
        throw err;
      }
    }
  }
  throw new Error("Unreachable");
}

function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  return content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");
}

function extractImageBase64(content: unknown): string | null {
  if (!Array.isArray(content)) return null;
  for (const c of content as any[]) {
    if (c.type === "image" && c.data) {
      return c.data; // base64 encoded image data
    }
  }
  return null;
}

function extractImageUrl(content: unknown): string | null {
  if (!Array.isArray(content)) return null;
  for (const c of content as any[]) {
    if (c.type === "text") {
      // Match backblaze or api.pixellab URLs ending in .png
      const urlMatch = c.text.match(/https:\/\/[^\s")]+\.png/);
      if (urlMatch) return urlMatch[0];
    }
  }
  return null;
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // PixelLab API URLs need auth, backblaze storage URLs don't
  const headers: Record<string, string> = {};
  if (url.includes("api.pixellab.ai")) {
    headers.Authorization = `Bearer ${process.env.PIXELLAB_API_KEY}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`);
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

    // PixelLab marks completed objects with ✅ in the response, or includes
    // Storage URLs / image content when ready
    if (text.includes("✅") || text.includes("Storage URLs") || text.includes("Download")) {
      return content;
    }
    if (text.includes("❌") || text.includes("failed") || text.includes("error")) {
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
  // Note: reference_image_base64 has a server-side bug (missing width/height),
  // so we use description-only mode for now. The concept art is still generated
  // and saved for manual reference / future use when the bug is fixed.
  // Build a visual description from the ASCII art structure, not the game flavor text.
  // The ASCII art gives visual cues about the creature's shape and features.
  const asciiArt = creature.art.join("\n");
  const content = await callTool("create_object", {
    description: `A cute small creature called ${creature.name}. Pixel art game character, front-facing, cartoon style, transparent background.`,
    size: 64,
    directions: 1,
    view: "side",
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

  // Download the sprite image — prefer base64 from response, fall back to URL
  const spritePath = path.join(outputDir, "sprite.png");
  const imageBase64 = extractImageBase64(completedContent);
  if (imageBase64) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(spritePath, Buffer.from(imageBase64, "base64"));
  } else {
    const imageUrl = extractImageUrl(completedContent);
    if (imageUrl) {
      await downloadImage(imageUrl, spritePath);
    } else {
      throw new Error(`No image data in response for ${creature.id}`);
    }
  }

  return { objectId, spritePath };
}

export async function createIdleAnimation(
  objectId: string,
  outputDir: string,
  creatureId: string
): Promise<string> {
  // Queue the animation on PixelLab's server. Note: the MCP API does not
  // currently expose individual animation frame downloads, so we queue
  // the animation (it stays on PixelLab's servers for later web UI download)
  // and wait for it to complete.
  const content = await callTool("animate_object", {
    object_id: objectId,
    animation_description: "idle breathing",
    frame_count: 8,
  });

  console.log(`  [${creatureId}] Animation queued on PixelLab, polling...`);

  // Poll until animation job completes
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const pollContent = await callTool("get_object", { object_id: objectId });
    const pollText = extractText(pollContent);

    if (pollText.includes("Pending Jobs") || pollText.includes("⏳")) {
      const pctMatch = pollText.match(/(\d+)%/);
      const pct = pctMatch ? pctMatch[1] + "%" : "...";
      console.log(`  [${creatureId}-anim] Processing ${pct} (${(i + 1) * 10}s)`);
      continue;
    }

    // Animation complete — save the preview image
    const idleDir = path.join(outputDir, "idle");
    if (!fs.existsSync(idleDir)) fs.mkdirSync(idleDir, { recursive: true });

    const imageBase64 = extractImageBase64(pollContent);
    if (imageBase64) {
      fs.writeFileSync(path.join(idleDir, "preview.png"), Buffer.from(imageBase64, "base64"));
    }

    console.log(`  [${creatureId}] Animation complete on PixelLab (frames available in web UI)`);
    return idleDir;
  }

  throw new Error(`${creatureId} animation timed out`);
}

export async function disconnectPixelLab(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
