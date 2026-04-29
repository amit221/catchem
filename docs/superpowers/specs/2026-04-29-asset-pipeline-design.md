# Asset Pipeline: ASCII Art to Pixel Art Sprites

## Overview

A standalone TypeScript script that automates the conversion of all 91 CatchEm creatures from ASCII art to animated pixel art sprites. The pipeline mirrors the proven manual workflow: ASCII art → GPT concept art → PixelLab pixel art → PixelLab animation.

**Script:** `scripts/generate-assets.ts`  
**Run:** `npx tsx scripts/generate-assets.ts`

## Pipeline Steps (per creature)

### Step 1: Read Creature Data

Read from `creatures/creatures.json`: id, name, description, ASCII art lines.

### Step 2: OpenAI GPT-4o Image Generation

Generate a front-facing hand-drawn concept art image from the ASCII art.

**API:** OpenAI GPT-4o image generation  
**Image size:** 512x512  
**Output:** `assets/creatures/<id>/concept.png`

**Prompt:**
```
Here is the ASCII art of a creature called "{name}":

{ascii art joined with newlines}

{description}

Create a front-facing concept art image of this creature.
Make it look like it was hand drawn.
The style should be suitable as a reference for pixel art conversion.
White or transparent background.
```

### Step 3: PixelLab Sprite Generation

Convert the concept art into a pixel art sprite using PixelLab's `create_object` API.

**Config:**
- Tool: `create_object` (freeform, no body template constraints)
- Directions: 1 (static front-facing)
- Size: 64px
- View: `side` (front-facing camera angle in PixelLab's terminology)
- Reference image: concept art from step 2, passed as base64
- Description: `"{name} — {description}"`

**Polling:** Check `get_object` every 10 seconds until status is `completed` (typically 30-90 seconds).

**Output:** `assets/creatures/<id>/sprite.png`

### Step 4: PixelLab Idle Animation

Animate the completed sprite with a universal idle animation.

**Config:**
- Tool: `animate_object`
- Animation description: `"idle breathing"`
- Frame count: 8
- Directions: default (single direction)

**Polling:** Check status every 10 seconds until done (30-60 seconds).

**Output:** `assets/creatures/<id>/idle/` (individual frame PNGs)

## Interactive Mode (Default)

By default, the script pauses after each step and prompts for confirmation:

```
[zappik] Concept art saved to assets/creatures/zappik/concept.png
  (y) continue  (r) retry  (s) skip creature
>
```

This allows verifying output quality for the first few creatures before committing to batch processing.

## Auto Mode

Pass `--auto` to skip all confirmations and process creatures sequentially without pausing:

```
npx tsx scripts/generate-assets.ts --auto
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `--creature <id>` | Process a single creature |
| `--from <id>` | Start from a specific creature, skip earlier ones |
| `--auto` | Skip interactive confirmations |
| `--step concept\|sprite\|animation` | Run only a specific pipeline step |

## Manifest & Resume

**File:** `assets/manifest.json`

Tracks per-creature, per-step completion status:

```json
{
  "zappik": {
    "concept": "completed",
    "sprite": "completed",
    "animation": "completed"
  },
  "blazard": {
    "concept": "completed",
    "sprite": "pending",
    "animation": "pending"
  }
}
```

- On startup, skips steps already marked `"completed"`
- Failed steps remain `"pending"` for automatic retry on next run
- Manifest is written after each successful step (crash-safe)

## Output Structure

```
assets/
  manifest.json
  creatures/
    zappik/
      concept.png      # GPT hand-drawn concept art (512x512)
      sprite.png        # PixelLab pixel art (64x64)
      idle/             # Animation frames
        frame-0.png
        frame-1.png
        ...
        frame-7.png
    blazard/
      concept.png
      sprite.png
      idle/
        ...
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `openai` | OpenAI SDK — GPT-4o image generation |
| `dotenv` | Load API keys from `.env` |
| `node-fetch` or native `fetch` | Download images from PixelLab URLs |

PixelLab API is called via REST directly (not through MCP).

## Environment Variables

From `.env`:
- `OPENAI_API_KEY` — OpenAI API key
- `PIXELLAB_API_KEY` — PixelLab API key

## Creature Scope

91 creatures across 8 themes:
- egyptian-myths (12)
- elemental-beasts (11)
- galactic-warriors (11)
- greek-myths (12)
- legends-arena (11)
- lotr-legends (12)
- marvel-heroes (11)
- undead-horror (11)
