# CatchEm Town Phase 1: Standalone Town Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained browser-based pixel art town with placeholder graphics, creatures that walk around, react to mock events, and say things via speech bubbles.

**Architecture:** A single-page HTML Canvas app served by a tiny Node static file server. All game logic runs client-side in vanilla JS. Map data, creature definitions, dialogue templates, and mock events are separate JS modules loaded via ES module imports. No build step — raw browser JS.

**Tech Stack:** HTML Canvas 2D, vanilla JavaScript (ES modules), Node.js `http` module for dev server.

**Spec:** `docs/superpowers/specs/2026-04-25-catchem-town-design.md`

**Scope:** Phase 1 only — mock data, placeholder art, no real hooks. Produces a working town you can open in a browser.

---

## File Structure

```
src/town/
  server.ts              — Static file dev server (Node http)
  public/
    town.html            — HTML shell: canvas element, loads town.js
    town.css             — Full-viewport canvas, dark background
    town.js              — Main entry: init canvas, start game loop, wire modules
    renderer.js          — Canvas drawing: tiles, buildings, creatures, bubbles
    camera.js            — Camera position, scrolling, auto-pan, viewport culling
    map-data.js          — 24x60 tile grid, location zone definitions, walkable mask
    creature-manager.js  — Creature state machine, assignment, wander, movement
    speech.js            — Speech bubble state, timing, rendering helper
    dialogue.js          — Dialogue templates by personality x location
    event-system.js      — Event-to-location mapping, mock event generator
    utils.js             — Shared helpers: lerp, randomInt, shuffle, calculateLevel
    assets/              — (empty for now, placeholder art drawn in code)
      creatures/         — (will hold sprite PNGs in Phase 2)
      buildings/         — (will hold building PNGs in Phase 2)
      tiles/             — (will hold tileset PNGs in Phase 2)
```

Each file has one clear responsibility. `town.js` is the orchestrator — it imports everything else, runs the game loop, and wires modules together.

---

### Task 1: Project Scaffolding — HTML, CSS, Canvas Shell

**Files:**
- Create: `src/town/public/town.html`
- Create: `src/town/public/town.css`
- Create: `src/town/public/town.js`
- Create: `src/town/public/utils.js`

- [ ] **Step 1: Create utils.js with shared helpers**

```javascript
// src/town/public/utils.js

export function lerp(a, b, t) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

export const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];

export function calculateLevel(catchCount) {
  let level = 0;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (catchCount >= threshold) level++;
    else break;
  }
  return level;
}

export const TILE_SIZE = 32;
```

- [ ] **Step 2: Create town.css**

```css
/* src/town/public/town.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #111;
}

canvas {
  display: block;
  cursor: grab;
}

canvas:active {
  cursor: grabbing;
}
```

- [ ] **Step 3: Create town.html**

```html
<!-- src/town/public/town.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CatchEm Town</title>
  <link rel="stylesheet" href="town.css">
</head>
<body>
  <canvas id="town-canvas"></canvas>
  <script type="module" src="town.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create town.js — minimal canvas that fills the viewport**

```javascript
// src/town/public/town.js
import { TILE_SIZE } from './utils.js';

const canvas = document.getElementById('town-canvas');
const ctx = canvas.getContext('2d');

// Scale factor for pixel art (2x or 3x)
let scale = 3;
let tileScreenSize = TILE_SIZE * scale;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const minDim = Math.min(canvas.width, canvas.height);
  scale = minDim < 600 ? 2 : 3;
  tileScreenSize = TILE_SIZE * scale;
}

resize();
window.addEventListener('resize', resize);

// Disable image smoothing for crisp pixel art
function configureCtx() {
  ctx.imageSmoothingEnabled = false;
}

// Placeholder: fill with dark green
function gameLoop(timestamp) {
  configureCtx();
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // TODO: draw map, creatures, bubbles

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 5: Verify — open town.html in browser**

Open `src/town/public/town.html` directly in browser (or via dev server in next task).
Expected: full-viewport dark green canvas, no errors in console.

- [ ] **Step 6: Commit**

```bash
git add src/town/public/town.html src/town/public/town.css src/town/public/town.js src/town/public/utils.js
git commit -m "feat(town): scaffold HTML canvas shell with utils"
```

---

### Task 2: Dev Server — Static File Server

**Files:**
- Create: `src/town/server.ts`

The dev server serves static files from `src/town/public/` and also serves `creatures/creatures.json` from the project root. This lets us develop the town in the browser with hot-reload (manual refresh).

- [ ] **Step 1: Create the static file server**

```typescript
// src/town/server.ts
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths relative to compiled output (dist/town/server.js)
// Public dir: ../../src/town/public (since we serve source files directly)
const PROJECT_ROOT = path.join(__dirname, "../..");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "src/town/public");
const CREATURES_JSON = path.join(PROJECT_ROOT, "creatures/creatures.json");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function getMime(filePath: string): string {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function serveFile(res: http.ServerResponse, filePath: string): void {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { "Content-Type": getMime(filePath) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");

  // API: serve creatures.json
  if (pathname === "/api/creatures") {
    serveFile(res, CREATURES_JSON);
    return;
  }

  // API: serve game state
  if (pathname === "/api/state") {
    const statePath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".catchem",
      "state.json",
    );
    serveFile(res, statePath);
    return;
  }

  // API: serve events
  if (pathname === "/api/events") {
    const eventsPath = path.join(
      process.env.HOME || process.env.USERPROFILE || "",
      ".catchem",
      "events.jsonl",
    );
    try {
      const raw = fs.readFileSync(eventsPath, "utf8").trim();
      const events = raw ? raw.split("\n").map((line) => JSON.parse(line)) : [];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(events));
    } catch {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end("[]");
    }
    return;
  }

  // Static files from public dir
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "town.html" : pathname);
  filePath = path.normalize(filePath);

  // Security: ensure we don't serve files outside public dir
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  serveFile(res, filePath);
});

const PORT = parseInt(process.env.PORT || "0", 10);
server.listen(PORT, "127.0.0.1", () => {
  const addr = server.address();
  if (addr && typeof addr === "object") {
    console.log(`CatchEm Town: http://localhost:${addr.port}`);
  }
});
```

- [ ] **Step 2: Add a launch script**

```bash
# Create a simple launch script
cat > src/town/launch-town.mjs << 'SCRIPT'
#!/usr/bin/env node
// Quick launcher that serves src/town/public directly without needing tsc
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, "public");
const PROJECT_ROOT = path.join(__dirname, "../..");
const CREATURES_JSON = path.join(PROJECT_ROOT, "creatures/creatures.json");
const HOME = process.env.HOME || process.env.USERPROFILE || "";

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const p = url.pathname;
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (p === "/api/creatures") {
    try { res.writeHead(200, {"Content-Type":"application/json"}); res.end(fs.readFileSync(CREATURES_JSON)); }
    catch { res.writeHead(200, {"Content-Type":"application/json"}); res.end("[]"); }
    return;
  }
  if (p === "/api/state") {
    try { res.writeHead(200, {"Content-Type":"application/json"}); res.end(fs.readFileSync(path.join(HOME,".catchem","state.json"))); }
    catch { res.writeHead(200, {"Content-Type":"application/json"}); res.end("{}"); }
    return;
  }
  if (p === "/api/events") {
    try {
      const raw = fs.readFileSync(path.join(HOME,".catchem","events.jsonl"),"utf8").trim();
      const events = raw ? raw.split("\n").map(l=>JSON.parse(l)) : [];
      res.writeHead(200, {"Content-Type":"application/json"}); res.end(JSON.stringify(events));
    } catch { res.writeHead(200, {"Content-Type":"application/json"}); res.end("[]"); }
    return;
  }

  let fp = path.normalize(path.join(PUBLIC_DIR, p === "/" ? "town.html" : p));
  if (!fp.startsWith(PUBLIC_DIR)) { res.writeHead(403); res.end("Forbidden"); return; }
  try {
    const data = fs.readFileSync(fp);
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {"Content-Type": MIME[ext] || "application/octet-stream"});
    res.end(data);
  } catch { res.writeHead(404); res.end("Not found"); }
});

server.listen(0, "127.0.0.1", () => {
  const addr = server.address();
  const url = `http://localhost:${addr.port}`;
  console.log(`\n  🏘️  CatchEm Town: ${url}\n`);
  // Auto-open browser
  const { execSync } = await import("child_process");
  try {
    if (process.platform === "win32") execSync(`start ${url}`, {stdio:"ignore"});
    else if (process.platform === "darwin") execSync(`open ${url}`, {stdio:"ignore"});
    else execSync(`xdg-open ${url}`, {stdio:"ignore"});
  } catch {}
});
SCRIPT
```

- [ ] **Step 3: Verify — run the dev server**

Run: `node src/town/launch-town.mjs`
Expected: prints URL, opens browser, shows the dark green canvas.

- [ ] **Step 4: Commit**

```bash
git add src/town/server.ts src/town/launch-town.mjs
git commit -m "feat(town): add static file dev server with API endpoints"
```

---

### Task 3: Map Data — Tile Grid, Locations, Walkable Mask

**Files:**
- Create: `src/town/public/map-data.js`

Defines the 24x60 tile grid with 15 location zones. Ground tiles are IDs (0=grass, 1=dirt path, 2=stone, 3=water, 4=dark grass, 5=flowers). Buildings are placed as location zones with bounding boxes.

- [ ] **Step 1: Create map-data.js with location definitions**

```javascript
// src/town/public/map-data.js

export const MAP_WIDTH = 24;
export const MAP_HEIGHT = 60;

// Tile IDs for ground layer
export const TILE = {
  GRASS: 0,
  PATH: 1,
  STONE: 2,
  WATER: 3,
  DARK_GRASS: 4,
  FLOWERS: 5,
};

// Placeholder colors for each tile type (used until real tileset in Phase 2)
export const TILE_COLORS = {
  [TILE.GRASS]: '#2d5a1e',
  [TILE.PATH]: '#8b7355',
  [TILE.STONE]: '#777788',
  [TILE.WATER]: '#2244aa',
  [TILE.DARK_GRASS]: '#1e4015',
  [TILE.FLOWERS]: '#3d6a2e',
};

// Location definitions with zones
// buildingTile: where the building label is drawn
// zone: bounding box where creatures can wander (in tile coords)
// entrance: where creatures enter/exit the zone
export const LOCATIONS = [
  {
    id: 'town_gate', name: 'Town Gate',
    color: '#70d0d0',
    buildingTile: { x: 10, y: 2 },
    zone: { x: 7, y: 1, w: 10, h: 4 },
    entrance: { x: 12, y: 4 },
  },
  {
    id: 'watchtower', name: 'Watchtower',
    color: '#d0d070',
    buildingTile: { x: 4, y: 8 },
    zone: { x: 2, y: 7, w: 7, h: 5 },
    entrance: { x: 5, y: 11 },
  },
  {
    id: 'shrine', name: 'Shrine',
    color: '#d0d050',
    buildingTile: { x: 17, y: 8 },
    zone: { x: 15, y: 7, w: 7, h: 5 },
    entrance: { x: 18, y: 11 },
  },
  {
    id: 'town_square', name: 'Town Square',
    color: '#70d070',
    buildingTile: { x: 10, y: 16 },
    zone: { x: 5, y: 14, w: 14, h: 7 },
    entrance: { x: 12, y: 13 },
  },
  {
    id: 'forge', name: 'The Forge',
    color: '#f0c040',
    buildingTile: { x: 4, y: 24 },
    zone: { x: 2, y: 23, w: 7, h: 6 },
    entrance: { x: 5, y: 28 },
  },
  {
    id: 'archives', name: 'The Archives',
    color: '#60a0f0',
    buildingTile: { x: 17, y: 24 },
    zone: { x: 15, y: 23, w: 7, h: 6 },
    entrance: { x: 18, y: 28 },
  },
  {
    id: 'workshop', name: 'Workshop',
    color: '#a0a0a0',
    buildingTile: { x: 4, y: 32 },
    zone: { x: 2, y: 31, w: 7, h: 6 },
    entrance: { x: 5, y: 36 },
  },
  {
    id: 'test_arena', name: 'Test Arena',
    color: '#f06060',
    buildingTile: { x: 17, y: 32 },
    zone: { x: 15, y: 31, w: 7, h: 6 },
    entrance: { x: 18, y: 36 },
  },
  {
    id: 'market', name: 'The Market',
    color: '#d070d0',
    buildingTile: { x: 4, y: 40 },
    zone: { x: 2, y: 39, w: 7, h: 5 },
    entrance: { x: 5, y: 43 },
  },
  {
    id: 'hospital', name: 'Hospital',
    color: '#f05050',
    buildingTile: { x: 17, y: 40 },
    zone: { x: 15, y: 39, w: 7, h: 5 },
    entrance: { x: 18, y: 43 },
  },
  {
    id: 'tavern', name: 'The Tavern',
    color: '#d09050',
    buildingTile: { x: 4, y: 47 },
    zone: { x: 2, y: 46, w: 7, h: 5 },
    entrance: { x: 5, y: 50 },
  },
  {
    id: 'park', name: 'The Park',
    color: '#50b050',
    buildingTile: { x: 17, y: 47 },
    zone: { x: 15, y: 46, w: 7, h: 5 },
    entrance: { x: 18, y: 50 },
  },
  {
    id: 'academy', name: 'The Academy',
    color: '#9070d0',
    buildingTile: { x: 4, y: 53 },
    zone: { x: 2, y: 52, w: 7, h: 5 },
    entrance: { x: 5, y: 56 },
  },
  {
    id: 'docks', name: 'The Docks',
    color: '#5090d0',
    buildingTile: { x: 17, y: 53 },
    zone: { x: 15, y: 52, w: 7, h: 5 },
    entrance: { x: 18, y: 56 },
  },
  {
    id: 'inn', name: 'The Inn',
    color: '#7070d0',
    buildingTile: { x: 10, y: 58 },
    zone: { x: 7, y: 57, w: 10, h: 3 },
    entrance: { x: 12, y: 57 },
  },
];

// Generate the ground layer procedurally
// Main road runs down the center (cols 11-12), branches left/right to each location pair
export function generateGroundLayer() {
  const ground = [];
  for (let row = 0; row < MAP_HEIGHT; row++) {
    const r = [];
    for (let col = 0; col < MAP_WIDTH; col++) {
      // Default: grass
      let tile = TILE.GRASS;

      // Border: dark grass
      if (col === 0 || col === MAP_WIDTH - 1 || row === 0 || row === MAP_HEIGHT - 1) {
        tile = TILE.DARK_GRASS;
      }

      // Main road: center columns
      if (col >= 11 && col <= 12 && row >= 1 && row <= MAP_HEIGHT - 2) {
        tile = TILE.PATH;
      }

      // Horizontal paths to locations (every ~8 rows)
      const pathRows = [3, 9, 17, 26, 34, 42, 48, 54, 58];
      if (pathRows.includes(row)) {
        if (col >= 2 && col <= 21) tile = TILE.PATH;
      }

      // Town square: stone floor
      if (row >= 14 && row <= 20 && col >= 6 && col <= 17) {
        tile = TILE.STONE;
      }

      // Water near docks
      if (row >= 52 && row <= 56 && col >= 20 && col <= 23) {
        tile = TILE.WATER;
      }

      // Flowers near park
      if (row >= 46 && row <= 50 && col >= 20 && col <= 21) {
        tile = TILE.FLOWERS;
      }

      r.push(tile);
    }
    ground.push(r);
  }
  return ground;
}

// Generate walkable mask: true if creatures can walk there
export function generateWalkable(ground) {
  return ground.map(row =>
    row.map(tile => tile !== TILE.WATER && tile !== TILE.DARK_GRASS)
  );
}
```

- [ ] **Step 2: Verify — import in town.js and log map dimensions**

Add to town.js temporarily:
```javascript
import { MAP_WIDTH, MAP_HEIGHT, LOCATIONS, generateGroundLayer } from './map-data.js';
const ground = generateGroundLayer();
console.log(`Map: ${MAP_WIDTH}x${MAP_HEIGHT}, ${LOCATIONS.length} locations, ground rows: ${ground.length}`);
```

Run dev server, check console. Expected: `Map: 24x60, 15 locations, ground rows: 60`

- [ ] **Step 3: Commit**

```bash
git add src/town/public/map-data.js
git commit -m "feat(town): add map data with 15 location zones and ground generation"
```

---

### Task 4: Camera System

**Files:**
- Create: `src/town/public/camera.js`

Handles camera position, smooth scrolling via mouse wheel / keyboard, auto-pan to locations, and viewport culling bounds calculation.

- [ ] **Step 1: Create camera.js**

```javascript
// src/town/public/camera.js
import { lerp, TILE_SIZE } from './utils.js';
import { MAP_WIDTH, MAP_HEIGHT } from './map-data.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = null;
    this.targetY = null;
    this.panSpeed = 0.03; // lerp factor per frame
    this.manualScrollTime = 0; // timestamp of last manual scroll
    this.autoResumeDelay = 10000; // ms before auto-pan resumes
  }

  // Get current scale and tile screen size
  getScale(canvasWidth, canvasHeight) {
    const minDim = Math.min(canvasWidth, canvasHeight);
    return minDim < 600 ? 2 : 3;
  }

  getTileScreenSize(canvasWidth, canvasHeight) {
    return TILE_SIZE * this.getScale(canvasWidth, canvasHeight);
  }

  // Max scroll bounds
  getMaxScroll(canvasWidth, canvasHeight) {
    const tss = this.getTileScreenSize(canvasWidth, canvasHeight);
    return {
      maxX: Math.max(0, MAP_WIDTH * tss - canvasWidth),
      maxY: Math.max(0, MAP_HEIGHT * tss - canvasHeight),
    };
  }

  // Clamp camera to map bounds
  clamp(canvasWidth, canvasHeight) {
    const { maxX, maxY } = this.getMaxScroll(canvasWidth, canvasHeight);
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }

  // Manual scroll (mouse wheel)
  scroll(dx, dy, canvasWidth, canvasHeight) {
    this.x += dx;
    this.y += dy;
    this.clamp(canvasWidth, canvasHeight);
    this.manualScrollTime = performance.now();
    this.targetX = null;
    this.targetY = null;
  }

  // Auto-pan to a tile coordinate
  panToTile(tileX, tileY, canvasWidth, canvasHeight) {
    // Don't auto-pan if user scrolled recently
    if (performance.now() - this.manualScrollTime < this.autoResumeDelay) return;

    const tss = this.getTileScreenSize(canvasWidth, canvasHeight);
    this.targetX = tileX * tss - canvasWidth / 2 + tss / 2;
    this.targetY = tileY * tss - canvasHeight / 2 + tss / 2;
  }

  // Call each frame to smoothly move toward target
  update(canvasWidth, canvasHeight) {
    if (this.targetX !== null && this.targetY !== null) {
      this.x = lerp(this.x, this.targetX, this.panSpeed);
      this.y = lerp(this.y, this.targetY, this.panSpeed);

      // Stop panning when close enough
      if (Math.abs(this.x - this.targetX) < 1 && Math.abs(this.y - this.targetY) < 1) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.targetX = null;
        this.targetY = null;
      }
    }
    this.clamp(canvasWidth, canvasHeight);
  }

  // Get visible tile range for culling
  getVisibleRange(canvasWidth, canvasHeight) {
    const tss = this.getTileScreenSize(canvasWidth, canvasHeight);
    return {
      startCol: Math.floor(this.x / tss),
      startRow: Math.floor(this.y / tss),
      endCol: Math.floor(this.x / tss) + Math.ceil(canvasWidth / tss) + 1,
      endRow: Math.floor(this.y / tss) + Math.ceil(canvasHeight / tss) + 1,
    };
  }
}
```

- [ ] **Step 2: Wire scroll events into town.js**

Update `town.js` to import Camera, create instance, and handle mouse wheel + keyboard:

```javascript
// Add to town.js imports:
import { Camera } from './camera.js';

const camera = new Camera();

// Mouse wheel scrolling
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.scroll(e.deltaX, e.deltaY, canvas.width, canvas.height);
}, { passive: false });

// Keyboard scrolling (arrow keys)
const keysDown = new Set();
window.addEventListener('keydown', (e) => keysDown.add(e.key));
window.addEventListener('keyup', (e) => keysDown.delete(e.key));

function handleKeyScroll() {
  const speed = tileScreenSize * 0.15;
  if (keysDown.has('ArrowUp') || keysDown.has('w')) camera.scroll(0, -speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowDown') || keysDown.has('s')) camera.scroll(0, speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowLeft') || keysDown.has('a')) camera.scroll(-speed, 0, canvas.width, canvas.height);
  if (keysDown.has('ArrowRight') || keysDown.has('d')) camera.scroll(speed, 0, canvas.width, canvas.height);
}
```

- [ ] **Step 3: Verify — scroll around the map**

Run dev server. Mouse wheel should scroll the green canvas. Arrow keys should also scroll. Camera should stop at map edges.

- [ ] **Step 4: Commit**

```bash
git add src/town/public/camera.js src/town/public/town.js
git commit -m "feat(town): add camera system with scroll and auto-pan"
```

---

### Task 5: Tile & Building Renderer — Draw the Map

**Files:**
- Create: `src/town/public/renderer.js`
- Modify: `src/town/public/town.js`

Draws the ground tile layer and building placeholder rectangles with location labels. Uses viewport culling from camera.

- [ ] **Step 1: Create renderer.js**

```javascript
// src/town/public/renderer.js
import { TILE_SIZE } from './utils.js';
import { MAP_WIDTH, MAP_HEIGHT, TILE_COLORS, LOCATIONS } from './map-data.js';

export class Renderer {
  constructor(ctx, camera) {
    this.ctx = ctx;
    this.camera = camera;
  }

  // Draw ground tiles (only visible ones)
  drawGround(ground, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const tss = TILE_SIZE * scale;
    const { startCol, startRow, endCol, endRow } = this.camera.getVisibleRange(canvasWidth, canvasHeight);

    for (let row = startRow; row < endRow && row < MAP_HEIGHT; row++) {
      if (row < 0) continue;
      for (let col = startCol; col < endCol && col < MAP_WIDTH; col++) {
        if (col < 0) continue;
        const tileId = ground[row]?.[col];
        if (tileId == null) continue;

        const color = TILE_COLORS[tileId] || '#333';
        ctx.fillStyle = color;
        ctx.fillRect(
          col * tss - this.camera.x,
          row * tss - this.camera.y,
          tss + 1, // +1 to avoid gaps between tiles
          tss + 1,
        );
      }
    }
  }

  // Draw building placeholders (colored rectangles with labels)
  drawBuildings(canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const tss = TILE_SIZE * scale;

    for (const loc of LOCATIONS) {
      const bx = loc.buildingTile.x * tss - this.camera.x;
      const by = loc.buildingTile.y * tss - this.camera.y;
      const bw = 3 * tss; // buildings are 3 tiles wide
      const bh = 3 * tss; // and 3 tiles tall

      // Skip if off screen
      if (bx + bw < 0 || bx > canvasWidth || by + bh < 0 || by > canvasHeight) continue;

      // Building rectangle
      ctx.fillStyle = loc.color + '33'; // semi-transparent fill
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = loc.color;
      ctx.lineWidth = scale;
      ctx.strokeRect(bx, by, bw, bh);

      // Label
      const fontSize = Math.max(10, 4 * scale);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = loc.color;
      ctx.textAlign = 'center';
      ctx.fillText(loc.name, bx + bw / 2, by + bh / 2 + fontSize / 3);
      ctx.textAlign = 'start'; // reset
    }
  }

  // Draw location zone borders (debug overlay, toggled with 'z' key)
  drawZones(canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const tss = TILE_SIZE * scale;

    for (const loc of LOCATIONS) {
      const zx = loc.zone.x * tss - this.camera.x;
      const zy = loc.zone.y * tss - this.camera.y;
      const zw = loc.zone.w * tss;
      const zh = loc.zone.h * tss;

      ctx.strokeStyle = loc.color + '66';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(zx, zy, zw, zh);
      ctx.setLineDash([]);

      // Entrance marker
      const ex = loc.entrance.x * tss - this.camera.x + tss / 2;
      const ey = loc.entrance.y * tss - this.camera.y + tss / 2;
      ctx.fillStyle = loc.color;
      ctx.beginPath();
      ctx.arc(ex, ey, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
```

- [ ] **Step 2: Wire renderer into the game loop in town.js**

Replace the placeholder fill in town.js game loop with actual rendering:

```javascript
// Full updated town.js
import { TILE_SIZE } from './utils.js';
import { MAP_WIDTH, MAP_HEIGHT, LOCATIONS, generateGroundLayer, generateWalkable } from './map-data.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('town-canvas');
const ctx = canvas.getContext('2d');

let scale = 3;
let tileScreenSize = TILE_SIZE * scale;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scale = camera.getScale(canvas.width, canvas.height);
  tileScreenSize = TILE_SIZE * scale;
}

const camera = new Camera();
const renderer = new Renderer(ctx, camera);
const ground = generateGroundLayer();
const walkable = generateWalkable(ground);
let showZones = false;

resize();
window.addEventListener('resize', resize);

// Scroll
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.scroll(e.deltaX, e.deltaY, canvas.width, canvas.height);
}, { passive: false });

// Keyboard
const keysDown = new Set();
window.addEventListener('keydown', (e) => {
  keysDown.add(e.key);
  if (e.key === 'z') showZones = !showZones;
});
window.addEventListener('keyup', (e) => keysDown.delete(e.key));

function handleKeyScroll() {
  const speed = tileScreenSize * 0.15;
  if (keysDown.has('ArrowUp') || keysDown.has('w')) camera.scroll(0, -speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowDown') || keysDown.has('s')) camera.scroll(0, speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowLeft') || keysDown.has('a')) camera.scroll(-speed, 0, canvas.width, canvas.height);
  if (keysDown.has('ArrowRight') || keysDown.has('d')) camera.scroll(speed, 0, canvas.width, canvas.height);
}

function gameLoop(timestamp) {
  ctx.imageSmoothingEnabled = false;
  handleKeyScroll();
  camera.update(canvas.width, canvas.height);

  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw layers
  renderer.drawGround(ground, canvas.width, canvas.height);
  renderer.drawBuildings(canvas.width, canvas.height);
  if (showZones) renderer.drawZones(canvas.width, canvas.height);

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 3: Verify — see the town map in browser**

Run dev server, open browser. Expected:
- Green tiled map with brown dirt paths running vertically and horizontally
- 15 labeled building rectangles at their positions
- Stone town square area in the center
- Water near docks (bottom right)
- Scroll with mouse wheel/arrows
- Press 'z' to toggle zone outlines

- [ ] **Step 4: Commit**

```bash
git add src/town/public/renderer.js src/town/public/town.js
git commit -m "feat(town): render ground tiles and building placeholders with labels"
```

---

### Task 6: Creature Rendering — Placeholder Sprites on Map

**Files:**
- Create: `src/town/public/creature-manager.js`
- Modify: `src/town/public/renderer.js`
- Modify: `src/town/public/town.js`

Load creature definitions, generate mock state (20 caught creatures), place them at random locations, draw as colored circles with initials.

- [ ] **Step 1: Create creature-manager.js**

```javascript
// src/town/public/creature-manager.js
import { randomInt, pickRandom, shuffle, calculateLevel, TILE_SIZE } from './utils.js';
import { LOCATIONS } from './map-data.js';

// Creature behavior states
export const STATE = {
  IDLE: 'idle',
  WALKING: 'walking',
  ARRIVING: 'arriving',
};

// Rarity colors for placeholder rendering
const RARITY_COLORS = {
  common: '#cccccc',
  uncommon: '#55cc55',
  rare: '#5588ff',
  epic: '#bb55dd',
  legendary: '#ffaa33',
  mythic: '#ff3333',
};

export class CreatureManager {
  constructor() {
    this.creatures = [];       // active creature instances on the map
    this.definitions = [];     // all creature definitions from creatures.json
    this.caughtState = {};     // mock game state
  }

  // Initialize with mock data
  initMock(definitions) {
    this.definitions = definitions;
    this.caughtState = this._generateMockState(definitions);

    // Create creature instances for each caught creature
    const caughtIds = Object.keys(this.caughtState.creatures);
    for (const id of caughtIds) {
      const def = definitions.find(d => d.id === id);
      if (!def) continue;
      const state = this.caughtState.creatures[id];
      const loc = pickRandom(LOCATIONS);
      const tileX = randomInt(loc.zone.x, loc.zone.x + loc.zone.w - 1);
      const tileY = randomInt(loc.zone.y, loc.zone.y + loc.zone.h - 1);

      this.creatures.push({
        id: def.id,
        name: def.name,
        rarity: def.rarity,
        personality: def.personality || 'chill',
        level: state.level,
        catchCount: state.catchCount,
        color: RARITY_COLORS[def.rarity] || '#ccc',

        // Position in pixels (world coords, not tile coords)
        x: tileX * TILE_SIZE + TILE_SIZE / 2,
        y: tileY * TILE_SIZE + TILE_SIZE / 2,

        // Movement
        targetX: null,
        targetY: null,
        speed: 2, // tiles per second
        state: STATE.IDLE,
        stateTimer: randomInt(3000, 8000), // ms until next action
        lastMoveTime: 0,
        direction: 'down', // 'up', 'down', 'left', 'right'

        // Animation
        animFrame: 0,
        animTimer: 0,

        // Location tracking
        locationId: loc.id,

        // Speech
        bubble: null, // { text, timer }
      });
    }
  }

  // Initialize with real API data
  initReal(definitions, gameState) {
    this.definitions = definitions;
    this.caughtState = gameState;

    const caughtIds = Object.keys(gameState.creatures || {});
    for (const id of caughtIds) {
      const def = definitions.find(d => d.id === id);
      if (!def) continue;
      const state = gameState.creatures[id];
      const loc = pickRandom(LOCATIONS);
      const tileX = randomInt(loc.zone.x, loc.zone.x + loc.zone.w - 1);
      const tileY = randomInt(loc.zone.y, loc.zone.y + loc.zone.h - 1);

      this.creatures.push({
        id: def.id,
        name: def.name,
        rarity: def.rarity,
        personality: def.personality || 'chill',
        level: state.level,
        catchCount: state.catchCount,
        color: RARITY_COLORS[def.rarity] || '#ccc',
        x: tileX * TILE_SIZE + TILE_SIZE / 2,
        y: tileY * TILE_SIZE + TILE_SIZE / 2,
        targetX: null,
        targetY: null,
        speed: 2,
        state: STATE.IDLE,
        stateTimer: randomInt(3000, 8000),
        lastMoveTime: 0,
        direction: 'down',
        animFrame: 0,
        animTimer: 0,
        locationId: loc.id,
        bubble: null,
      });
    }
  }

  update(dt) {
    // Updated in Task 8 (movement) and Task 9 (wander)
  }

  // Get creatures sorted by Y for depth ordering
  getSorted() {
    return [...this.creatures].sort((a, b) => a.y - b.y);
  }

  _generateMockState(definitions) {
    const state = { creatures: {}, totalCatches: 0 };
    const caught = shuffle(definitions).slice(0, Math.min(20, definitions.length));
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
}
```

- [ ] **Step 2: Add creature drawing to renderer.js**

Append this method to the Renderer class in `renderer.js`:

```javascript
  // Draw creature placeholders (colored circles with initials)
  drawCreatures(creatures, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const tss = TILE_SIZE * scale;
    const radius = tss * 0.4;

    for (const c of creatures) {
      const sx = c.x * scale - this.camera.x;
      const sy = c.y * scale - this.camera.y;

      // Skip if off screen
      if (sx + radius < 0 || sx - radius > canvasWidth ||
          sy + radius < 0 || sy - radius > canvasHeight) continue;

      // Circle body
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Dark outline
      ctx.strokeStyle = '#222';
      ctx.lineWidth = scale;
      ctx.stroke();

      // Initials
      const fontSize = Math.max(8, 4 * scale);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.name.substring(0, 2).toUpperCase(), sx, sy);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
```

- [ ] **Step 3: Wire creatures into town.js**

Add to town.js:

```javascript
import { CreatureManager } from './creature-manager.js';

const creatureManager = new CreatureManager();

// Fetch creature definitions and init mock
fetch('/api/creatures')
  .then(r => r.json())
  .then(defs => {
    creatureManager.initMock(defs);
    console.log(`Loaded ${defs.length} creatures, ${creatureManager.creatures.length} caught`);
  })
  .catch(() => {
    console.warn('Could not load creatures.json, using empty set');
  });

// In the game loop, after drawBuildings:
// renderer.drawCreatures(creatureManager.getSorted(), canvas.width, canvas.height);
```

Update the `gameLoop` to include creatures drawing after buildings.

- [ ] **Step 4: Verify — see creatures on the map**

Run dev server, open browser. Expected:
- ~20 colored circles scattered across location zones
- Each circle has 2-letter initials
- Colors match rarity (white=common, green=uncommon, blue=rare, etc.)
- Creatures are depth-sorted (lower y drawn on top of higher y)

- [ ] **Step 5: Commit**

```bash
git add src/town/public/creature-manager.js src/town/public/renderer.js src/town/public/town.js
git commit -m "feat(town): render placeholder creatures at random locations"
```

---

### Task 7: Creature Movement — Tween, State Machine, Walk Animation

**Files:**
- Modify: `src/town/public/creature-manager.js`
- Modify: `src/town/public/renderer.js`

Implement the IDLE → WALKING → ARRIVING → IDLE state machine. Creatures pick random destinations within their zone and tween there.

- [ ] **Step 1: Add update method to CreatureManager**

Replace the empty `update(dt)` in creature-manager.js:

```javascript
  update(dt) {
    for (const c of this.creatures) {
      // Update animation frame
      c.animTimer += dt;
      if (c.animTimer >= (c.state === STATE.WALKING ? 200 : 400)) {
        c.animFrame = (c.animFrame + 1) % 2;
        c.animTimer = 0;
      }

      // Update state timer
      c.stateTimer -= dt;

      switch (c.state) {
        case STATE.IDLE:
          if (c.stateTimer <= 0) {
            // Pick a random destination within current location zone
            const loc = LOCATIONS.find(l => l.id === c.locationId);
            if (loc) {
              const tx = randomInt(loc.zone.x, loc.zone.x + loc.zone.w - 1);
              const ty = randomInt(loc.zone.y, loc.zone.y + loc.zone.h - 1);
              c.targetX = tx * TILE_SIZE + TILE_SIZE / 2;
              c.targetY = ty * TILE_SIZE + TILE_SIZE / 2;
              c.state = STATE.WALKING;
            }
            c.stateTimer = randomInt(5000, 15000);
          }
          break;

        case STATE.WALKING: {
          const dx = c.targetX - c.x;
          const dy = c.targetY - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const movePerFrame = c.speed * TILE_SIZE * (dt / 1000);

          if (dist <= movePerFrame) {
            // Arrived
            c.x = c.targetX;
            c.y = c.targetY;
            c.targetX = null;
            c.targetY = null;
            c.state = STATE.ARRIVING;
            c.stateTimer = 100; // brief arriving state
          } else {
            // Move toward target
            c.x += (dx / dist) * movePerFrame;
            c.y += (dy / dist) * movePerFrame;

            // Set direction based on movement
            if (Math.abs(dx) > Math.abs(dy)) {
              c.direction = dx > 0 ? 'right' : 'left';
            } else {
              c.direction = dy > 0 ? 'down' : 'up';
            }
          }
          break;
        }

        case STATE.ARRIVING:
          if (c.stateTimer <= 0) {
            c.state = STATE.IDLE;
            c.stateTimer = randomInt(5000, 15000);
          }
          break;
      }
    }
  }
```

- [ ] **Step 2: Update creature rendering to show direction and animation**

Update `drawCreatures` in renderer.js to visualize direction (a small dot showing which way the creature faces) and a slight bounce during walking:

```javascript
  drawCreatures(creatures, canvasWidth, canvasHeight) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const tss = TILE_SIZE * scale;
    const radius = tss * 0.4;

    for (const c of creatures) {
      const sx = c.x * scale - this.camera.x;
      const sy = c.y * scale - this.camera.y;

      if (sx + radius < 0 || sx - radius > canvasWidth ||
          sy + radius < 0 || sy - radius > canvasHeight) continue;

      // Walking bounce effect
      const bounce = c.state === STATE.WALKING ? Math.sin(c.animTimer / 100) * scale : 0;

      // Circle body
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(sx, sy - bounce, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = scale;
      ctx.stroke();

      // Direction indicator (small dot)
      const dirOffset = radius * 0.6;
      let dotX = sx, dotY = sy - bounce;
      if (c.direction === 'right') dotX += dirOffset;
      else if (c.direction === 'left') dotX -= dirOffset;
      else if (c.direction === 'up') dotY -= dirOffset;
      else dotY += dirOffset;

      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.arc(dotX, dotY, scale * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Initials
      const fontSize = Math.max(8, 4 * scale);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(c.name.substring(0, 2).toUpperCase(), sx, sy - bounce);
    }
    ctx.textAlign = 'start';
    ctx.textBaseline = 'alphabetic';
  }
```

- [ ] **Step 3: Add dt tracking and creature update to game loop**

Update town.js game loop to track delta time and call creature update:

```javascript
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = lastTime ? timestamp - lastTime : 16;
  lastTime = timestamp;

  ctx.imageSmoothingEnabled = false;
  handleKeyScroll();
  camera.update(canvas.width, canvas.height);
  creatureManager.update(dt);

  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderer.drawGround(ground, canvas.width, canvas.height);
  renderer.drawBuildings(canvas.width, canvas.height);
  if (showZones) renderer.drawZones(canvas.width, canvas.height);
  renderer.drawCreatures(creatureManager.getSorted(), canvas.width, canvas.height);

  requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 4: Verify — creatures wander around**

Run dev server, open browser. Expected:
- Creatures stand idle for a few seconds, then walk to a new spot within their zone
- Walking creatures bounce slightly
- Direction dot shows which way they're facing
- Movement is smooth (lerp-based)

- [ ] **Step 5: Commit**

```bash
git add src/town/public/creature-manager.js src/town/public/renderer.js src/town/public/town.js
git commit -m "feat(town): creature movement with state machine and wander behavior"
```

---

### Task 8: Speech Bubbles — Rendering and Triggering

**Files:**
- Create: `src/town/public/speech.js`
- Create: `src/town/public/dialogue.js`
- Modify: `src/town/public/renderer.js`
- Modify: `src/town/public/creature-manager.js`

Draw speech bubbles above creatures. Trigger on arrival (50% chance) and random idle chatter.

- [ ] **Step 1: Create dialogue.js with starter templates**

```javascript
// src/town/public/dialogue.js

// Personalities: snarky, nerdy, dramatic, chill, warrior, mystic, goofy, noble
// Locations: town_gate, watchtower, shrine, town_square, forge, archives,
//            workshop, test_arena, market, hospital, tavern, park, academy, docks, inn

const TEMPLATES = {
  snarky: {
    forge: ["Oh look, another rewrite.", "Bold edit. Let's see how long it lasts.", "Fix one bug, create three more."],
    archives: ["Reading the docs? That's a first.", "Searching for answers you won't find.", "Scrolling... scrolling... still scrolling."],
    workshop: ["Bash commands, the hammer of development.", "sudo make-it-work, am I right?", "Terminal magic or terminal disaster?"],
    test_arena: ["Tests passing? Must be a fluke.", "Green checkmarks? Don't get used to it.", "I bet one of those is flaky."],
    watchtower: ["Another commit. Groundbreaking.", "Git push and pray, classic.", "Commit message could use some work."],
    market: ["Installing MORE dependencies?", "node_modules grows ever larger.", "Another package? Shocking."],
    town_square: ["Oh, you're talking to the AI again.", "New prompt, new problems.", "Here we go again..."],
    town_gate: ["Another session begins. Joy.", "Back for more punishment?", "The gate opens. My enthusiasm doesn't."],
    inn: ["Finally, some peace and quiet.", "Session over. About time.", "Logging off... best code you wrote today."],
    hospital: ["Something broke. I'm shocked. Shocked.", "Error? Never saw that coming.", "Have you tried turning it off and on?"],
    tavern: ["Pass the virtual drink.", "Let me tell you about the rewrite of '24...", "This codebase? You don't wanna know."],
    park: ["Touching grass between deploys.", "Nice weather for refactoring.", "At least the bugs here are real."],
    academy: ["Teaching? Me? I suppose someone has to.", "Lesson one: don't trust the tests.", "Study hard. Or don't. See if I care."],
    docks: ["New code arriving from upstream.", "Pulling in someone else's problems.", "Cargo from the remote seas."],
    shrine: ["A rare catch? Even I'm impressed. Almost.", "The shrine glows. Whatever.", "Celebrating catches now, are we?"],
    _idle: ["...", "This is fine.", "*eye roll*"],
  },
  nerdy: {
    forge: ["Fascinating architecture!", "Every edit makes the codebase stronger!", "Refactoring is applied computer science!"],
    archives: ["Ooh, reading source code! My favorite!", "The patterns in this codebase are beautiful!", "Knowledge is power!"],
    workshop: ["Shell scripting is an art form!", "Did you know bash has arrays?", "The terminal is my happy place!"],
    test_arena: ["Test coverage is up 2.3%!", "Unit tests are like mini-proofs!", "Every assertion is a guarantee!"],
    watchtower: ["Git history tells a story!", "Clean commits make me happy!", "Version control is civilization!"],
    market: ["New dependency! Time to read the docs!", "Package managers are amazing!", "Let's check the bundle size!"],
    town_square: ["A new prompt! What will we learn?", "Questions drive innovation!", "I love collaborative coding!"],
    town_gate: ["New session! So many possibilities!", "Good morning! Ready to learn!", "Let's explore the codebase!"],
    inn: ["Time to review what we learned today!", "Rest is important for retention!", "Tomorrow we code even better!"],
    hospital: ["Error analysis time! So exciting!", "Every bug is a learning opportunity!", "Let's examine the stack trace!"],
    tavern: ["Did you know JavaScript has 7 falsy values?", "Let me tell you about monads...", "Fun fact: git was written in 2 weeks!"],
    park: ["Look at this binary tree! Oh wait, that's an oak.", "Nature's algorithms are inspiring!", "Even parks have O(log n) paths!"],
    academy: ["Teaching is the best way to learn!", "Let me explain recursion. First, let me explain recursion.", "Knowledge sharing is beautiful!"],
    docks: ["New upstream changes! Time to learn!", "Remote branches are like pen pals!", "Merging is a form of collaboration!"],
    shrine: ["A rare specimen! Must study it!", "Statistically improbable! Wonderful!", "Adding this to my research notes!"],
    _idle: ["Hmm, interesting...", "I wonder why...", "*adjusts glasses*"],
  },
  dramatic: {
    forge: ["THE CODE... SHALL BE REFORGED!", "From the ashes, a new function rises!", "Behold! The forge burns with CREATION!"],
    archives: ["The ancient scrolls reveal their SECRETS!", "I delve into the DEPTHS of knowledge!", "What mysteries lie within these files?!"],
    workshop: ["THE MACHINE AWAKENS!", "With this command, WORLDS SHALL TREMBLE!", "The workshop hums with POWER!"],
    test_arena: ["CHARGE! INTO THE BUG BATTLE!", "Tests shall FALL or STAND! There is no in between!", "THE ARENA DEMANDS PERFECTION!"],
    watchtower: ["A commit for the AGES!", "From this tower, we DEPLOY to the WORLD!", "The git log shall REMEMBER this day!"],
    market: ["New weapons for our ARSENAL!", "The marketplace OVERFLOWS with treasures!", "DEPENDENCIES... the double-edged sword!"],
    town_square: ["HEAR ME! A new quest has been spoken!", "The developer speaks! ALL MUST LISTEN!", "What EPIC TALE unfolds now?!"],
    town_gate: ["A NEW CHAPTER BEGINS!", "The gates THUNDER open!", "DESTINY calls us to CODE!"],
    inn: ["And so... the hero RESTS.", "The battle is over... for now.", "Even legends must sleep."],
    hospital: ["FALLEN in battle! But NOT defeated!", "A WOUND! But we shall RECOVER!", "The error... it BURNS!"],
    tavern: ["Let me tell you of EPIC battles with bugs!", "GATHER ROUND for tales of GLORY!", "The mightiest code was written RIGHT HERE!"],
    park: ["Even in peace, the WARRIOR stands ready!", "A moment of CALM before the STORM!", "Nature bows before our GREATNESS!"],
    academy: ["I shall FORGE the next generation!", "LEARN, young one! Your destiny AWAITS!", "KNOWLEDGE is the mightiest WEAPON!"],
    docks: ["SHIPS arrive bearing CODE from distant LANDS!", "The TIDE of updates flows ETERNAL!", "What TREASURES has the remote brought?!"],
    shrine: ["A LEGENDARY catch! The HEAVENS REJOICE!", "BEHOLD the RAREST of specimens!", "This moment shall be IMMORTALIZED!"],
    _idle: ["...*brooding intensifies*...", "I sense a disturbance in the code.", "SOON."],
  },
  chill: {
    forge: ["Nice edit. Vibes are good.", "Just watching you work. No pressure.", "Forge is cozy today."],
    archives: ["Reading... nice and chill.", "No rush, just browsing.", "The archives are peaceful."],
    workshop: ["Cool command, dude.", "Terminal's vibing today.", "Just tinkering, no stress."],
    test_arena: ["Tests are... whatever they are.", "Pass or fail, it's all good.", "No stress, just assertions."],
    watchtower: ["Smooth commit. Nice.", "Pushing code, no drama.", "Ship it and chill."],
    market: ["New package, cool cool.", "Dependencies, whatever works.", "npm install peace-of-mind."],
    town_square: ["Hey, what's up.", "New prompt? Cool.", "Just vibing in the square."],
    town_gate: ["Morning. Or evening. Whatever.", "New session, same chill.", "Welcome back, no rush."],
    inn: ["Nap time. Finally.", "Zzz... best part of coding.", "Rest is self-care."],
    hospital: ["It broke? It'll be fine.", "Errors happen. No biggie.", "We'll fix it... eventually."],
    tavern: ["This is the spot.", "Just hanging out, you know?", "Good vibes only."],
    park: ["Nature is nice.", "Just laying here. Don't mind me.", "Grass is good."],
    academy: ["I'll teach... at my own pace.", "Learning is a journey, not a race.", "Chill lessons are the best lessons."],
    docks: ["Something arrived. Cool.", "New code, no pressure.", "The tide comes and goes."],
    shrine: ["Oh nice, a rare one.", "That's pretty cool actually.", "Whoa. Chill."],
    _idle: ["...", "Mmm...", "*yawns*"],
  },
  warrior: {
    forge: ["FORGE THE CODE! MAKE IT STRONGER!", "Every line is a battle won!", "The forge flames fuel our VICTORY!"],
    archives: ["STUDY the enemy's patterns!", "Knowledge is our SHIELD!", "Intel gathered. Ready to STRIKE!"],
    workshop: ["SHARPEN the tools of WAR!", "Our weapons are READY!", "The workshop arms us for BATTLE!"],
    test_arena: ["CHARGE! Test the defenses!", "We shall CRUSH every failing test!", "No bug survives our ONSLAUGHT!"],
    watchtower: ["The deployment ADVANCES!", "ONWARD! Push to production!", "We hold the high ground!"],
    market: ["SUPPLIES for the campaign!", "Reinforce our DEPENDENCIES!", "The army grows STRONGER!"],
    town_square: ["Troops, ASSEMBLE!", "New orders from command!", "The battle plan is SET!"],
    town_gate: ["TO ARMS! A new day of coding!", "The gates open! WE MARCH!", "For GLORY and clean code!"],
    inn: ["Rest well, soldiers. Tomorrow we fight.", "Sheathe your weapons. For now.", "The barracks await."],
    hospital: ["A wound, but we FIGHT ON!", "No warrior falls to a mere ERROR!", "Patch me up. I'm going back in."],
    tavern: ["War stories and ale!", "Let me tell you how we defeated that race condition!", "VICTORY drinks all around!"],
    park: ["Training grounds! Stay SHARP!", "Even at rest, we TRAIN!", "A warrior never truly relaxes!"],
    academy: ["I shall train the NEXT generation!", "Weak code? NOT on my watch!", "Discipline! Focus! COMMIT MESSAGES!"],
    docks: ["Reinforcements from upstream!", "Allied code arrives!", "The fleet brings POWER!"],
    shrine: ["A TROPHY from battle!", "This rare catch proves our MIGHT!", "VICTORY is ours!"],
    _idle: ["Standing guard.", "*sharpens keyboard*", "Awaiting orders."],
  },
  mystic: {
    forge: ["The code reveals its true form...", "I sense great potential in this change.", "The patterns align..."],
    archives: ["The answers are hidden in the source...", "I see... connections everywhere.", "Ancient knowledge flows through these files."],
    workshop: ["The terminal whispers secrets...", "Command and reality intertwine.", "The shell speaks in tongues."],
    test_arena: ["The tests foretell the future...", "Green or red... the oracle decides.", "The assertions align with the cosmos."],
    watchtower: ["The commit echoes through time...", "I foresee this merge... succeeding.", "The git tree branches like fate itself."],
    market: ["Each dependency is a thread in the tapestry.", "The packages align... interesting.", "I sense... a vulnerability."],
    town_square: ["The developer seeks wisdom...", "A question forms in the aether...", "The prompt vibrates with intention."],
    town_gate: ["A new thread in the tapestry begins...", "The stars align for this session.", "I foresaw this beginning."],
    inn: ["Dreams carry the answers we seek...", "In rest, the subconscious debugs.", "The veil thins between sessions."],
    hospital: ["The error was written in the stars.", "Pain is the path to understanding.", "The code must be... purified."],
    tavern: ["Let me read your stack trace...", "I see patterns in the logs...", "The spirits of past developers linger here."],
    park: ["Nature speaks in algorithms.", "The trees know recursion well.", "All is connected. All is one codebase."],
    academy: ["I shall share the ancient wisdom.", "The deepest truths cannot be taught, only discovered.", "Seek not the answer, but the question."],
    docks: ["Messages from beyond the firewall.", "The remote whispers of changes...", "Code arrives from dimensions unknown."],
    shrine: ["The universe delivers the rare ones...", "Destiny manifests in this catch.", "The cosmic code has spoken."],
    _idle: ["The void whispers...", "I sense... something.", "*stares into the middle distance*"],
  },
  goofy: {
    forge: ["FORGING! FORGING! ...what are we forging?", "Beep boop, code goes in, bugs come out!", "I tried to help but my claws are too big!"],
    archives: ["So many files! Where's the snack folder?", "Reading code is like a maze! A fun maze!", "Ooh, what does THIS button do?"],
    workshop: ["I pressed enter and something HAPPENED!", "sudo make me a sandwich!", "The terminal said no. Rude."],
    test_arena: ["GO TESTS GO! Wait, which team am I on?", "I don't understand tests but I BELIEVE!", "Red means stop, green means PARTY!"],
    watchtower: ["I committed! ...to what exactly?", "Git push! Wheeeee!", "Merge conflict? More like merge party!"],
    market: ["SHOPPING SPREE! npm install everything!", "Do they sell snacks at npm?", "I want ALL the packages!"],
    town_square: ["HELLO EVERYBODY!", "What are we doing? I wanna help!", "Is it snack time yet?"],
    town_gate: ["I'M HERE! Did I miss anything?", "GOOD MORNING! Or is it night? Whatever!", "LET'S GOOOOO!"],
    inn: ["Do they have tiny beds? I want a tiny bed!", "Sleepy time! *falls over*", "Five more minutes..."],
    hospital: ["OW! ...wait, do I have bones?", "Error? MORE LIKE ERROR-DORABLE! ...no? ok.", "I'll kiss the boo-boo better!"],
    tavern: ["PARTY! PARTY! PAR-TY!", "One time, I accidentally deleted prod. Haha. Good times.", "Tell me a joke! I'll laugh at ANYTHING!"],
    park: ["GRASS! TREES! BUG! Wait, that's a real bug!", "Can I chase the squirrels?", "Wheee! *rolls in flowers*"],
    academy: ["I'm a teacher now? Oh no.", "Lesson: always npm install. Lesson over!", "2 + 2 = ...fish?"],
    docks: ["BOAT! I love BOATS!", "What's in the package? Is it snacks?", "Ahoy! I'm a pirate now!"],
    shrine: ["SHINY! Can I touch it?", "WOAH! Pretty colors!", "I caught it! ...wait, YOU caught it."],
    _idle: ["Hehe", "La la la~", "*trips over nothing*"],
  },
  noble: {
    forge: ["A fine edit, worthy of the main branch.", "The forge honors your dedication.", "This code bears quality craftsmanship."],
    archives: ["A scholarly pursuit. Most commendable.", "Knowledge befits a true developer.", "The archives hold our legacy."],
    workshop: ["Masterful command of the terminal.", "The tools serve their purpose well.", "Precision in every keystroke."],
    test_arena: ["May the tests prove worthy.", "Quality assurance is a noble cause.", "The arena separates the worthy from the weak."],
    watchtower: ["A commit befitting the repository.", "The watchtower approves this deployment.", "Well-documented, as it should be."],
    market: ["A judicious selection of dependencies.", "Only the finest packages for our codebase.", "Quality over quantity, always."],
    town_square: ["The court is in session.", "Your prompt is duly noted.", "Speak, and you shall be heard."],
    town_gate: ["Welcome to our humble domain.", "A new session graces us.", "The gates open with royal approval."],
    inn: ["Rest well, for tomorrow brings new challenges.", "A ruler must know when to rest.", "The day's work has earned respite."],
    hospital: ["Even the finest code meets adversity.", "A setback, not a defeat.", "We shall recover with dignity."],
    tavern: ["A toast to well-written code.", "The tavern has seen many a celebration.", "Refined conversation is the evening's pleasure."],
    park: ["The royal gardens are splendid today.", "A moment of regal contemplation.", "Even royalty appreciates nature."],
    academy: ["I shall impart wisdom worthy of a king.", "The next generation must uphold our standards.", "Teaching is the noblest of pursuits."],
    docks: ["Tributes arrive from the remote kingdoms.", "The trade routes bring prosperity.", "Our allies send their finest code."],
    shrine: ["A specimen worthy of the royal collection!", "The realm celebrates this rare achievement.", "Most distinguished. Most distinguished indeed."],
    _idle: ["Hmm, quite.", "Indeed.", "*adjusts crown*"],
  },
};

/**
 * Get a random dialogue line for a creature at a location.
 * Falls back to _idle if no location-specific lines exist.
 */
export function getDialogue(personality, locationId) {
  const pool = TEMPLATES[personality]?.[locationId] || TEMPLATES[personality]?._idle || ['...'];
  return pool[Math.floor(Math.random() * pool.length)];
}
```

- [ ] **Step 2: Create speech.js for bubble state management**

```javascript
// src/town/public/speech.js
import { TILE_SIZE } from './utils.js';

/**
 * Draw a speech bubble above a creature.
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} worldX - creature world x
 * @param {number} worldY - creature world y
 * @param {number} scale - rendering scale (2 or 3)
 * @param {number} cameraX
 * @param {number} cameraY
 * @param {number} opacity - 0 to 1 for fade effect
 */
export function drawBubble(ctx, text, worldX, worldY, scale, cameraX, cameraY, opacity) {
  const sx = worldX * scale - cameraX;
  const sy = worldY * scale - cameraY;

  ctx.save();
  ctx.globalAlpha = opacity;

  const padding = 5 * scale;
  const fontSize = Math.max(9, 4 * scale);
  ctx.font = `${fontSize}px monospace`;

  // Word wrap if too long
  const maxWidth = 40 * scale;
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const test = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize + 2;
  const textWidth = Math.max(...lines.map(l => ctx.measureText(l).width));
  const w = textWidth + padding * 2;
  const h = lines.length * lineHeight + padding * 2;
  const bx = sx - w / 2;
  const by = sy - TILE_SIZE * scale * 0.5 - h - 8 * scale;

  // Rounded rectangle
  const r = 4 * scale;
  ctx.fillStyle = 'white';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + w - r, by);
  ctx.quadraticCurveTo(bx + w, by, bx + w, by + r);
  ctx.lineTo(bx + w, by + h - r);
  ctx.quadraticCurveTo(bx + w, by + h, bx + w - r, by + h);
  ctx.lineTo(bx + r, by + h);
  ctx.quadraticCurveTo(bx, by + h, bx, by + h - r);
  ctx.lineTo(bx, by + r);
  ctx.quadraticCurveTo(bx, by, bx + r, by);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Tail triangle
  ctx.beginPath();
  ctx.moveTo(sx - 4 * scale, by + h);
  ctx.lineTo(sx, by + h + 5 * scale);
  ctx.lineTo(sx + 4 * scale, by + h);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.stroke();
  // Cover the line where tail meets bubble
  ctx.fillStyle = 'white';
  ctx.fillRect(sx - 4 * scale + scale, by + h - scale, 8 * scale - scale * 2, scale * 2);

  // Text
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], sx, by + padding + fontSize + i * lineHeight - 2);
  }

  ctx.restore();
}
```

- [ ] **Step 3: Add bubble triggering to creature-manager.js**

Add to the `ARRIVING` state handler and idle chatter in the `update` method:

```javascript
// At the top of creature-manager.js, add:
import { getDialogue } from './dialogue.js';

// In the ARRIVING state handler, after setting state to IDLE:
case STATE.ARRIVING:
  if (c.stateTimer <= 0) {
    c.state = STATE.IDLE;
    c.stateTimer = randomInt(5000, 15000);
    // 50% chance to say something on arrival
    if (Math.random() < 0.5 && !c.bubble) {
      c.bubble = {
        text: getDialogue(c.personality, c.locationId),
        timer: randomInt(4000, 6000),
      };
    }
  }
  break;

// Add bubble timer update at the top of the update loop (before the switch):
if (c.bubble) {
  c.bubble.timer -= dt;
  if (c.bubble.timer <= 0) {
    c.bubble = null;
  }
}

// Add idle chatter: in IDLE state, random chance to talk
// (add this inside the IDLE case, separate from the wander check):
if (c.state === STATE.IDLE && !c.bubble && Math.random() < dt / 25000) {
  c.bubble = {
    text: getDialogue(c.personality, c.locationId),
    timer: randomInt(4000, 6000),
  };
}
```

- [ ] **Step 4: Add bubble drawing to renderer.js**

Add a `drawBubbles` method to Renderer and import the `drawBubble` function:

```javascript
// At top of renderer.js:
import { drawBubble } from './speech.js';
import { STATE } from './creature-manager.js';

// Add method to Renderer class:
  drawBubbles(creatures, canvasWidth, canvasHeight) {
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    for (const c of creatures) {
      if (!c.bubble) continue;
      const opacity = c.bubble.timer < 500 ? c.bubble.timer / 500 : 1;
      drawBubble(this.ctx, c.bubble.text, c.x, c.y, scale, this.camera.x, this.camera.y, opacity);
    }
  }
```

- [ ] **Step 5: Add bubble drawing to game loop in town.js**

After `renderer.drawCreatures(...)`:
```javascript
renderer.drawBubbles(creatureManager.getSorted(), canvas.width, canvas.height);
```

- [ ] **Step 6: Verify — speech bubbles appear**

Run dev server. Expected:
- Creatures occasionally show white speech bubbles with text above them
- Bubbles appear on arrival at a destination (~50% of the time)
- Bubbles fade out after 4-6 seconds
- Random idle chatter happens every ~25 seconds
- Text wraps if too long

- [ ] **Step 7: Commit**

```bash
git add src/town/public/speech.js src/town/public/dialogue.js src/town/public/renderer.js src/town/public/creature-manager.js src/town/public/town.js
git commit -m "feat(town): speech bubbles with dialogue templates for all 8 personalities"
```

---

### Task 9: Mock Event System — Scripted Scenarios and Location Assignment

**Files:**
- Create: `src/town/public/event-system.js`
- Modify: `src/town/public/creature-manager.js`
- Modify: `src/town/public/town.js`

Implement mock event generator that fires fake coding events on a timer. Events trigger creature movement to relevant locations with dialogue.

- [ ] **Step 1: Create event-system.js**

```javascript
// src/town/public/event-system.js

// Map events to location IDs
export function eventToLocation(event) {
  switch (event.type) {
    case 'session_start': return 'town_gate';
    case 'stop': return 'inn';
    case 'prompt': return 'town_square';
    case 'catch':
      if (['rare', 'epic', 'legendary', 'mythic'].includes(event.rarity)) return 'shrine';
      return 'town_square';
    case 'tool': return toolToLocation(event.tool, event.command, event.exitCode);
    default: return 'town_square';
  }
}

function toolToLocation(tool, command, exitCode) {
  if (exitCode != null && exitCode !== 0) return 'hospital';
  switch (tool) {
    case 'Write':
    case 'Edit': return 'forge';
    case 'Read':
    case 'Glob':
    case 'Grep': return 'archives';
    case 'Bash':
      if (!command) return 'workshop';
      if (/\b(test|jest|vitest|pytest|mocha|spec)\b/i.test(command)) return 'test_arena';
      if (/\bgit\s+(commit|push|merge|rebase)\b/.test(command)) return 'watchtower';
      if (/\bgit\s+(pull|fetch|clone)\b/.test(command)) return 'docks';
      if (/\b(npm|yarn|pnpm|pip|cargo|go)\s+(install|add|update)\b/.test(command)) return 'market';
      return 'workshop';
    default: return 'town_square';
  }
}

// Mock event scenario simulating a coding session
const MOCK_SCENARIO = [
  { delay: 2000,  event: { type: 'session_start' } },
  { delay: 5000,  event: { type: 'prompt' } },
  { delay: 8000,  event: { type: 'tool', tool: 'Read', file: 'src/app.ts' } },
  { delay: 12000, event: { type: 'tool', tool: 'Grep', file: 'src/' } },
  { delay: 16000, event: { type: 'tool', tool: 'Edit', file: 'src/app.ts' } },
  { delay: 20000, event: { type: 'tool', tool: 'Write', file: 'src/utils.ts' } },
  { delay: 25000, event: { type: 'tool', tool: 'Bash', command: 'npm test', exitCode: 0 } },
  { delay: 30000, event: { type: 'tool', tool: 'Bash', command: 'npm test', exitCode: 1 } },
  { delay: 34000, event: { type: 'tool', tool: 'Edit', file: 'src/app.ts' } },
  { delay: 38000, event: { type: 'tool', tool: 'Bash', command: 'npm test', exitCode: 0 } },
  { delay: 42000, event: { type: 'tool', tool: 'Bash', command: 'git add -A' } },
  { delay: 44000, event: { type: 'tool', tool: 'Bash', command: 'git commit -m "fix: auth bug"' } },
  { delay: 47000, event: { type: 'tool', tool: 'Bash', command: 'git push' } },
  { delay: 52000, event: { type: 'catch', creature: 'blazard', rarity: 'epic', isNew: true } },
  { delay: 58000, event: { type: 'prompt' } },
  { delay: 62000, event: { type: 'tool', tool: 'Bash', command: 'npm install lodash' } },
  { delay: 68000, event: { type: 'tool', tool: 'Bash', command: 'git pull origin main' } },
  { delay: 75000, event: { type: 'stop' } },
];

export class MockEventSystem {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.timeouts = [];
    this.looping = true;
  }

  start() {
    this._scheduleScenario(0);
  }

  _scheduleScenario(baseDelay) {
    for (const { delay, event } of MOCK_SCENARIO) {
      const t = setTimeout(() => {
        this.onEvent({ ...event, ts: Date.now() });
      }, baseDelay + delay);
      this.timeouts.push(t);
    }
    // Loop the scenario
    if (this.looping) {
      const totalDuration = MOCK_SCENARIO[MOCK_SCENARIO.length - 1].delay + 10000;
      const t = setTimeout(() => this._scheduleScenario(baseDelay + totalDuration), baseDelay + totalDuration);
      this.timeouts.push(t);
    }
  }

  stop() {
    this.looping = false;
    for (const t of this.timeouts) clearTimeout(t);
    this.timeouts = [];
  }
}

export class RealEventSystem {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.lastEventCount = 0;
    this.pollInterval = null;
  }

  start() {
    this.pollInterval = setInterval(() => this._poll(), 3000);
    this._poll(); // initial poll
  }

  async _poll() {
    try {
      const res = await fetch('/api/events');
      const events = await res.json();
      // Only process new events
      if (events.length > this.lastEventCount) {
        const newEvents = events.slice(this.lastEventCount);
        for (const event of newEvents) {
          this.onEvent(event);
        }
        this.lastEventCount = events.length;
      }
    } catch { /* server not available, ignore */ }
  }

  stop() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}
```

- [ ] **Step 2: Add event-driven creature assignment to creature-manager.js**

Add a `handleEvent` method to CreatureManager:

```javascript
  // Called when an event arrives — move creatures to the relevant location
  handleEvent(event, locationId) {
    // Pick 1-3 creatures not already at this location
    const available = this.creatures.filter(c =>
      c.locationId !== locationId &&
      performance.now() - c.lastMoveTime > 10000 // 10s cooldown
    );

    if (available.length === 0) return;

    const count = randomInt(1, Math.min(3, available.length));
    const chosen = shuffle(available).slice(0, count);
    const loc = LOCATIONS.find(l => l.id === locationId);
    if (!loc) return;

    for (const c of chosen) {
      const tx = randomInt(loc.zone.x, loc.zone.x + loc.zone.w - 1);
      const ty = randomInt(loc.zone.y, loc.zone.y + loc.zone.h - 1);
      c.targetX = tx * TILE_SIZE + TILE_SIZE / 2;
      c.targetY = ty * TILE_SIZE + TILE_SIZE / 2;
      c.locationId = locationId;
      c.state = STATE.WALKING;
      c.lastMoveTime = performance.now();
    }

    return chosen; // return moved creatures for camera panning
  }

  // Idle drift: move creatures to social locations when no events
  idleDrift() {
    const socialLocations = ['tavern', 'park', 'academy', 'inn'];
    const nonSocial = this.creatures.filter(c =>
      !socialLocations.includes(c.locationId) &&
      c.state === STATE.IDLE &&
      performance.now() - c.lastMoveTime > 15000
    );

    if (nonSocial.length === 0) return;
    const c = pickRandom(nonSocial);

    // Pick social location based on level
    let locId;
    if (c.level >= 5) {
      const roll = Math.random();
      locId = roll < 0.6 ? 'academy' : roll < 0.8 ? 'tavern' : 'park';
    } else {
      const roll = Math.random();
      locId = roll < 0.5 ? 'park' : roll < 0.8 ? 'tavern' : 'academy';
    }

    const loc = LOCATIONS.find(l => l.id === locId);
    if (!loc) return;

    const tx = randomInt(loc.zone.x, loc.zone.x + loc.zone.w - 1);
    const ty = randomInt(loc.zone.y, loc.zone.y + loc.zone.h - 1);
    c.targetX = tx * TILE_SIZE + TILE_SIZE / 2;
    c.targetY = ty * TILE_SIZE + TILE_SIZE / 2;
    c.locationId = locId;
    c.state = STATE.WALKING;
    c.lastMoveTime = performance.now();
  }
```

- [ ] **Step 3: Wire event system into town.js**

```javascript
import { MockEventSystem, RealEventSystem, eventToLocation } from './event-system.js';

// Determine mode from URL
const useMock = new URLSearchParams(window.location.search).get('mock') !== 'false';

let lastEventTime = performance.now();
let idleDriftTimer = 0;

function handleEvent(event) {
  const locationId = eventToLocation(event);
  console.log(`Event: ${event.type} → ${locationId}`, event);
  const moved = creatureManager.handleEvent(event, locationId);

  // Auto-pan camera to action
  const loc = LOCATIONS.find(l => l.id === locationId);
  if (loc && moved && moved.length > 0) {
    camera.panToTile(loc.buildingTile.x, loc.buildingTile.y, canvas.width, canvas.height);
  }

  lastEventTime = performance.now();
}

// Start event system after creatures are loaded
// (move fetch callback to start events after init)
fetch('/api/creatures')
  .then(r => r.json())
  .then(defs => {
    creatureManager.initMock(defs);
    console.log(`Loaded ${defs.length} creatures, ${creatureManager.creatures.length} caught`);

    const eventSystem = useMock
      ? new MockEventSystem(handleEvent)
      : new RealEventSystem(handleEvent);
    eventSystem.start();
  });

// In game loop, add idle drift check:
// (after creatureManager.update(dt))
idleDriftTimer += dt;
if (performance.now() - lastEventTime > 60000 && idleDriftTimer > 15000) {
  creatureManager.idleDrift();
  idleDriftTimer = 0;
}
```

- [ ] **Step 4: Verify — mock events drive creature movement**

Run dev server, open browser. Expected:
- After 2 seconds, session_start fires → creatures move to Town Gate
- Events fire every few seconds → creatures walk to relevant buildings
- Camera auto-pans to follow the action
- Speech bubbles appear as creatures arrive
- Console logs show events and their location mapping
- After the scenario ends (~75s), creatures drift to social locations
- Scenario loops every ~85 seconds

- [ ] **Step 5: Commit**

```bash
git add src/town/public/event-system.js src/town/public/creature-manager.js src/town/public/town.js
git commit -m "feat(town): mock event system with event-to-location mapping and creature assignment"
```

---

### Task 10: UI Overlay — Location Indicator and Event Log

**Files:**
- Modify: `src/town/public/renderer.js`
- Modify: `src/town/public/town.js`

Add a small HUD showing the current/last event, creature count, and a minimap-like location indicator so the user knows where they are in the town.

- [ ] **Step 1: Add HUD drawing to renderer.js**

```javascript
  // Draw HUD overlay
  drawHUD(canvasWidth, canvasHeight, info) {
    const ctx = this.ctx;
    const scale = this.camera.getScale(canvasWidth, canvasHeight);
    const padding = 10;

    // Top-left: creature count and mode
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(padding, padding, 200, 60);
    ctx.fillStyle = '#eee';
    ctx.font = `${12}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`CatchEm Town ${info.mock ? '(mock)' : ''}`, padding + 8, padding + 18);
    ctx.fillText(`Creatures: ${info.creatureCount}`, padding + 8, padding + 36);
    ctx.fillText(`Events: ${info.eventCount}`, padding + 8, padding + 52);

    // Top-right: last event
    if (info.lastEvent) {
      const text = this._formatEvent(info.lastEvent);
      const tw = ctx.measureText(text).width;
      const ex = canvasWidth - tw - padding - 16;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(ex, padding, tw + 16, 30);
      ctx.fillStyle = '#ffcc44';
      ctx.fillText(text, ex + 8, padding + 20);
    }

    // Bottom: controls hint
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(padding, canvasHeight - 35, 320, 25);
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText('Scroll: mouse wheel / arrows  |  Z: toggle zones', padding + 8, canvasHeight - 18);

    ctx.textAlign = 'start';
  }

  _formatEvent(event) {
    switch (event.type) {
      case 'session_start': return '→ Session Started';
      case 'stop': return '→ Session Ended';
      case 'prompt': return '→ User Prompt';
      case 'catch': return `→ Caught ${event.creature || 'creature'}!`;
      case 'tool':
        if (event.tool === 'Bash' && event.command) return `→ ${event.command.substring(0, 40)}`;
        return `→ ${event.tool} ${event.file || ''}`.substring(0, 45);
      default: return `→ ${event.type}`;
    }
  }
```

- [ ] **Step 2: Wire HUD into town.js game loop**

At the end of the game loop, after drawing bubbles:

```javascript
renderer.drawHUD(canvas.width, canvas.height, {
  mock: useMock,
  creatureCount: creatureManager.creatures.length,
  eventCount: eventCount,
  lastEvent: lastEvent,
});
```

Track `eventCount` and `lastEvent` in the `handleEvent` callback:

```javascript
let eventCount = 0;
let lastEvent = null;

function handleEvent(event) {
  eventCount++;
  lastEvent = event;
  // ... rest of existing handler
}
```

- [ ] **Step 3: Verify — HUD is visible**

Run dev server. Expected:
- Top-left shows "CatchEm Town (mock)", creature count, event count
- Top-right shows last event (updates as mock events fire)
- Bottom shows keyboard controls hint

- [ ] **Step 4: Commit**

```bash
git add src/town/public/renderer.js src/town/public/town.js
git commit -m "feat(town): add HUD overlay with event log and controls hint"
```

---

### Task 11: Final Assembly — Complete town.js Integration

**Files:**
- Modify: `src/town/public/town.js`

Bring together all modules into the final game loop. Ensure proper initialization order, error handling, and clean code structure.

- [ ] **Step 1: Write the final town.js**

This consolidates all the wiring done incrementally. The final file should look like:

```javascript
// src/town/public/town.js
import { TILE_SIZE } from './utils.js';
import { MAP_WIDTH, MAP_HEIGHT, LOCATIONS, generateGroundLayer, generateWalkable } from './map-data.js';
import { Camera } from './camera.js';
import { Renderer } from './renderer.js';
import { CreatureManager } from './creature-manager.js';
import { MockEventSystem, RealEventSystem, eventToLocation } from './event-system.js';

// --- Canvas setup ---
const canvas = document.getElementById('town-canvas');
const ctx = canvas.getContext('2d');
const camera = new Camera();
const renderer = new Renderer(ctx, camera);
const creatureManager = new CreatureManager();
const ground = generateGroundLayer();
const walkable = generateWalkable(ground);

let showZones = false;
let lastTime = 0;
let eventCount = 0;
let lastEvent = null;
let lastEventTime = performance.now();
let idleDriftTimer = 0;
const useMock = new URLSearchParams(window.location.search).get('mock') !== 'false';

// --- Resize handler ---
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// --- Input handling ---
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.scroll(e.deltaX, e.deltaY, canvas.width, canvas.height);
}, { passive: false });

const keysDown = new Set();
window.addEventListener('keydown', (e) => {
  keysDown.add(e.key);
  if (e.key === 'z') showZones = !showZones;
});
window.addEventListener('keyup', (e) => keysDown.delete(e.key));

function handleKeyScroll() {
  const tss = camera.getTileScreenSize(canvas.width, canvas.height);
  const speed = tss * 0.15;
  if (keysDown.has('ArrowUp') || keysDown.has('w')) camera.scroll(0, -speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowDown') || keysDown.has('s')) camera.scroll(0, speed, canvas.width, canvas.height);
  if (keysDown.has('ArrowLeft') || keysDown.has('a')) camera.scroll(-speed, 0, canvas.width, canvas.height);
  if (keysDown.has('ArrowRight') || keysDown.has('d')) camera.scroll(speed, 0, canvas.width, canvas.height);
}

// --- Event handling ---
function handleEvent(event) {
  eventCount++;
  lastEvent = event;
  lastEventTime = performance.now();

  const locationId = eventToLocation(event);
  console.log(`[Town] Event #${eventCount}: ${event.type} → ${locationId}`, event);

  const moved = creatureManager.handleEvent(event, locationId);
  const loc = LOCATIONS.find(l => l.id === locationId);
  if (loc && moved && moved.length > 0) {
    camera.panToTile(loc.buildingTile.x, loc.buildingTile.y, canvas.width, canvas.height);
  }
}

// --- Game loop ---
function gameLoop(timestamp) {
  const dt = lastTime ? Math.min(timestamp - lastTime, 100) : 16; // cap dt at 100ms
  lastTime = timestamp;

  ctx.imageSmoothingEnabled = false;
  handleKeyScroll();
  camera.update(canvas.width, canvas.height);
  creatureManager.update(dt);

  // Idle drift
  idleDriftTimer += dt;
  if (performance.now() - lastEventTime > 60000 && idleDriftTimer > 15000) {
    creatureManager.idleDrift();
    idleDriftTimer = 0;
  }

  // Clear
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw layers
  renderer.drawGround(ground, canvas.width, canvas.height);
  renderer.drawBuildings(canvas.width, canvas.height);
  if (showZones) renderer.drawZones(canvas.width, canvas.height);

  const sorted = creatureManager.getSorted();
  renderer.drawCreatures(sorted, canvas.width, canvas.height);
  renderer.drawBubbles(sorted, canvas.width, canvas.height);
  renderer.drawHUD(canvas.width, canvas.height, {
    mock: useMock,
    creatureCount: creatureManager.creatures.length,
    eventCount,
    lastEvent,
  });

  requestAnimationFrame(gameLoop);
}

// --- Init ---
fetch('/api/creatures')
  .then(r => r.json())
  .then(defs => {
    if (useMock) {
      creatureManager.initMock(defs);
    } else {
      return fetch('/api/state')
        .then(r => r.json())
        .then(state => creatureManager.initReal(defs, state));
    }
  })
  .then(() => {
    console.log(`[Town] ${creatureManager.creatures.length} creatures loaded (${useMock ? 'mock' : 'real'} mode)`);

    const eventSystem = useMock
      ? new MockEventSystem(handleEvent)
      : new RealEventSystem(handleEvent);
    eventSystem.start();

    requestAnimationFrame(gameLoop);
  })
  .catch(err => {
    console.error('[Town] Init error:', err);
    // Start anyway with empty state
    requestAnimationFrame(gameLoop);
  });
```

- [ ] **Step 2: Verify — complete town running end to end**

Run: `node src/town/launch-town.mjs`
Open browser. Verify all of these work:
- [ ] Map renders with colored ground tiles, paths, stone town square
- [ ] 15 labeled building placeholders visible
- [ ] ~20 creatures (colored circles) placed on the map
- [ ] Creatures wander within their zones (walk, pause, walk)
- [ ] Speech bubbles appear above creatures and fade after a few seconds
- [ ] Mock events fire every few seconds (visible in console + HUD)
- [ ] Creatures move to relevant locations when events fire
- [ ] Camera auto-pans to follow event activity
- [ ] Manual scroll (mouse wheel + arrow keys) works
- [ ] 'z' toggles zone outlines
- [ ] HUD shows creature count, event count, last event
- [ ] No console errors

- [ ] **Step 3: Commit**

```bash
git add src/town/public/town.js
git commit -m "feat(town): complete Phase 1 standalone town with mock events"
```

---

## Summary

After completing all 11 tasks, you will have:

- **A working browser-based town** at `localhost:PORT` with placeholder art
- **15 location zones** on a 24x60 tile map with paths connecting them
- **~20 mock creatures** that walk between locations, change direction, and bounce while moving
- **Speech bubbles** with 648 dialogue lines (8 personalities x 15 locations x ~5 lines + idle)
- **Mock event system** that simulates a full coding session loop
- **Event-to-location mapping** covering all Claude Code tool types
- **Camera system** with smooth scroll, auto-pan to events, and keyboard controls
- **HUD** showing creature count, event log, and control hints

**What's NOT in this plan (later phases):**
- Phase 2: Real pixel art assets (PixelLab MCP generation)
- Phase 3: Personality field in creatures.json (currently defaults to 'chill')
- Phase 4: Real server, CLI command, hooks integration, event file
- Phase 5: Performance polish, cross-platform testing
