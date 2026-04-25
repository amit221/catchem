# CatchEm Town — Design Spec

## Overview

A browser-based pixel art town where caught creatures live, react to the user's coding activity in real-time, and socialize with each other. The town is a top-down RPG-style pixel map rendered on HTML Canvas, served by a local Node server, and fed live data from Claude Code hooks.

## Goals

- Creatures feel alive — they walk between locations, react to what the user is doing, and talk to each other
- Activity-driven — the town reflects the user's coding session in real-time
- Simple to ship — raw Canvas, file-based event system, template dialogue
- Fun to watch — a living "reward" for coding, not a productivity tool

## Architecture

### System Flow

```
Claude Code Hooks (PostToolUse, UserPromptSubmit, SessionStart, Stop)
    │
    ▼
tick.js → appends event to ~/.catchem/events.jsonl
    │
    ▼
Local Node Server (serves town HTML + assets + events.jsonl)
    │
    ▼
Browser (HTML Canvas) polls events.jsonl every 2-3 seconds
    │
    ▼
Town engine processes events → moves creatures → shows dialogue
```

### Components

1. **Event Logger** (`src/town/event-logger.ts`) — Appended to by hooks via tick.js. Writes structured events to `~/.catchem/events.jsonl`. Rotates: keeps last 100 events, clears on SessionStart.

2. **Town Server** (`src/town/server.ts`) — Tiny local Node HTTP server. Serves:
   - `/` → town.html (the Canvas app)
   - `/assets/*` → pixel art sprites, tilesets
   - `/api/events` → returns events.jsonl contents
   - `/api/state` → returns game state (creatures, levels)

3. **Town Renderer** (`src/town/public/town.js`) — Canvas-based renderer. Handles:
   - Tile map rendering (ground, paths, buildings)
   - Creature sprite animation (idle, walk)
   - Speech bubble rendering
   - Camera/scroll (vertical, follows activity)
   - Polling events API and updating creature positions

4. **Town Engine** (`src/town/engine.ts` or inline in town.js) — Logic for:
   - Mapping events to locations
   - Deciding which creatures go where
   - Picking dialogue from templates
   - Creature movement (tweening between locations)

5. **Dialogue Templates** (`src/town/dialogue.ts`) — Template pools grouped by personality type and location/event type.

6. **Asset Pipeline** — PixelLab MCP generates all pixel art at dev time. Assets stored in `src/town/public/assets/`.

## Map Design

### Tile System

- **Tile size:** 32x32 pixels
- **Map layers:**
  1. Ground layer — grass, dirt, paths, water
  2. Building layer — structures, decorations, objects
  3. Creature layer — animated sprites walking around (rendered in code, not a tile layer)
- **Map format:** 2D array of tile IDs, stored as JSON. Hand-authored or generated, not from Tiled editor (keeping deps minimal).
- **Viewport:** Fills browser window. Vertical scroll follows activity. Can also scroll manually.

### Town Layout (top to bottom)

```
╔══════════════════════════════════════╗
║           Town Gate                   ║  ← SessionStart (top of map)
║                                       ║
║    The Watchtower    The Shrine       ║  ← git ops / rare catches
║                                       ║
║         Town Square                   ║  ← Central hub, UserPromptSubmit
║       (large open area)               ║
║                                       ║
║   The Forge    The Archives           ║  ← Write/Edit    Read/Search
║                                       ║
║   Workshop     Test Arena             ║  ← Bash commands  Tests
║                                       ║
║   The Market   The Hospital           ║  ← npm install    Errors
║                                       ║
║   The Tavern   The Park              ║  ← Social spots
║                                       ║
║   The Academy  The Docks             ║  ← High-level teaching / git pull
║                                       ║
║           The Inn                     ║  ← Session end / idle (bottom)
╚══════════════════════════════════════╝
```

Map is roughly 20-30 tiles wide, 50-80 tiles tall. Exact dimensions determined during implementation based on building sizes and spacing.

## Locations (15)

### Activity-Driven Locations

| Location | Trigger | Description |
|---|---|---|
| **The Forge** | PostToolUse → Write, Edit | Creatures hammer code at anvils |
| **The Archives** | PostToolUse → Read, Glob, Grep | Creatures study scrolls and tomes |
| **The Workshop** | PostToolUse → Bash (general) | Creatures tinker with machines |
| **Test Arena** | Bash → test/jest/vitest/pytest | Creatures fight bugs in an arena |
| **The Watchtower** | Bash → git commit, push, merge | Creatures guard and ship code |
| **The Market** | Bash → npm/pip/cargo install | Creatures trade and barter supplies |
| **Town Square** | UserPromptSubmit | Central hub — creatures gather when user speaks |
| **Town Gate** | SessionStart | Creatures wake up, arrive at the gate |
| **The Inn** | Stop / no events for 60s+ | Creatures rest, sleep, wind down |
| **The Hospital** | Bash → non-zero exit code | Creatures heal, bandage wounds |
| **The Docks** | Bash → git pull, fetch, clone | Creatures receive cargo from afar |
| **The Shrine** | Catch event (rare+) | Creatures celebrate a rare catch |

### Social Locations (always active, creatures go here when idle)

| Location | Description |
|---|---|
| **The Tavern** | Creatures gossip, tell stories about past sessions |
| **The Park** | Creatures play, relax, interact casually |
| **The Academy** | Higher-level creatures teach lower-level ones |

### Location Behavior Rules

- When an event fires, 1-3 random caught creatures move to the relevant location
- Creatures not assigned to an activity location drift to social locations
- Higher-level creatures prefer The Academy; lower-level prefer The Park
- Creatures stay at a location for 15-30 seconds before wandering
- When no events fire for 60+ seconds, creatures gradually migrate to The Inn

## Event System

### Event Format (events.jsonl)

Each line is a JSON object:

```json
{"ts": 1706000101, "type": "tool", "tool": "Edit", "file": "src/auth.ts", "session": "abc123"}
{"ts": 1706000108, "type": "tool", "tool": "Bash", "command": "npm test", "exitCode": 0, "session": "abc123"}
{"ts": 1706000115, "type": "prompt", "session": "abc123"}
{"ts": 1706000200, "type": "session_start", "session": "def456"}
{"ts": 1706000300, "type": "stop", "session": "def456"}
{"ts": 1706000150, "type": "catch", "creature": "blazard", "rarity": "common", "isNew": false, "session": "abc123"}
```

### Event Rotation

- Max 100 events in file
- On SessionStart event: clear the file (fresh session = fresh log)
- Rotation happens in tick.js before appending

### Hook Integration

tick.js is modified to:
1. Parse the stdin JSON from Claude Code hooks
2. Extract relevant fields (tool name, file, command, exit code)
3. Append a structured event to `~/.catchem/events.jsonl`
4. Continue with existing catch logic

Hooks to enable (in settings.json):
- `PostToolUse` — for tool activity (Edit, Read, Bash, etc.)
- `UserPromptSubmit` — for user interaction
- `SessionStart` — for session begin
- `Stop` — for session end

**Note:** PostToolUse will fire frequently. The event logger should be fast (append-only, no processing). The catch system should still only fire on `Stop` to avoid the double-catch issue.

## Creature System

### Sprite Assets

- **Size:** 32x32 pixels per frame
- **Views:** 4 directions (down, up, left, right) — or 2 (left, right) with flip for simplicity
- **Animations:** idle (2 frames), walk (4 frames)
- **Format:** PNG sprite sheet per creature, e.g., `blazard.png` containing all frames in a grid
- **Frame timing:** 200ms per frame (5 FPS retro feel)
- **Generation:** PixelLab MCP `create_character` + `animate_character` at dev time
- **Storage:** `src/town/public/assets/creatures/`

### Sprite Sheet Layout (per creature)

```
┌────┬────┬────┬────┐
│ D1 │ D2 │ D3 │ D4 │  ← Down (idle1, idle2, walk1, walk2)
├────┼────┼────┼────┤
│ L1 │ L2 │ L3 │ L4 │  ← Left
├────┼────┼────┼────┤
│ R1 │ R2 │ R3 │ R4 │  ← Right
├────┼────┼────┼────┤
│ U1 │ U2 │ U3 │ U4 │  ← Up
└────┴────┴────┴────┘
128x128 total (4x4 grid of 32x32 frames)
```

### Movement

- Creatures tween (lerp) between positions over 500-800ms
- No pathfinding — creatures teleport near destination then walk the last few tiles
- Random wander within a location's "zone" (defined as a bounding box of tiles)
- Collision: creatures don't collide, they can overlap (keeps it simple)

## Personality & Dialogue System

### Personality Types (8)

Each creature in `creatures.json` gets a new `personality` field:

| Personality | Vibe | Example Creatures |
|---|---|---|
| `snarky` | Sarcastic, eye-rolling | Blazard, Spectrex |
| `nerdy` | Enthusiastic, detail-obsessed | Zappik, Webspinne |
| `dramatic` | Over-the-top, theatrical | Arcanox, Thunderox |
| `chill` | Relaxed, unbothered | Aquashell, Driftmaw |
| `warrior` | Battle-ready, competitive | Ironclash, Bonegrind |
| `mystic` | Cryptic, philosophical | Willowwisp, Phantomweave |
| `goofy` | Silly, pun-loving | Furrox, Scrapshot |
| `noble` | Dignified, formal | Runeking, Frostgod |

### Dialogue Template Structure

Templates are keyed by `[personality][location][event_type]`:

```typescript
const DIALOGUE: Record<Personality, Record<Location, string[]>> = {
  snarky: {
    forge: [
      "Oh look, another rewrite. Shocking.",
      "You sure about that edit? I've seen better.",
      "Ah yes, the classic 'fix one bug, create three more'.",
    ],
    test_arena: [
      "Tests passing? Must be a fluke.",
      "Green checkmarks? Don't get used to it.",
    ],
    // ...
  },
  // ...
};
```

### Speech Bubbles

- Rendered as rounded rectangles above creature sprites
- White background, black text, small tail pointing to creature
- Show for 4-6 seconds, then fade
- Max 1 bubble per creature at a time
- Triggered by: arriving at a location, random idle chatter (every 20-30s)

## Building Assets

- **Size:** 64x64 or 96x96 pixels (2-3 tiles)
- **Style:** Top-down RPG, consistent across all 15 buildings
- **Generation:** PixelLab MCP `create_map_object` at dev time
- **Storage:** `src/town/public/assets/buildings/`
- **Ground tiles:** grass, dirt path, stone, water — via `create_topdown_tileset`

## Town Server

### API Endpoints

| Method | Path | Response |
|---|---|---|
| GET | `/` | Serves town.html |
| GET | `/assets/*` | Static file serving for sprites, tilesets |
| GET | `/api/events` | Returns contents of `~/.catchem/events.jsonl` as JSON array |
| GET | `/api/state` | Returns `~/.catchem/state.json` (caught creatures, levels) |
| GET | `/api/creatures` | Returns `creatures.json` (definitions, for rendering) |

### Server Details

- Tiny Node HTTP server (no Express, just `http.createServer`)
- Binds to `localhost` on a random available port
- Prints URL on startup
- No authentication needed (localhost only)
- Launched via `catchem town` CLI command (new subcommand)

## CLI Integration

New command: `catchem town`
- Starts the town server
- Opens the browser automatically
- Prints the URL

Existing `catchem setup` modified to:
- Add PostToolUse, UserPromptSubmit, SessionStart hooks (for events, not catches)
- Keep Stop hook for catches
- Separate concerns: event logging vs catch logic in tick.js

## File Structure (new files)

```
src/town/
  server.ts          — HTTP server
  event-logger.ts    — Append events to events.jsonl
  dialogue.ts        — Dialogue templates by personality x location
  town-map.ts        — Map data (tile grid, location zones)
  public/
    town.html        — Main page (loads town.js)
    town.js          — Canvas renderer + engine
    town.css         — Minimal styles (canvas container)
    assets/
      creatures/     — 91+ sprite sheet PNGs
      buildings/     — 15 building PNGs
      tiles/         — Ground/path tileset PNG
```

## Data Changes

### creatures.json — Add personality field

```json
{
  "id": "blazard",
  "name": "Blazard",
  "theme": "elemental-beasts",
  "rarity": "common",
  "personality": "snarky",
  "description": "...",
  "art": ["..."]
}
```

### New file: ~/.catchem/events.jsonl

Append-only event log, rotated at 100 events, cleared on session start.

### New file: ~/.catchem/town-state.json (optional)

Persists creature positions between browser refreshes:

```json
{
  "creatures": {
    "blazard": { "location": "forge", "x": 12, "y": 34 },
    "zappik": { "location": "tavern", "x": 8, "y": 56 }
  },
  "lastUpdate": 1706000300
}
```

## Canvas Rendering Details

### Render Loop

```
requestAnimationFrame loop (~30 FPS target):
  1. Clear canvas
  2. Calculate camera offset (based on scroll position)
  3. Draw ground layer tiles (only visible tiles, culled by viewport)
  4. Draw building sprites (sorted by y-position for depth)
  5. Draw creature sprites (sorted by y-position for depth)
  6. Draw speech bubbles (always on top)
  7. Draw UI overlay (location labels, minimap if needed)
```

### Camera & Scrolling

- Canvas fills the browser window (`window.innerWidth x window.innerHeight`)
- Camera offset stored as `{ x, y }` in world coordinates
- Mouse wheel / touch scrolls vertically (primary), horizontally if map is wider than viewport
- When an event fires, camera smoothly pans to the relevant location (lerp over 1s)
- Manual scroll overrides auto-pan; auto-pan resumes after 10s of no user scroll
- Pixel-perfect rendering: use `context.imageSmoothingEnabled = false` for crisp pixel art
- Scale: render at 2x or 3x native (64px or 96px per tile on screen) to make pixel art visible. Auto-detect based on window size.

### Screen Scaling

```javascript
// Determine scale factor based on viewport
const minDimension = Math.min(window.innerWidth, window.innerHeight);
const scale = minDimension < 600 ? 2 : 3;  // 2x for small screens, 3x for large
const tileScreenSize = TILE_SIZE * scale;   // 64 or 96 pixels on screen
```

### Drawing Tiles

```javascript
// Only draw visible tiles (viewport culling)
const startCol = Math.floor(camera.x / tileScreenSize);
const startRow = Math.floor(camera.y / tileScreenSize);
const endCol = startCol + Math.ceil(canvas.width / tileScreenSize) + 1;
const endRow = startRow + Math.ceil(canvas.height / tileScreenSize) + 1;

for (let row = startRow; row < endRow; row++) {
  for (let col = startCol; col < endCol; col++) {
    const tileId = groundLayer[row]?.[col];
    if (tileId == null) continue;
    // Draw from tileset spritesheet
    const sx = (tileId % tilesPerRow) * TILE_SIZE;
    const sy = Math.floor(tileId / tilesPerRow) * TILE_SIZE;
    ctx.drawImage(tileset, sx, sy, TILE_SIZE, TILE_SIZE,
      col * tileScreenSize - camera.x,
      row * tileScreenSize - camera.y,
      tileScreenSize, tileScreenSize);
  }
}
```

### Speech Bubble Rendering

```javascript
function drawBubble(ctx, text, x, y, scale) {
  ctx.save();
  const padding = 6 * scale;
  const fontSize = 5 * scale;
  ctx.font = `${fontSize}px monospace`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + padding * 2;
  const h = fontSize + padding * 2;
  const bx = x - w / 2;
  const by = y - h - 8 * scale;  // above creature

  // Rounded rect
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = scale;
  roundRect(ctx, bx, by, w, h, 4 * scale);

  // Tail triangle
  ctx.beginPath();
  ctx.moveTo(x - 4*scale, by + h);
  ctx.lineTo(x, by + h + 5*scale);
  ctx.lineTo(x + 4*scale, by + h);
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = '#111';
  ctx.fillText(text, bx + padding, by + padding + fontSize - 2);
  ctx.restore();
}
```

## Creature Behavior Details

### Behavior State Machine

Each creature has a state:

```
IDLE → WALKING → ARRIVING → IDLE (loop)
         ↓
      TALKING (speech bubble visible)
```

- **IDLE**: Standing at current position, playing idle animation (2 frames, 400ms each). After 5-15s (random), pick a new destination.
- **WALKING**: Tweening toward destination tile. Play walk animation (4 frames, 200ms each). Speed: ~2 tiles/second.
- **ARRIVING**: Reached destination. Trigger a speech bubble (50% chance). Transition to IDLE.
- **TALKING**: Speech bubble visible for 4-6 seconds. Creature stays in IDLE animation. After bubble fades, return to IDLE.

### Creature Assignment Logic

When an event arrives:

```
1. Determine target location from event type + tool/command
2. Pick 1-3 random creatures from the user's caught creatures
   - Prefer creatures not already at that location
   - Prefer creatures that haven't moved recently (cooldown: 10s)
3. Set their destination to a random walkable tile within the location's zone
4. They walk there and say something relevant
```

When no events for 60+ seconds:

```
1. Every 15s, pick 1 creature at a non-social location
2. Move it to a social location (Tavern/Park/Academy)
   - Level 5+: 60% Academy, 20% Tavern, 20% Park
   - Level 1-4: 20% Academy, 30% Tavern, 50% Park
3. Eventually all creatures end up at The Inn
```

### Visible Creature Limit

- Show at most ~15-20 creatures on the map at a time
- Prioritize: creatures at active event locations > social locations > idle
- Others are "inside buildings" (not rendered, but their location is tracked)
- When a creature needs to appear, it walks in from the nearest building entrance

### Wander Zones

Each location has a bounding box (in tile coordinates) where creatures can wander:

```typescript
interface LocationZone {
  id: string;
  name: string;
  buildingTile: { x: number, y: number };  // where the building sprite sits
  zone: { x: number, y: number, w: number, h: number };  // walkable area
  entranceTile: { x: number, y: number };  // where creatures enter/exit
}
```

## Map Construction Details

### Map Dimensions

- **Width:** 24 tiles (768px native, ~2304px at 3x scale)
- **Height:** 60 tiles (1920px native, ~5760px at 3x scale)
- Fits comfortably in a browser with vertical scroll

### Tile Types

| ID | Tile | Description |
|----|------|-------------|
| 0 | Grass | Default ground fill |
| 1 | Dirt path | Walkable roads between locations |
| 2 | Stone | Town square, building floors |
| 3 | Water | Decorative, near docks |
| 4 | Dark grass | Variation, borders |
| 5 | Flowers | Decoration near park |
| 6+ | Building tiles | References into building spritesheet |

### Map Data Format

```typescript
// map stored as simple 2D arrays
const MAP = {
  width: 24,
  height: 60,
  ground: number[][],    // 60 rows x 24 cols of ground tile IDs
  buildings: number[][],  // same size, 0 = empty, >0 = building tile ID
  walkable: boolean[][],  // same size, true = creatures can walk here
  locations: LocationZone[],  // 15 location definitions with zones
};
```

### Town Layout (tile coordinates, approximate)

```
Row 0-5:    Town Gate — entrance arch, open area, path leading south
Row 6-12:   Watchtower (left), Shrine (right) — flanking the main road
Row 13-22:  Town Square — large open stone area, central gathering point
Row 23-30:  Forge (left), Archives (right) — with path between
Row 31-38:  Workshop (left), Test Arena (right)
Row 39-44:  Market (left), Hospital (right)
Row 45-50:  Tavern (left), Park (right) — park has trees, flowers
Row 51-56:  Academy (left), Docks (right) — docks have water tiles
Row 57-60:  The Inn — large building at bottom, cozy area
```

Each location pair occupies ~7-8 rows. Buildings are 2-3 tiles wide, with walkable zones around them.

## Asset Pipeline (PixelLab MCP)

### Generation Strategy

All assets are generated at dev time and committed to the repo. The goal is visual consistency across all assets.

### Step 1: Ground Tileset

Use `create_topdown_tileset` to generate:
- Grass base tile
- Dirt path tiles (straight, corners, intersections)
- Stone/cobblestone tiles
- Water tiles (with edges)
- Flower/decoration tiles

Prompt guidance: "16-bit RPG style, top-down view, 32x32 tiles, earthy natural palette"

Output: single tileset PNG containing all ground tiles in a grid.

### Step 2: Building Assets

Use `create_map_object` for each of the 15 buildings. Generate one at a time with consistent style.

Prompt pattern: "[building name], pixel art, top-down RPG style, 32-bit color, 64x64 or 96x96, transparent background"

Example prompts:
- "A medieval blacksmith forge with anvil and chimney smoke, pixel art, top-down RPG, 96x96"
- "A cozy tavern with a hanging sign, pixel art, top-down RPG, 96x96"
- "A magical glowing shrine with crystals, pixel art, top-down RPG, 96x96"

Output: individual PNGs per building, stored in `assets/buildings/`.

### Step 3: Creature Sprites

Use `create_character` for the base pose, then `animate_character` for walk cycles.

Since we have 91 creatures, this is the most time-intensive step. Strategy:
1. Generate a test batch of 5 creatures first to validate style consistency
2. If consistent, generate remaining in batches of 10-15
3. Each creature needs: front-facing sprite → then animated walk cycle

Prompt pattern: base on existing creature description + name + theme.
Example: "Blazard, a fire lizard creature, pixel art character, 32x32, RPG style, front-facing"

Output: sprite sheet PNGs per creature in `assets/creatures/`.

### Step 4: Decorations

Use `create_map_object` for trees, fences, signs, barrels, crates, etc.
These fill out the map and make it feel alive.

### Asset Naming Convention

```
assets/
  tiles/
    ground-tileset.png     — all ground tiles in one sheet
  buildings/
    forge.png
    archives.png
    workshop.png
    test-arena.png
    watchtower.png
    market.png
    town-square.png        — decorative fountain or statue
    town-gate.png
    inn.png
    hospital.png
    tavern.png
    park.png               — trees and benches
    academy.png
    docks.png
    shrine.png
  creatures/
    blazard.png            — sprite sheet (4x4 grid of 32x32 frames)
    zappik.png
    ...91 files
  decorations/
    tree.png
    fence-h.png
    fence-v.png
    sign.png
    barrel.png
    crate.png
    flower-patch.png
    lamp-post.png
```

## Event-to-Location Mapping (Full Decision Tree)

```typescript
function eventToLocation(event: TownEvent): LocationId {
  switch (event.type) {
    case 'session_start':
      return 'town_gate';

    case 'stop':
      return 'inn';

    case 'prompt':
      return 'town_square';

    case 'catch':
      if (['rare', 'epic', 'legendary', 'mythic'].includes(event.rarity))
        return 'shrine';
      return 'town_square';

    case 'tool':
      return toolToLocation(event.tool, event.command, event.exitCode);
  }
}

function toolToLocation(tool: string, command?: string, exitCode?: number): LocationId {
  // Error handling first
  if (exitCode != null && exitCode !== 0) return 'hospital';

  switch (tool) {
    case 'Write':
    case 'Edit':
      return 'forge';

    case 'Read':
    case 'Glob':
    case 'Grep':
      return 'archives';

    case 'Bash':
      if (!command) return 'workshop';
      // Test commands
      if (/\b(test|jest|vitest|pytest|mocha|spec)\b/i.test(command))
        return 'test_arena';
      // Git shipping
      if (/\bgit\s+(commit|push|merge|rebase)\b/.test(command))
        return 'watchtower';
      // Git receiving
      if (/\bgit\s+(pull|fetch|clone)\b/.test(command))
        return 'docks';
      // Package management
      if (/\b(npm|yarn|pnpm|pip|cargo|go)\s+(install|add|update)\b/.test(command))
        return 'market';
      // Default bash
      return 'workshop';

    default:
      return 'town_square';
  }
}
```

## Dialogue Template Volume

### Target: ~5 lines per personality per location

- 8 personalities x 15 locations x 5 lines = **600 dialogue lines**
- Plus ~3 generic idle lines per personality = 24 more
- Plus ~3 "reacting to another creature" lines per personality = 24 more
- **Total: ~650 dialogue lines**

### Template Variables

Templates can include placeholders:

```typescript
"Editing {file} again? Bold move."     // {file} from event data
"That's commit #{count} today!"         // {count} from session stats
"{creature} over there doesn't approve." // {creature} random other creature name
"Level {level} and still grinding!"     // {level} this creature's level
```

### Sample Templates (5 per personality for The Forge)

```typescript
snarky: [
  "Oh look, another rewrite. Shocking.",
  "Editing {file}? Let's see how long THIS version lasts.",
  "You sure you want to change that? Just asking.",
  "I give this edit... 3 minutes before a revert.",
  "The forge is getting hot. Too many rewrites.",
],
nerdy: [
  "Ooh, modifying {file}! Fascinating architecture.",
  "Every edit makes the codebase stronger!",
  "I love the smell of fresh code in the morning.",
  "Did you know this file has been edited {count} times today?",
  "Refactoring is just applied computer science!",
],
dramatic: [
  "THE CODE... SHALL BE REFORGED!",
  "From the ashes of {file}, a new function rises!",
  "This edit will echo through the repository for ETERNITY!",
  "Behold! The forge burns with the fire of creation!",
  "Another masterwork emerges from my anvil!",
],
chill: [
  "Nice edit. Vibes are good today.",
  "Just watching you work. No pressure.",
  "That's cool, that's cool. Keep going.",
  "{file} looks better already, honestly.",
  "Forge is cozy today. Good energy.",
],
warrior: [
  "FORGE THE CODE! MAKE IT STRONGER!",
  "Every line is a battle won!",
  "I shall defend this edit with my life!",
  "The forge flames fuel our victory!",
  "{file} has been CONQUERED!",
],
mystic: [
  "The code reveals its true form...",
  "I sense great potential in this change.",
  "The patterns align. This edit was meant to be.",
  "{file}... the spirits whisper of its importance.",
  "All changes are echoes of a deeper truth.",
],
goofy: [
  "Hehe, you misspelled 'funcion' again... oh wait that's fine.",
  "FORGING! FORGING! ...what are we forging again?",
  "I tried to help edit but my claws are too big.",
  "Beep boop, code goes in, bugs come out!",
  "Is {file} a snack? No? Then why am I here?",
],
noble: [
  "A fine edit, worthy of the main branch.",
  "The forge honors your dedication, developer.",
  "I approve of this change. You may proceed.",
  "This code bears the mark of quality craftsmanship.",
  "Another contribution to our grand codebase. Well done.",
],
```

## Mock Data System

### Purpose

The town is built and tested entirely with mock data before wiring up real hooks. This ensures the rendering, animation, movement, and dialogue all work independently.

### Mock Event Generator

`src/town/public/mock-events.js` — generates fake events on a timer to simulate a coding session:

```javascript
const MOCK_SCENARIO = [
  { delay: 0,    event: { type: 'session_start', ts: Date.now() } },
  { delay: 3000, event: { type: 'prompt', ts: Date.now() } },
  { delay: 5000, event: { type: 'tool', tool: 'Read', file: 'src/app.ts' } },
  { delay: 8000, event: { type: 'tool', tool: 'Edit', file: 'src/app.ts' } },
  { delay: 12000, event: { type: 'tool', tool: 'Bash', command: 'npm test', exitCode: 0 } },
  { delay: 15000, event: { type: 'tool', tool: 'Bash', command: 'npm test', exitCode: 1 } },
  { delay: 18000, event: { type: 'tool', tool: 'Edit', file: 'src/app.ts' } },
  { delay: 22000, event: { type: 'tool', tool: 'Bash', command: 'git commit -m "fix"' } },
  { delay: 25000, event: { type: 'catch', creature: 'blazard', rarity: 'common', isNew: false } },
  { delay: 30000, event: { type: 'tool', tool: 'Bash', command: 'git push' } },
  { delay: 40000, event: { type: 'stop' } },
  // After stop, go idle → creatures migrate to Inn
];
```

### Mock Creature Data

Uses real `creatures.json` but with mock state (random catch counts, levels):

```javascript
function generateMockState(creatures) {
  const state = { creatures: {}, totalCatches: 0 };
  // Randomly "catch" 15-25 creatures with varying levels
  const caught = shuffle(creatures).slice(0, 20);
  for (const c of caught) {
    const catchCount = randomInt(1, 50);
    state.creatures[c.id] = {
      name: c.name,
      catchCount,
      level: calculateLevel(catchCount),
      firstCaught: new Date(Date.now() - randomInt(1, 30) * 86400000).toISOString(),
      lastCaught: new Date().toISOString(),
    };
    state.totalCatches += catchCount;
  }
  return state;
}
```

### Dev Mode Toggle

Town page accepts `?mock=true` query param:
- `localhost:PORT/` — real mode (polls `/api/events`)
- `localhost:PORT/?mock=true` — mock mode (uses mock-events.js, no server API needed)

During development, `?mock=true` is the default. Real mode is wired up in the integration phase.

## Implementation Phases (Revised)

### Phase 1: Standalone Town (mock data, no hooks)

**1a. Static Canvas & Map**
- Set up `src/town/public/` with town.html + town.js + town.css
- Canvas renderer: fill viewport, pixel-perfect scaling, vertical scroll
- Placeholder tiles (colored rectangles) for ground/buildings
- Render the 24x60 map with all 15 location zones marked
- Camera panning (scroll + keyboard arrows)

**1b. Creature Rendering**
- Load placeholder sprites (colored squares with creature initials)
- Sprite animation loop (idle: toggle between 2 frames)
- Draw creatures at positions, sorted by y for depth
- Test with 15-20 mock creatures on screen

**1c. Creature Movement**
- Implement tween/lerp between tiles
- Walk animation during movement
- Wander behavior: pick random tile in zone, walk there, pause
- State machine: IDLE → WALKING → ARRIVING → IDLE

**1d. Speech Bubbles**
- Render speech bubbles above creatures
- Timed display (4-6s) with fade
- Load dialogue templates
- Trigger bubbles on arrival + random idle chatter

**1e. Mock Event System**
- Mock event generator (scripted scenario)
- Event → location mapping
- Creatures react: move to location, say relevant line
- Camera auto-pan to active location

**Milestone: A working, self-contained pixel town in the browser with placeholder art, creatures walking around, reacting to fake events, and saying things.**

### Phase 2: Pixel Art Assets

**2a. Ground Tileset**
- Generate via PixelLab: grass, paths, stone, water, flowers
- Replace placeholder colored tiles with real tileset
- Assemble the map with proper tile placement

**2b. Building Assets**
- Generate 15 buildings via PixelLab
- Place on map, adjust zones if needed
- Add decorations (trees, fences, signs, etc.)

**2c. Creature Sprites**
- Generate all 91 creature sprites via PixelLab
- Validate style consistency across batch
- Replace placeholder sprites with real sprite sheets

**Milestone: The town looks like a real pixel art RPG village.**

### Phase 3: Personality & Dialogue

- Add `personality` field to all 91 creatures in creatures.json
- Write full dialogue template set (~650 lines)
- Template variable substitution ({file}, {count}, {creature}, {level})
- Test all personality/location combos in mock mode

**Milestone: Creatures have distinct voices and say context-appropriate things.**

### Phase 4: Server & Integration

- Build town server (static files + API endpoints)
- CLI command `catchem town` (start server, open browser)
- Modify tick.js to append events to events.jsonl
- Modify setup to add event hooks (PostToolUse, UserPromptSubmit, SessionStart)
- Keep catch logic on Stop only (separate from event logging)
- Event file rotation (100 max, clear on session start)
- Wire browser to poll `/api/events` in real mode
- End-to-end test with real Claude Code session

**Milestone: Town reacts to actual coding activity.**

### Phase 5: Polish
- Performance tuning (viewport culling, sprite batching)
- Cross-platform testing (Windows, macOS, Linux)
- Edge cases (0 creatures caught, 91 creatures caught, rapid events)
- Browser resize handling
- Minimap or location indicators for navigation

## Non-Goals (v1)

- No LLM-generated dialogue (templates only)
- No creature-to-creature relationships or memory
- No resource/crafting/building mechanics
- No user interaction with the town (click to pet creatures, etc.)
- No sound
- No mobile/responsive (desktop browser only)
