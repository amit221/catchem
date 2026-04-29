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
