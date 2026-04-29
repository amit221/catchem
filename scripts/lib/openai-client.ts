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
