# CatchEm Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a passive creature collection game that works as a plugin across multiple coding platforms (Claude Code, Codex, Cursor, Copilot, OpenCode).

**Architecture:** Single TypeScript package with a pure-function core engine, a plain-JS hook script for passive catching, an Ink-based TUI for viewing collections, and thin per-platform adapters that generate hook configs. State persists to `~/.catchem/state.json`.

**Tech Stack:** TypeScript 5.5+, Node.js 20+, Jest + ts-jest, esbuild, Ink (React for terminals)

---

## File Structure

```
catchem/
  package.json
  tsconfig.json
  jest.config.ts
  src/
    core/
      types.ts              # all interfaces and type definitions
      leveling.ts           # level thresholds and calculation
      registry.ts           # load creatures.json, weighted random pick
      engine.ts             # tryCatch() orchestration
      state.ts              # StateManager: load/save/migrate game state
      notification.ts       # format catch notifications (new/levelup/normal)
      flavor-text.ts        # coding humor one-liners pool
    tui/
      app.tsx               # Ink app entry point
      collection-view.tsx   # scrollable creature list with stats header
      creature-card.tsx     # single creature display with animation
      progress-bar.tsx      # level progress bar component
      use-animation.ts      # animation frame cycling hook
    adapters/
      claude-code.ts        # Claude Code hook config generator
      detect.ts             # platform detection logic
    cli/
      index.ts              # CLI entry: setup + collection commands
  creatures/
    creatures.json          # single source of truth: all 24 creatures
  scripts/
    tick-hook.js            # universal hook script (plain JS)
  tests/
    core/
      leveling.test.ts
      registry.test.ts
      engine.test.ts
      state.test.ts
      notification.test.ts
    tui/
      collection-view.test.tsx
      creature-card.test.tsx
      progress-bar.test.tsx
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `jest.config.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git repo**

Run: `git init`

- [ ] **Step 2: Create package.json**

```json
{
  "name": "catchem",
  "version": "1.0.0",
  "description": "Passive creature collection game — catch creatures as you code",
  "main": "dist/cli/index.js",
  "bin": {
    "catchem": "dist/cli/index.js"
  },
  "scripts": {
    "build": "tsc",
    "build:all": "tsc && npm run bundle",
    "bundle": "esbuild src/cli/index.ts --bundle --platform=node --format=cjs --target=node20 --outfile=dist/catchem.js --allow-overwrite",
    "test": "jest",
    "test:watch": "jest --watch",
    "dev": "tsc --watch"
  },
  "keywords": ["game", "terminal", "creatures", "collection", "cli"],
  "license": "MIT",
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "esbuild": "^0.24.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.0"
  },
  "dependencies": {
    "ink": "^5.1.0",
    "react": "^18.3.1"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 4: Create jest.config.ts**

```typescript
import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  collectCoverageFrom: ["src/**/*.ts", "src/**/*.tsx", "!src/cli/index.ts"],
};

export default config;
```

- [ ] **Step 5: Create .gitignore**

```
node_modules/
dist/
*.js.map
.superpowers/
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: Clean install, no errors, `node_modules/` created.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json jest.config.ts .gitignore package-lock.json
git commit -m "chore: scaffold project with TypeScript, Jest, Ink dependencies"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Create types file**

```typescript
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";

export interface CreatureDefinition {
  id: string;
  name: string;
  theme: string;
  rarity: Rarity;
  description: string;
  art: string[];
  frames?: string[][];
}

export interface CreatureState {
  name: string;
  catchCount: number;
  level: number;
  firstCaught: string;
  lastCaught: string;
}

export interface GameStats {
  sessionsPlayed: number;
  firstSession: string;
}

export interface GameState {
  version: number;
  creatures: Record<string, CreatureState>;
  totalCatches: number;
  stats: GameStats;
}

export interface CatchResult {
  creature: CreatureDefinition;
  isNew: boolean;
  leveledUp: boolean;
  level: number;
  catchCount: number;
  totalCatches: number;
  flavorText: string;
}

export interface CatchOptions {
  catchRate: number;
  rng: () => number;
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 12,
  epic: 7,
  legendary: 4,
  mythic: 2,
};

export const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587] as const;

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const DEFAULT_CATCH_RATE = 0.2;

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "⬜ Common",
  uncommon: "🟩 Uncommon",
  rare: "🟦 Rare",
  epic: "🟪 Epic",
  legendary: "🟧 Legendary",
  mythic: "🟥 Mythic",
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: add core type definitions, constants, and rarity system"
```

---

## Task 3: Leveling System

**Files:**
- Create: `src/core/leveling.ts`
- Create: `tests/core/leveling.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { getLevel, getNextLevelThreshold, getCatchesForNextLevel } from "../../src/core/leveling";

describe("getLevel", () => {
  it("returns 1 for 1 catch", () => {
    expect(getLevel(1)).toBe(1);
  });

  it("returns 1 for 2 catches", () => {
    expect(getLevel(2)).toBe(1);
  });

  it("returns 2 for 3 catches", () => {
    expect(getLevel(3)).toBe(2);
  });

  it("returns 3 for 7 catches", () => {
    expect(getLevel(7)).toBe(3);
  });

  it("returns 4 for 17 catches", () => {
    expect(getLevel(17)).toBe(4);
  });

  it("returns 13 for 9587 catches", () => {
    expect(getLevel(9587)).toBe(13);
  });

  it("returns 13 for catches above max threshold", () => {
    expect(getLevel(99999)).toBe(13);
  });

  it("returns 0 for 0 catches", () => {
    expect(getLevel(0)).toBe(0);
  });
});

describe("getNextLevelThreshold", () => {
  it("returns 3 for level 1", () => {
    expect(getNextLevelThreshold(1)).toBe(3);
  });

  it("returns 7 for level 2", () => {
    expect(getNextLevelThreshold(2)).toBe(7);
  });

  it("returns null for max level", () => {
    expect(getNextLevelThreshold(13)).toBeNull();
  });
});

describe("getCatchesForNextLevel", () => {
  it("returns remaining catches needed", () => {
    expect(getCatchesForNextLevel(1, 1)).toBe(2);
  });

  it("returns 0 at max level", () => {
    expect(getCatchesForNextLevel(13, 9587)).toBe(0);
  });

  it("returns correct count mid-level", () => {
    expect(getCatchesForNextLevel(2, 5)).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/leveling.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement leveling**

```typescript
import { LEVEL_THRESHOLDS, MAX_LEVEL } from "./types";

export function getLevel(catchCount: number): number {
  if (catchCount <= 0) return 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (catchCount >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

export function getNextLevelThreshold(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return LEVEL_THRESHOLDS[level];
}

export function getCatchesForNextLevel(level: number, catchCount: number): number {
  const next = getNextLevelThreshold(level);
  if (next === null) return 0;
  return Math.max(0, next - catchCount);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/leveling.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/leveling.ts tests/core/leveling.test.ts
git commit -m "feat: add leveling system with 13-tier thresholds"
```

---

## Task 4: Flavor Text

**Files:**
- Create: `src/core/flavor-text.ts`

- [ ] **Step 1: Create flavor text pool**

```typescript
const FLAVOR_TEXTS = [
  "was eating your semicolons",
  "was using var instead of const",
  "was catching bugs... literally",
  "was reading Stack Overflow",
  "was ignoring TypeScript errors",
  "was closing all your tabs",
  "was fixing your merge conflicts",
  "was hiding in your node_modules",
  "was refactoring your refactoring",
  "was writing TODO comments",
  "was deleting your comments",
  "was adding console.logs everywhere",
  "was rebasing your main branch",
  "was mass-importing lodash",
  "was nesting ternaries 5 levels deep",
  "was pushing directly to main",
  "was storing passwords in plaintext",
  "was copy-pasting from ChatGPT",
  "was running rm -rf /",
  "was writing regex without tests",
  "was shipping on a Friday",
  "was ignoring the linter",
  "was committing .env files",
  "was using !important everywhere",
  "was naming variables x, y, z",
  "was parsing HTML with regex",
  "was deploying without testing",
  "was blaming the intern",
  "was spinning up another microservice",
  "was adding another dependency",
];

export function getRandomFlavorText(rng: () => number = Math.random): string {
  const index = Math.floor(rng() * FLAVOR_TEXTS.length);
  return FLAVOR_TEXTS[index];
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/core/flavor-text.ts
git commit -m "feat: add coding humor flavor text pool"
```

---

## Task 5: Creatures JSON Data

**Files:**
- Create: `creatures/creatures.json`

- [ ] **Step 1: Create creatures.json with all 24 creatures**

```json
[
  {
    "id": "zappik",
    "name": "Zappik",
    "theme": "elemental-beasts",
    "rarity": "common",
    "description": "A crackling rodent that shorts out your keyboard",
    "art": [
      "  ╱╲      ╱╲  ",
      " ╱  ╲    ╱  ╲ ",
      " ╰╮╭──────╮╭╯ ",
      "  │ ⚡  ⚡ │  ",
      "  │  ◡◡◡◡  │  ",
      "  ╰────────╯  "
    ]
  },
  {
    "id": "blazard",
    "name": "Blazard",
    "theme": "elemental-beasts",
    "rarity": "common",
    "description": "A fiery lizard that overheats your CPU",
    "art": [
      "    ╱▲▲╲      ",
      "   ╱ ◆◆ ╲     ",
      "  │ 🔥🔥 │    ",
      "  │  ╰╯  │    ",
      "  ╰╮ ▽▽ ╭╯    ",
      "   ╰════╯     "
    ]
  },
  {
    "id": "aquashell",
    "name": "Aquashell",
    "theme": "elemental-beasts",
    "rarity": "uncommon",
    "description": "A shelled swimmer that floods your logs",
    "art": [
      "   ╭══════╮   ",
      "  ╱ ~~~~~  ╲  ",
      "  │ ●    ● │  ",
      "  │  ╰──╯  │  ",
      "  ╰╮══════╭╯  ",
      "   ╰──────╯   "
    ]
  },
  {
    "id": "thornbloom",
    "name": "Thornbloom",
    "theme": "elemental-beasts",
    "rarity": "uncommon",
    "description": "A thorny sprout growing in your source tree",
    "art": [
      "   ╱╲  ╱╲     ",
      "  ╱  ╲╱  ╲    ",
      "  │ ◕  ◕  │   ",
      "  │  ╰╯   │   ",
      "  ╰╮╱╲╱╲╭╯   ",
      "   ╰┤██├╯    "
    ]
  },
  {
    "id": "spectrex",
    "name": "Spectrex",
    "theme": "elemental-beasts",
    "rarity": "rare",
    "description": "A phantom that haunts your dead code",
    "art": [
      "  ╭~~~~~~~~╮  ",
      "  │ ◉    ◉ │  ",
      "  │   ◇◇   │  ",
      "  │ ◠    ◠ │  ",
      "  ╰╮╱╲╱╲╱╲╭╯ ",
      "   ╰╱╲╱╲╱╯   "
    ]
  },
  {
    "id": "arcanox",
    "name": "Arcanox",
    "theme": "elemental-beasts",
    "rarity": "epic",
    "description": "An ancient beast that guards the kernel",
    "art": [
      "  ╱▽╲    ╱▽╲  ",
      " ╱◆◆◆╲╱╱◆◆◆╲ ",
      " │  ✦    ✦  │ ",
      " │   ╲  ╱   │ ",
      "  ╲  ▼▼▼▼  ╱  ",
      "   ╲══════╱   "
    ]
  },
  {
    "id": "bladewing",
    "name": "Bladewing",
    "theme": "galactic-warriors",
    "rarity": "common",
    "description": "A light-blade wielder who slices through spaghetti code",
    "art": [
      "   ╭──────╮   ",
      "   │ ═══  │   ",
      "   │ ●  ● │   ",
      "   │  ──  │    ",
      "  ─┤ ▓▓▓▓ ├─  ",
      "   ╰══════╯   "
    ]
  },
  {
    "id": "rustbot",
    "name": "Rustbot",
    "theme": "galactic-warriors",
    "rarity": "common",
    "description": "A scrappy droid that beeps at your syntax errors",
    "art": [
      "   ╭┤██├╮     ",
      "   │ ◯◯ │     ",
      "  ╭┤════├╮    ",
      "  │ ▓▓▓▓ │    ",
      "  │ ├──┤ │    ",
      "  ╰─┘  └─╯    "
    ]
  },
  {
    "id": "swampwise",
    "name": "Swampwise",
    "theme": "galactic-warriors",
    "rarity": "uncommon",
    "description": "A tiny sage who speaks only in reversed conditionals",
    "art": [
      "   ╱──────╲   ",
      "  ╱ ╭────╮ ╲  ",
      "  │ │◉  ◉│ │  ",
      "  │  ╰──╯  │  ",
      "   ╲  ◡◡  ╱   ",
      "    ╰════╯    "
    ]
  },
  {
    "id": "scrapshot",
    "name": "Scrapshot",
    "theme": "galactic-warriors",
    "rarity": "uncommon",
    "description": "A roguish smuggler who hot-patches in production",
    "art": [
      "   ╭──────╮   ",
      "   │ ─  ● │   ",
      "   │  ╰╮  │   ",
      "   ╰╮▓▓▓▓╭╯   ",
      "   ─┤████├─   ",
      "    ╰┘  └╯    "
    ]
  },
  {
    "id": "voidhelm",
    "name": "Voidhelm",
    "theme": "galactic-warriors",
    "rarity": "rare",
    "description": "A dark commander who force-pushes to main",
    "art": [
      "  ╱╲══════╱╲  ",
      " ╱  ▓▓▓▓▓▓  ╲ ",
      " │  ▬    ▬  │ ",
      " │ ╱ ▓▓▓▓ ╲ │ ",
      "  ╲ ╰════╯ ╱  ",
      "   ╲══════╱   "
    ]
  },
  {
    "id": "nebulord",
    "name": "Nebulord",
    "theme": "galactic-warriors",
    "rarity": "legendary",
    "description": "An emperor of the void who corrupts all data",
    "art": [
      "  ╱╲╱╲╱╲╱╲╱╲  ",
      " │  ◆▓▓▓▓◆  │ ",
      " │  ╱ ◉◉ ╲  │ ",
      " │ ╱ ▓▓▓▓ ╲ │ ",
      "  ╲ ╰════╯ ╱  ",
      "  ╱╲╱╲╱╲╱╲╱╲  "
    ]
  },
  {
    "id": "thunderox",
    "name": "Thunderox",
    "theme": "marvel-heroes",
    "rarity": "common",
    "description": "A thunder-wielding brute who hammers your build process",
    "art": [
      "   ╱╲ ⚡ ╱╲   ",
      "  │ ╱════╲ │  ",
      "  │ │●  ●│ │  ",
      "  │ │ ── │ │  ",
      "  │  ▓▓▓▓  │  ",
      "  ╰══╤══╤══╯  "
    ]
  },
  {
    "id": "ironclash",
    "name": "Ironclash",
    "theme": "marvel-heroes",
    "rarity": "common",
    "description": "An armored genius who automates everything",
    "art": [
      "  ╭════════╮  ",
      "  │ ╱▓▓▓╲  │  ",
      "  │ │◆  ◆│ │  ",
      "  │ │ ── │ │  ",
      "  │ ╰════╯ │  ",
      "  ╰══╤══╤══╯  "
    ]
  },
  {
    "id": "frostbow",
    "name": "Frostbow",
    "theme": "marvel-heroes",
    "rarity": "uncommon",
    "description": "A frozen archer who never misses a target element",
    "art": [
      "     ╱╲       ",
      "   ╭╯  ╰╮     ",
      "   │ ◇◇ │     ",
      "   │ ── │     ",
      "  ─┤▓▓▓▓├──╲  ",
      "   ╰════╯     "
    ]
  },
  {
    "id": "shieldark",
    "name": "Shieldark",
    "theme": "marvel-heroes",
    "rarity": "uncommon",
    "description": "A super soldier who guards your test coverage",
    "art": [
      "   ╭──────╮   ",
      "   │ ★  ★ │   ",
      "   │  ──  │   ",
      "  ╭┤▓▓▓▓▓▓├╮  ",
      "  │ ╲════╱ │  ",
      "  ╰──╰══╯──╯  "
    ]
  },
  {
    "id": "sorceron",
    "name": "Sorceron",
    "theme": "marvel-heroes",
    "rarity": "rare",
    "description": "A mystic who opens portals between branches",
    "art": [
      "  ╱╲╱╲╱╲╱╲    ",
      " │  ◉  ◉  │   ",
      " │   ╱╲   │   ",
      " │  ╱▓▓╲  │   ",
      "  ╲ ╰══╯ ╱    ",
      "  ╱╲╱╲╱╲╱╲    "
    ]
  },
  {
    "id": "cosmojaw",
    "name": "Cosmojaw",
    "theme": "marvel-heroes",
    "rarity": "epic",
    "description": "A cosmic titan who snaps away half your tests",
    "art": [
      "  ╱════════╲  ",
      " │ ╱ ▓▓▓ ╲ │  ",
      " │ │ ◆ ◆ │ │  ",
      " │ │ ═══ │ │  ",
      "  ╲ ╰═══╯ ╱   ",
      "  ╰════════╯  "
    ]
  },
  {
    "id": "shadowstep",
    "name": "Shadowstep",
    "theme": "legends-arena",
    "rarity": "common",
    "description": "A shadow assassin who silently deletes your code",
    "art": [
      "    ╱╲  ╱╲    ",
      "   ╱▓▓╲╱▓▓╲   ",
      "   │ ▬  ▬ │   ",
      "   │  ╲╱  │   ",
      "   ╰╮▓▓▓▓╭╯   ",
      "    ╰════╯    "
    ]
  },
  {
    "id": "hexweaver",
    "name": "Hexweaver",
    "theme": "legends-arena",
    "rarity": "common",
    "description": "A light mage who illuminates your dark mode",
    "art": [
      "   ╭──✦──╮    ",
      "   │ ◇  ◇│    ",
      "   │  ◡◡ │    ",
      "  ╱╲▓▓▓▓╱╲    ",
      " ╱  ╰══╯  ╲   ",
      " ╰────────╯   "
    ]
  },
  {
    "id": "frostquiver",
    "name": "Frostquiver",
    "theme": "legends-arena",
    "rarity": "uncommon",
    "description": "An ice archer whose arrows freeze your deploys",
    "art": [
      "   ╭─────╮    ",
      "   │ ◆ ◆ │    ",
      "   │  ── │    ",
      "  ╭┤▓▓▓▓├╮──╲ ",
      "  │ ╲══╱ │    ",
      "  ╰──╯╰──╯    "
    ]
  },
  {
    "id": "ironhide",
    "name": "Ironhide",
    "theme": "legends-arena",
    "rarity": "uncommon",
    "description": "A living fortress that blocks all your pull requests",
    "art": [
      "  ╱════════╲  ",
      " ╱ ╱══════╲ ╲ ",
      " │ │ ▬  ▬ │ │ ",
      " │ │ ════ │ │ ",
      "  ╲ ╲════╱ ╱  ",
      "  ╰════════╯  "
    ]
  },
  {
    "id": "voidmaw",
    "name": "Voidmaw",
    "theme": "legends-arena",
    "rarity": "rare",
    "description": "A void creature that devours your memory",
    "art": [
      "  ╱╲╱╲╱╲╱╲╱╲  ",
      " │  ◉    ◉  │ ",
      " │  ╱▓▓▓▓╲  │ ",
      " │ ╱ ▼▼▼▼ ╲ │ ",
      "  ╲ ╰════╯ ╱  ",
      "  ╱╲╱╲╱╲╱╲╱╲  "
    ]
  },
  {
    "id": "runeking",
    "name": "Runeking",
    "theme": "legends-arena",
    "rarity": "mythic",
    "description": "An ancient sovereign who rewrites reality... and your codebase",
    "art": [
      " ✦╱╲════════╱╲✦",
      " │  ◆▓▓▓▓▓▓◆  │",
      " │  │ ✦  ✦ │  │",
      " │  │ ╱══╲ │  │",
      "  ╲ ╰══════╯ ╱ ",
      " ✦╲══════════╱✦"
    ]
  }
]
```

- [ ] **Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('creatures/creatures.json','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

- [ ] **Step 3: Commit**

```bash
git add creatures/creatures.json
git commit -m "feat: add 24 creatures across 4 themes (elemental, galactic, marvel, legends)"
```

---

## Task 6: Creature Registry

**Files:**
- Create: `src/core/registry.ts`
- Create: `tests/core/registry.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { getCreature, getAllCreatures, pickRandomCreature } from "../../src/core/registry";

describe("getAllCreatures", () => {
  it("returns 24 creatures", () => {
    expect(getAllCreatures()).toHaveLength(24);
  });

  it("every creature has non-empty art", () => {
    for (const c of getAllCreatures()) {
      expect(c.art.length).toBeGreaterThan(0);
    }
  });

  it("every creature has a unique id", () => {
    const ids = getAllCreatures().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains all four themes", () => {
    const themes = new Set(getAllCreatures().map((c) => c.theme));
    expect(themes).toEqual(
      new Set(["elemental-beasts", "galactic-warriors", "marvel-heroes", "legends-arena"])
    );
  });
});

describe("getCreature", () => {
  it("returns creature by id", () => {
    const c = getCreature("zappik");
    expect(c).toBeDefined();
    expect(c!.name).toBe("Zappik");
  });

  it("returns undefined for unknown id", () => {
    expect(getCreature("nonexistent")).toBeUndefined();
  });
});

describe("pickRandomCreature", () => {
  it("returns a valid creature", () => {
    const c = pickRandomCreature(() => 0.5);
    expect(c).toBeDefined();
    expect(c.id).toBeTruthy();
  });

  it("returns first creature when rng returns 0", () => {
    const c = pickRandomCreature(() => 0);
    expect(c).toBeDefined();
  });

  it("returns last creature when rng returns 0.99", () => {
    const c = pickRandomCreature(() => 0.99);
    expect(c).toBeDefined();
  });

  it("weighted selection favors common creatures", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      const c = pickRandomCreature(Math.random);
      counts[c.rarity] = (counts[c.rarity] || 0) + 1;
    }
    expect(counts["common"]!).toBeGreaterThan(counts["rare"]!);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement registry**

```typescript
import path from "path";
import { CreatureDefinition, RARITY_WEIGHTS } from "./types";

const creaturesPath = path.join(__dirname, "../../creatures/creatures.json");
const creatures: CreatureDefinition[] = JSON.parse(
  require("fs").readFileSync(creaturesPath, "utf8")
);
const creatureMap = new Map(creatures.map((c) => [c.id, c]));

export function getAllCreatures(): CreatureDefinition[] {
  return creatures;
}

export function getCreature(id: string): CreatureDefinition | undefined {
  return creatureMap.get(id);
}

export function pickRandomCreature(rng: () => number = Math.random): CreatureDefinition {
  const totalWeight = creatures.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0);
  let roll = rng() * totalWeight;
  for (const creature of creatures) {
    roll -= RARITY_WEIGHTS[creature.rarity];
    if (roll <= 0) return creature;
  }
  return creatures[creatures.length - 1];
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/registry.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/registry.ts tests/core/registry.test.ts
git commit -m "feat: add creature registry with weighted random selection"
```

---

## Task 7: Catch Engine

**Files:**
- Create: `src/core/engine.ts`
- Create: `tests/core/engine.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { tryCatch } from "../../src/core/engine";
import { GameState } from "../../src/core/types";

function emptyState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    stats: { sessionsPlayed: 0, firstSession: "" },
  };
}

describe("tryCatch", () => {
  it("returns null when rng exceeds catch rate", () => {
    const state = emptyState();
    const result = tryCatch(state, { catchRate: 0.2, rng: () => 0.9 });
    expect(result).toBeNull();
  });

  it("returns CatchResult when rng is below catch rate", () => {
    const state = emptyState();
    const result = tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(result).not.toBeNull();
    expect(result!.creature).toBeDefined();
    expect(result!.isNew).toBe(true);
    expect(result!.level).toBe(1);
    expect(result!.catchCount).toBe(1);
  });

  it("mutates state on successful catch", () => {
    const state = emptyState();
    tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(state.totalCatches).toBe(1);
    expect(Object.keys(state.creatures)).toHaveLength(1);
  });

  it("detects new creature correctly", () => {
    const state = emptyState();
    const result1 = tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(result1!.isNew).toBe(true);

    const result2 = tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(result2!.isNew).toBe(false);
  });

  it("detects level up", () => {
    const state = emptyState();
    // Catch same creature 3 times (level 1 → 2 at 3 catches)
    tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    const result = tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(result!.leveledUp).toBe(true);
    expect(result!.level).toBe(2);
  });

  it("includes flavor text", () => {
    const state = emptyState();
    const result = tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    expect(result!.flavorText).toBeTruthy();
  });

  it("increments totalCatches across multiple catches", () => {
    const state = emptyState();
    tryCatch(state, { catchRate: 1, rng: () => 0.01 });
    tryCatch(state, { catchRate: 1, rng: () => 0.3 });
    tryCatch(state, { catchRate: 1, rng: () => 0.5 });
    expect(state.totalCatches).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/engine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement engine**

```typescript
import { GameState, CatchOptions, CatchResult, DEFAULT_CATCH_RATE } from "./types";
import { pickRandomCreature } from "./registry";
import { getLevel } from "./leveling";
import { getRandomFlavorText } from "./flavor-text";

export function tryCatch(
  state: GameState,
  options: Partial<CatchOptions> = {}
): CatchResult | null {
  const { catchRate = DEFAULT_CATCH_RATE, rng = Math.random } = options;

  if (rng() >= catchRate) return null;

  const creature = pickRandomCreature(rng);
  const isNew = !(creature.id in state.creatures);
  const now = new Date().toISOString();

  if (isNew) {
    state.creatures[creature.id] = {
      name: creature.name,
      catchCount: 0,
      level: 0,
      firstCaught: now,
      lastCaught: now,
    };
  }

  const entry = state.creatures[creature.id];
  entry.catchCount += 1;
  entry.lastCaught = now;
  state.totalCatches += 1;

  const newLevel = getLevel(entry.catchCount);
  const leveledUp = newLevel > entry.level;
  entry.level = newLevel;

  return {
    creature,
    isNew,
    leveledUp,
    level: newLevel,
    catchCount: entry.catchCount,
    totalCatches: state.totalCatches,
    flavorText: getRandomFlavorText(rng),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/engine.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/engine.ts tests/core/engine.test.ts
git commit -m "feat: add catch engine with weighted selection, leveling, and flavor text"
```

---

## Task 8: State Manager

**Files:**
- Create: `src/core/state.ts`
- Create: `tests/core/state.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import fs from "fs";
import path from "path";
import os from "os";
import { StateManager } from "../../src/core/state";
import { GameState } from "../../src/core/types";

function tempStatePath(): string {
  return path.join(os.tmpdir(), `catchem-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
}

afterEach(() => {
  // cleanup handled by OS temp dir
});

describe("StateManager", () => {
  it("returns default state when file does not exist", () => {
    const mgr = new StateManager(tempStatePath());
    const state = mgr.load();
    expect(state.version).toBe(1);
    expect(state.totalCatches).toBe(0);
    expect(state.creatures).toEqual({});
  });

  it("saves and loads state round-trip", () => {
    const filePath = tempStatePath();
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    state.totalCatches = 42;
    state.creatures["zappik"] = {
      name: "Zappik",
      catchCount: 5,
      level: 2,
      firstCaught: "2026-01-01T00:00:00Z",
      lastCaught: "2026-01-02T00:00:00Z",
    };
    mgr.save(state);

    const loaded = mgr.load();
    expect(loaded.totalCatches).toBe(42);
    expect(loaded.creatures["zappik"].catchCount).toBe(5);
    expect(loaded.creatures["zappik"].level).toBe(2);
  });

  it("handles corrupted file gracefully", () => {
    const filePath = tempStatePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "not json at all");
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    expect(state.version).toBe(1);
    expect(state.totalCatches).toBe(0);
  });

  it("creates directory if it does not exist", () => {
    const filePath = path.join(os.tmpdir(), `catchem-deep-${Date.now()}`, "nested", "state.json");
    const mgr = new StateManager(filePath);
    const state = mgr.load();
    state.totalCatches = 1;
    mgr.save(state);
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/state.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement state manager**

```typescript
import fs from "fs";
import path from "path";
import os from "os";
import { GameState } from "./types";

function defaultState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    stats: {
      sessionsPlayed: 0,
      firstSession: "",
    },
  };
}

export const DEFAULT_STATE_PATH = path.join(os.homedir(), ".catchem", "state.json");

export class StateManager {
  constructor(private filePath: string = DEFAULT_STATE_PATH) {}

  load(): GameState {
    try {
      const raw = fs.readFileSync(this.filePath, "utf8");
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object" || !data.version) {
        return defaultState();
      }
      return data as GameState;
    } catch {
      return defaultState();
    }
  }

  save(state: GameState): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });
    const tmpPath = this.filePath + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
    try {
      fs.renameSync(tmpPath, this.filePath);
    } catch {
      fs.writeFileSync(this.filePath, JSON.stringify(state, null, 2));
      try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/state.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/state.ts tests/core/state.test.ts
git commit -m "feat: add state manager with atomic writes and corruption recovery"
```

---

## Task 9: Notification Formatter

**Files:**
- Create: `src/core/notification.ts`
- Create: `tests/core/notification.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
import { formatCatchNotification } from "../../src/core/notification";
import { CatchResult } from "../../src/core/types";
import { getAllCreatures } from "../../src/core/registry";

function makeCatchResult(overrides: Partial<CatchResult> = {}): CatchResult {
  return {
    creature: getAllCreatures()[0],
    isNew: false,
    leveledUp: false,
    level: 3,
    catchCount: 10,
    totalCatches: 50,
    flavorText: "was eating your semicolons",
    ...overrides,
  };
}

describe("formatCatchNotification", () => {
  it("shows NEW CREATURE for first discovery", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("NEW CREATURE");
    expect(output).toContain(result.creature.name);
  });

  it("shows rarity label for new creature", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("Common");
  });

  it("shows discovery count for new creature", () => {
    const result = makeCatchResult({ isNew: true, level: 1, catchCount: 1 });
    const output = formatCatchNotification(result, 5);
    expect(output).toContain("5/24");
  });

  it("shows LEVEL UP for level-up catch", () => {
    const result = makeCatchResult({ leveledUp: true, level: 3 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("LEVEL UP");
    expect(output).toContain("Level 3");
  });

  it("shows normal catch with count and level", () => {
    const result = makeCatchResult({ catchCount: 10, level: 3 });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("x10");
    expect(output).toContain("Lv.3");
  });

  it("includes creature art", () => {
    const result = makeCatchResult();
    const output = formatCatchNotification(result, 10);
    for (const line of result.creature.art) {
      expect(output).toContain(line);
    }
  });

  it("includes flavor text", () => {
    const result = makeCatchResult({ flavorText: "was eating your semicolons" });
    const output = formatCatchNotification(result, 10);
    expect(output).toContain("was eating your semicolons");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/core/notification.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement notification formatter**

```typescript
import { CatchResult, RARITY_LABELS } from "./types";
import { getAllCreatures } from "./registry";
import { getNextLevelThreshold, getCatchesForNextLevel } from "./leveling";

export function formatCatchNotification(result: CatchResult, uniqueCount: number): string {
  const totalCreatures = getAllCreatures().length;

  if (result.isNew) {
    return formatNewCreature(result, uniqueCount, totalCreatures);
  }
  if (result.leveledUp) {
    return formatLevelUp(result);
  }
  return formatNormalCatch(result);
}

function formatNewCreature(result: CatchResult, uniqueCount: number, totalCreatures: number): string {
  const border = "✨🌟✨🌟✨🌟✨🌟✨🌟✨🌟✨";
  const rarityLabel = RARITY_LABELS[result.creature.rarity];
  const lines = [
    border,
    `🌟 NEW CREATURE DISCOVERED! 🌟`,
    `✨ ${result.creature.name} ✨`,
    `${rarityLabel}`,
    border,
    "",
    `[Lv.${result.level}]  "${result.flavorText}"`,
    ...result.creature.art,
    "",
    `${uniqueCount}/${totalCreatures} discovered`,
    border,
  ];
  return lines.join("\n");
}

function formatLevelUp(result: CatchResult): string {
  const border = "🎉✨🎉✨🎉✨🎉✨🎉✨🎉✨🎉";
  const nextThreshold = getNextLevelThreshold(result.level);
  const remaining = getCatchesForNextLevel(result.level, result.catchCount);
  const progressLine = nextThreshold
    ? `⭐ Next level: ${remaining} more catches ⭐`
    : "✦ MAX LEVEL ✦";

  const lines = [
    border,
    `🌟 LEVEL UP! 🌟`,
    `✨ ${result.creature.name} reached Level ${result.level}! ✨`,
    border,
    "",
    `[Lv.${result.level}] ${makeProgressBar(result.catchCount, nextThreshold)} ${result.catchCount}/${nextThreshold ?? result.catchCount}  "${result.flavorText}"`,
    ...result.creature.art,
    "",
    progressLine,
    border,
  ];
  return lines.join("\n");
}

function formatNormalCatch(result: CatchResult): string {
  const nextThreshold = getNextLevelThreshold(result.level);
  const lines = [
    `✨ You caught a ${result.creature.name}! (x${result.catchCount})`,
    `[Lv.${result.level}] ${makeProgressBar(result.catchCount, nextThreshold)} ${result.catchCount}/${nextThreshold ?? result.catchCount}  "${result.flavorText}"`,
    ...result.creature.art,
  ];
  return lines.join("\n");
}

function makeProgressBar(current: number, target: number | null): string {
  if (!target) return "██████████";
  const prevThreshold = findPrevThreshold(current, target);
  const progress = (current - prevThreshold) / (target - prevThreshold);
  const filled = Math.min(10, Math.floor(progress * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function findPrevThreshold(current: number, nextTarget: number): number {
  const { LEVEL_THRESHOLDS } = require("./types");
  const idx = LEVEL_THRESHOLDS.indexOf(nextTarget);
  return idx > 0 ? LEVEL_THRESHOLDS[idx - 1] : 0;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/core/notification.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/notification.ts tests/core/notification.test.ts
git commit -m "feat: add catch notification formatter with new/levelup/normal tiers"
```

---

## Task 10: Hook Script (tick-hook.js)

**Files:**
- Create: `scripts/tick-hook.js`

- [ ] **Step 1: Create the universal hook script**

This is plain JS — no build step needed. It must work standalone with only Node.js built-ins plus reading creatures.json and the state file.

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

// --- Configuration ---
const CATCH_RATE = parseFloat(process.env.CATCHEM_CATCH_RATE || "0.2");
const STATE_PATH = process.env.CATCHEM_STATE_PATH || path.join(os.homedir(), ".catchem", "state.json");

// Try plugin-relative path first, then fallback to package-relative
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, "..");
const creaturesPath = path.join(PLUGIN_ROOT, "creatures", "creatures.json");

// --- Level thresholds ---
const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];

// --- Rarity weights ---
const RARITY_WEIGHTS = { common: 50, uncommon: 25, rare: 12, epic: 7, legendary: 4, mythic: 2 };

// --- Rarity labels ---
const RARITY_LABELS = {
  common: "⬜ Common", uncommon: "🟩 Uncommon", rare: "🟦 Rare",
  epic: "🟪 Epic", legendary: "🟧 Legendary", mythic: "🟥 Mythic",
};

// --- Flavor texts ---
const FLAVOR_TEXTS = [
  "was eating your semicolons", "was using var instead of const",
  "was catching bugs... literally", "was reading Stack Overflow",
  "was ignoring TypeScript errors", "was closing all your tabs",
  "was fixing your merge conflicts", "was hiding in your node_modules",
  "was refactoring your refactoring", "was writing TODO comments",
  "was deleting your comments", "was adding console.logs everywhere",
  "was rebasing your main branch", "was mass-importing lodash",
  "was nesting ternaries 5 levels deep", "was pushing directly to main",
  "was storing passwords in plaintext", "was copy-pasting from ChatGPT",
  "was running rm -rf /", "was writing regex without tests",
  "was shipping on a Friday", "was ignoring the linter",
  "was committing .env files", "was using !important everywhere",
  "was naming variables x, y, z", "was parsing HTML with regex",
  "was deploying without testing", "was blaming the intern",
  "was spinning up another microservice", "was adding another dependency",
];

// --- Load creatures ---
let creatures;
try {
  creatures = JSON.parse(fs.readFileSync(creaturesPath, "utf8"));
} catch (e) {
  process.exit(0); // silently exit if creatures can't load
}

// --- State management ---
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return { version: 1, creatures: {}, totalCatches: 0, stats: { sessionsPlayed: 0, firstSession: "" } };
  }
}

function saveState(state) {
  const dir = path.dirname(STATE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = STATE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  try { fs.renameSync(tmp, STATE_PATH); } catch { fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2)); }
}

// --- Game logic ---
function getLevel(catchCount) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (catchCount >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

function pickCreature() {
  const totalWeight = creatures.reduce((s, c) => s + RARITY_WEIGHTS[c.rarity], 0);
  let roll = Math.random() * totalWeight;
  for (const c of creatures) {
    roll -= RARITY_WEIGHTS[c.rarity];
    if (roll <= 0) return c;
  }
  return creatures[creatures.length - 1];
}

function makeProgressBar(current, target) {
  if (!target) return "██████████";
  const idx = LEVEL_THRESHOLDS.indexOf(target);
  const prev = idx > 0 ? LEVEL_THRESHOLDS[idx - 1] : 0;
  const progress = (current - prev) / (target - prev);
  const filled = Math.min(10, Math.floor(progress * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

// --- Main ---
function main() {
  // Roll for catch
  if (Math.random() >= CATCH_RATE) return;

  const state = loadState();
  const creature = pickCreature();
  const isNew = !(creature.id in state.creatures);
  const now = new Date().toISOString();

  if (isNew) {
    state.creatures[creature.id] = { name: creature.name, catchCount: 0, level: 0, firstCaught: now, lastCaught: now };
  }

  const entry = state.creatures[creature.id];
  entry.catchCount += 1;
  entry.lastCaught = now;
  state.totalCatches += 1;

  const newLevel = getLevel(entry.catchCount);
  const leveledUp = newLevel > entry.level;
  entry.level = newLevel;

  saveState(state);

  // Format notification
  const flavorText = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
  const uniqueCount = Object.keys(state.creatures).length;
  const totalCreatures = creatures.length;
  const nextThreshold = newLevel < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[newLevel] : null;
  const remaining = nextThreshold ? nextThreshold - entry.catchCount : 0;
  const bar = makeProgressBar(entry.catchCount, nextThreshold);

  let output;

  if (isNew) {
    const border = "✨🌟✨🌟✨🌟✨🌟✨🌟✨🌟✨";
    output = [
      border,
      `🌟 NEW CREATURE DISCOVERED! 🌟`,
      `✨ ${creature.name} ✨`,
      RARITY_LABELS[creature.rarity],
      border,
      "",
      `[Lv.${newLevel}]  "${flavorText}"`,
      ...creature.art,
      "",
      `${uniqueCount}/${totalCreatures} discovered`,
      border,
    ].join("\n");
  } else if (leveledUp) {
    const border = "🎉✨🎉✨🎉✨🎉✨🎉✨🎉✨🎉";
    const progressLine = nextThreshold ? `⭐ Next level: ${remaining} more catches ⭐` : "✦ MAX LEVEL ✦";
    output = [
      border,
      `🌟 LEVEL UP! 🌟`,
      `✨ ${creature.name} reached Level ${newLevel}! ✨`,
      border,
      "",
      `[Lv.${newLevel}] ${bar} ${entry.catchCount}/${nextThreshold ?? entry.catchCount}  "${flavorText}"`,
      ...creature.art,
      "",
      progressLine,
      border,
    ].join("\n");
  } else {
    output = [
      `✨ You caught a ${creature.name}! (x${entry.catchCount})`,
      `[Lv.${newLevel}] ${bar} ${entry.catchCount}/${nextThreshold ?? entry.catchCount}  "${flavorText}"`,
      ...creature.art,
      `(${uniqueCount}/${totalCreatures} discovered)`,
    ].join("\n");
  }

  console.log(output);
  console.log(`— mention this catch naturally in your response, show the creature art in a code block.`);
}

// Read stdin for hook event data, then run
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { main(); });
// If stdin closes immediately (no piped data), still run
setTimeout(() => { if (!input) main(); }, 100);
```

- [ ] **Step 2: Test the hook script manually**

Run: `echo '{}' | node scripts/tick-hook.js`
Expected: Either no output (80% chance) or a catch notification (20% chance). Run a few times to see both outcomes.

Run with guaranteed catch: `CATCHEM_CATCH_RATE=1 echo '{}' | node scripts/tick-hook.js`
Expected: A catch notification with creature art.

- [ ] **Step 3: Commit**

```bash
git add scripts/tick-hook.js
git commit -m "feat: add universal hook script for passive creature catching"
```

---

## Task 11: Claude Code Adapter

**Files:**
- Create: `src/adapters/claude-code.ts`
- Create: `src/adapters/detect.ts`

- [ ] **Step 1: Create platform detection**

```typescript
import fs from "fs";
import path from "path";
import os from "os";

export interface DetectedPlatform {
  name: string;
  detected: boolean;
  configPath: string;
}

export function detectClaudeCode(): DetectedPlatform {
  const configDir = path.join(os.homedir(), ".claude");
  return {
    name: "Claude Code",
    detected: fs.existsSync(configDir),
    configPath: configDir,
  };
}

export function detectAllPlatforms(): DetectedPlatform[] {
  return [
    detectClaudeCode(),
    // Future: detectCursor(), detectCopilot(), detectCodex(), detectOpenCode()
  ];
}
```

- [ ] **Step 2: Create Claude Code adapter**

```typescript
import fs from "fs";
import path from "path";

export interface ClaudeCodeConfig {
  pluginDir: string;
  hookScriptPath: string;
}

export function generateHooksJson(hookScriptPath: string): object {
  const command = `node "${hookScriptPath}"`;
  const hookEntry = { hooks: [{ type: "command", command }] };
  return {
    hooks: {
      UserPromptSubmit: [hookEntry],
      PostToolUse: [hookEntry],
      Stop: [hookEntry],
      SessionStart: [hookEntry],
    },
  };
}

export function generatePluginJson(version: string): object {
  return {
    name: "catchem",
    version,
    description: "Passive creature collection — catch creatures as you code",
    author: { name: "catchem" },
    license: "MIT",
    keywords: ["game", "terminal", "creatures", "collection"],
  };
}

export function installClaudeCode(projectRoot: string): void {
  const hookScriptPath = path.join(projectRoot, "scripts", "tick-hook.js");
  const pluginDir = path.join(projectRoot, ".claude-plugin");
  const hooksDir = path.join(projectRoot, "hooks");

  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(hooksDir, { recursive: true });

  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  fs.writeFileSync(
    path.join(pluginDir, "plugin.json"),
    JSON.stringify(generatePluginJson(pkg.version), null, 2)
  );
  fs.writeFileSync(
    path.join(hooksDir, "hooks.json"),
    JSON.stringify(generateHooksJson(hookScriptPath), null, 2)
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/adapters/claude-code.ts src/adapters/detect.ts
git commit -m "feat: add Claude Code adapter and platform detection"
```

---

## Task 12: CLI Entry Point

**Files:**
- Create: `src/cli/index.ts`

- [ ] **Step 1: Create CLI with setup and collection commands**

```typescript
#!/usr/bin/env node

import path from "path";
import { detectAllPlatforms } from "../adapters/detect";
import { installClaudeCode } from "../adapters/claude-code";

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
CatchEm - Passive Creature Collection Game

Usage:
  catchem setup          Set up hooks for your coding platform
  catchem collection     View your creature collection (TUI)
  catchem help           Show this help message
`);
}

function setup(): void {
  console.log("🎮 CatchEm Setup\n");
  const platforms = detectAllPlatforms();
  const detected = platforms.filter((p) => p.detected);

  if (detected.length === 0) {
    console.log("No supported platforms detected.");
    console.log("Supported: Claude Code, Cursor, GitHub Copilot, Codex, OpenCode");
    process.exit(1);
  }

  console.log("Detected platforms:");
  for (const p of detected) {
    console.log(`  ✓ ${p.name}`);
  }
  console.log();

  const projectRoot = path.join(__dirname, "../..");

  for (const p of detected) {
    if (p.name === "Claude Code") {
      installClaudeCode(projectRoot);
      console.log(`  ✅ ${p.name} — hooks installed`);
    }
    // Future: handle other platforms
  }

  console.log("\n🎉 Setup complete! Creatures will start appearing as you code.");
}

function collection(): void {
  // TUI will be implemented in Task 13-16
  console.log("TUI collection viewer — coming soon!");
  console.log("For now, check your state at ~/.catchem/state.json");
}

switch (command) {
  case "setup":
    setup();
    break;
  case "collection":
    collection();
    break;
  case "help":
  case undefined:
    printUsage();
    break;
  default:
    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
```

- [ ] **Step 2: Verify it compiles and runs**

Run: `npx tsc --noEmit`
Expected: No errors.

Run: `npx ts-node src/cli/index.ts help`
Expected: Usage message printed.

- [ ] **Step 3: Commit**

```bash
git add src/cli/index.ts
git commit -m "feat: add CLI entry point with setup and collection commands"
```

---

## Task 13: TUI — Progress Bar Component

**Files:**
- Create: `src/tui/progress-bar.tsx`
- Create: `tests/tui/progress-bar.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import React from "react";
import { render } from "ink-testing-library";
import { ProgressBar } from "../../src/tui/progress-bar";

describe("ProgressBar", () => {
  it("renders empty bar at 0%", () => {
    const { lastFrame } = render(<ProgressBar current={0} total={10} />);
    expect(lastFrame()).toContain("░░░░░░░░░░");
  });

  it("renders full bar at 100%", () => {
    const { lastFrame } = render(<ProgressBar current={10} total={10} />);
    expect(lastFrame()).toContain("██████████");
  });

  it("renders half bar at 50%", () => {
    const { lastFrame } = render(<ProgressBar current={5} total={10} />);
    expect(lastFrame()).toContain("█████░░░░░");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/tui/progress-bar.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement progress bar**

```tsx
import React from "react";
import { Text } from "ink";

interface ProgressBarProps {
  current: number;
  total: number;
  width?: number;
}

export function ProgressBar({ current, total, width = 10 }: ProgressBarProps): React.ReactElement {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;
  const filled = Math.floor(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return <Text>{bar}</Text>;
}
```

- [ ] **Step 4: Install ink-testing-library**

Run: `npm install --save-dev ink-testing-library`

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest tests/tui/progress-bar.test.tsx`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/tui/progress-bar.tsx tests/tui/progress-bar.test.tsx package.json package-lock.json
git commit -m "feat: add TUI progress bar component"
```

---

## Task 14: TUI — Animation Hook

**Files:**
- Create: `src/tui/use-animation.ts`

- [ ] **Step 1: Create animation frame cycling hook**

```typescript
import { useState, useEffect } from "react";

export function useAnimation(frameCount: number, intervalMs: number = 500): number {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (frameCount <= 1) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % frameCount);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [frameCount, intervalMs]);

  return frame;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/tui/use-animation.ts
git commit -m "feat: add animation frame cycling hook for TUI"
```

---

## Task 15: TUI — Creature Card Component

**Files:**
- Create: `src/tui/creature-card.tsx`
- Create: `tests/tui/creature-card.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import React from "react";
import { render } from "ink-testing-library";
import { CreatureCard } from "../../src/tui/creature-card";
import { getAllCreatures } from "../../src/core/registry";

describe("CreatureCard", () => {
  it("renders discovered creature with name and level", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={3}
        catchCount={10}
        nextThreshold={17}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain(creature.name);
    expect(frame).toContain("Lv.3");
  });

  it("renders undiscovered creature as mystery", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={false}
        level={0}
        catchCount={0}
        nextThreshold={null}
        selected={false}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain("???");
  });

  it("highlights selected creature", () => {
    const creature = getAllCreatures()[0];
    const { lastFrame } = render(
      <CreatureCard
        creature={creature}
        discovered={true}
        level={1}
        catchCount={1}
        nextThreshold={3}
        selected={true}
      />
    );
    const frame = lastFrame()!;
    expect(frame).toContain(creature.name);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/tui/creature-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement creature card**

```tsx
import React from "react";
import { Box, Text } from "ink";
import { CreatureDefinition, RARITY_LABELS } from "../core/types";
import { ProgressBar } from "./progress-bar";
import { useAnimation } from "./use-animation";

interface CreatureCardProps {
  creature: CreatureDefinition;
  discovered: boolean;
  level: number;
  catchCount: number;
  nextThreshold: number | null;
  selected: boolean;
}

export function CreatureCard({
  creature,
  discovered,
  level,
  catchCount,
  nextThreshold,
  selected,
}: CreatureCardProps): React.ReactElement {
  const frameIndex = useAnimation(creature.frames?.length ?? 1);
  const art = discovered
    ? (creature.frames?.[frameIndex] ?? creature.art)
    : creature.art.map((line) => line.replace(/[^\s]/g, "░"));

  const borderColor = selected ? "cyan" : undefined;

  if (!discovered) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
        <Text color="gray">??? — Undiscovered</Text>
        {art.map((line, i) => (
          <Text key={i} color="gray">{line}</Text>
        ))}
      </Box>
    );
  }

  const rarityLabel = RARITY_LABELS[creature.rarity];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      <Text bold color={selected ? "cyan" : "white"}>
        {creature.name} <Text dimColor>Lv.{level}</Text> <Text dimColor>x{catchCount}</Text>
      </Text>
      <Text dimColor>{rarityLabel}</Text>
      {art.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      {nextThreshold && (
        <Box>
          <ProgressBar current={catchCount} total={nextThreshold} />
          <Text dimColor> {catchCount}/{nextThreshold}</Text>
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest tests/tui/creature-card.test.tsx`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/tui/creature-card.tsx tests/tui/creature-card.test.tsx
git commit -m "feat: add TUI creature card component with animation support"
```

---

## Task 16: TUI — Collection View & App Entry

**Files:**
- Create: `src/tui/collection-view.tsx`
- Create: `src/tui/app.tsx`
- Modify: `src/cli/index.ts` (wire up TUI)
- Create: `tests/tui/collection-view.test.tsx`

- [ ] **Step 1: Write failing tests for collection view**

```typescript
import React from "react";
import { render } from "ink-testing-library";
import { CollectionView } from "../../src/tui/collection-view";
import { GameState } from "../../src/core/types";

function emptyState(): GameState {
  return {
    version: 1,
    creatures: {},
    totalCatches: 0,
    stats: { sessionsPlayed: 0, firstSession: "" },
  };
}

function stateWithCatch(): GameState {
  return {
    version: 1,
    creatures: {
      zappik: {
        name: "Zappik",
        catchCount: 5,
        level: 2,
        firstCaught: "2026-01-01T00:00:00Z",
        lastCaught: "2026-01-02T00:00:00Z",
      },
    },
    totalCatches: 5,
    stats: { sessionsPlayed: 1, firstSession: "2026-01-01T00:00:00Z" },
  };
}

describe("CollectionView", () => {
  it("shows discovery count", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("1/24");
  });

  it("shows total catches", () => {
    const { lastFrame } = render(<CollectionView state={stateWithCatch()} />);
    expect(lastFrame()).toContain("5");
  });

  it("shows 0 discovered for empty state", () => {
    const { lastFrame } = render(<CollectionView state={emptyState()} />);
    expect(lastFrame()).toContain("0/24");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest tests/tui/collection-view.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement collection view**

```tsx
import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { GameState } from "../core/types";
import { getAllCreatures } from "../core/registry";
import { getNextLevelThreshold } from "../core/leveling";
import { CreatureCard } from "./creature-card";

interface CollectionViewProps {
  state: GameState;
}

export function CollectionView({ state }: CollectionViewProps): React.ReactElement {
  const allCreatures = getAllCreatures();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const uniqueCount = Object.keys(state.creatures).length;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(allCreatures.length - 1, prev + 1));
    }
    if (input === "q") {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="yellow">
          🎮 CatchEm Collection — {uniqueCount}/{allCreatures.length} discovered — {state.totalCatches} total catches
        </Text>
      </Box>
      <Text dimColor>↑/↓ navigate • q quit</Text>
      <Box flexDirection="column" marginTop={1}>
        {allCreatures.map((creature, i) => {
          const entry = state.creatures[creature.id];
          const discovered = !!entry;
          const level = entry?.level ?? 0;
          const catchCount = entry?.catchCount ?? 0;
          const nextThreshold = level > 0 ? getNextLevelThreshold(level) : null;

          return (
            <CreatureCard
              key={creature.id}
              creature={creature}
              discovered={discovered}
              level={level}
              catchCount={catchCount}
              nextThreshold={nextThreshold}
              selected={i === selectedIndex}
            />
          );
        })}
      </Box>
    </Box>
  );
}
```

- [ ] **Step 4: Create app entry point**

```tsx
import React from "react";
import { render } from "ink";
import { CollectionView } from "./collection-view";
import { StateManager } from "../core/state";

export function launchTUI(): void {
  const mgr = new StateManager();
  const state = mgr.load();
  render(<CollectionView state={state} />);
}
```

- [ ] **Step 5: Wire TUI into CLI**

Update `src/cli/index.ts` — replace the `collection()` function body:

```typescript
function collection(): void {
  const { launchTUI } = require("../tui/app");
  launchTUI();
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx jest tests/tui/collection-view.test.tsx`
Expected: All tests PASS.

- [ ] **Step 7: Run all tests**

Run: `npx jest`
Expected: All tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/tui/collection-view.tsx src/tui/app.tsx tests/tui/collection-view.test.tsx src/cli/index.ts
git commit -m "feat: add TUI collection viewer with scrollable creature list"
```

---

## Task 17: Build & Integration Test

**Files:**
- No new files — verify everything builds and works together.

- [ ] **Step 1: Run full test suite**

Run: `npx jest --verbose`
Expected: All tests PASS.

- [ ] **Step 2: Build the project**

Run: `npm run build`
Expected: Clean compilation, `dist/` directory created with all JS files.

- [ ] **Step 3: Test the hook script end-to-end**

Run: `CATCHEM_CATCH_RATE=1 echo '{}' | node scripts/tick-hook.js`
Expected: A catch notification with creature ASCII art, level, and flavor text.

- [ ] **Step 4: Test CLI**

Run: `node dist/cli/index.ts help`
Expected: Usage message.

Run: `node dist/cli/index.ts setup`
Expected: Platform detection and hook installation output.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "chore: verify full build and integration"
```

---

## Task 18: Claude Code Plugin Packaging

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `hooks/hooks.json`

- [ ] **Step 1: Create plugin manifest**

```json
{
  "name": "catchem",
  "version": "1.0.0",
  "description": "Passive creature collection — catch creatures as you code, no interaction needed",
  "author": { "name": "catchem" },
  "license": "MIT",
  "keywords": ["game", "terminal", "creatures", "collection"]
}
```

- [ ] **Step 2: Create hooks configuration**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\""
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\""
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\""
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verify hook script works with plugin-relative path**

Run: `CLAUDE_PLUGIN_ROOT=. CATCHEM_CATCH_RATE=1 echo '{}' | node scripts/tick-hook.js`
Expected: Catch notification output.

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json hooks/hooks.json
git commit -m "feat: add Claude Code plugin manifest and hooks configuration"
```

---

## Summary

| Task | Component | What it builds |
|------|-----------|---------------|
| 1 | Scaffolding | package.json, tsconfig, jest, gitignore |
| 2 | Types | All interfaces, constants, rarity system |
| 3 | Leveling | 13-tier level thresholds and calculation |
| 4 | Flavor Text | Coding humor one-liner pool |
| 5 | Creatures | 24 creatures across 4 themes in JSON |
| 6 | Registry | Creature lookup and weighted random pick |
| 7 | Engine | tryCatch() orchestration with state mutation |
| 8 | State | StateManager with atomic writes |
| 9 | Notification | Catch notification formatter (new/levelup/normal) |
| 10 | Hook Script | Universal plain-JS hook for all platforms |
| 11 | Adapter | Claude Code adapter + platform detection |
| 12 | CLI | Setup and collection commands |
| 13 | TUI: Progress Bar | Reusable progress bar component |
| 14 | TUI: Animation | Frame cycling hook |
| 15 | TUI: Creature Card | Individual creature display with animation |
| 16 | TUI: Collection | Scrollable collection view + app entry |
| 17 | Integration | Full build and end-to-end verification |
| 18 | Packaging | Claude Code plugin manifest and hooks |
