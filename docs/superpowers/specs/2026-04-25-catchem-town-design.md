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

## Implementation Phases

Even though we ship all 15 locations and all creatures, the build order should be:

### Phase 1: Foundation
- Event logger (hook → events.jsonl)
- Town server (static files + API)
- Canvas renderer (tile map, camera, scroll)
- Basic map with all 15 building positions

### Phase 2: Creatures
- Generate all creature sprites via PixelLab MCP
- Sprite sheet loading and animation
- Creature movement (tween between locations)
- Event → location mapping logic

### Phase 3: Personality & Dialogue
- Add personality field to all 91 creatures
- Write dialogue templates (8 personalities x 15 locations)
- Speech bubble renderer
- Idle chatter system

### Phase 4: Buildings & Polish
- Generate all building assets via PixelLab MCP
- Generate tileset (ground, paths, water, decorations)
- Assemble final map
- Camera follow (scroll to where activity is happening)
- CLI command `catchem town`
- Setup integration (add event hooks)

### Phase 5: Integration & Testing
- End-to-end test: hooks → events → browser → creatures react
- Performance: ensure Canvas runs at 30+ FPS with 91 sprites
- Cross-platform: Windows, macOS, Linux
- File rotation and cleanup

## Non-Goals (v1)

- No LLM-generated dialogue (templates only)
- No creature-to-creature relationships or memory
- No resource/crafting/building mechanics
- No user interaction with the town (click to pet creatures, etc.)
- No sound
- No mobile/responsive (desktop browser only)
