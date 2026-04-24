# CatchEm - Passive Creature Collection Game

## Overview

CatchEm is a passive creature collection game that runs as a plugin across multiple coding platforms. As users code, creatures are automatically caught in the background with no interaction required. Users view their collection through an interactive terminal UI with ASCII art animations.

## Core Mechanics

### Passive Catching

- Hook fires on platform events (prompt submit, tool use, session start, etc.)
- **Pity timer catch rate:**
  - First ever event: **100%** (guaranteed first catch)
  - After each successful catch: rate resets to **20%**
  - Each miss: rate increases by **5%** (25%, 30%, 35%... until guaranteed)
- Random creature selected from global pool, weighted by rarity
- Catch notification displayed inline with ASCII art and a coding humor one-liner
- State saved to `~/.catchem/state.json`

### Rarity System

All creatures share one global pool regardless of theme. Weighted spawning:

| Tier       | Weight | Color  |
|------------|--------|--------|
| Common     | 50%    | White  |
| Uncommon   | 25%    | Green  |
| Rare       | 12%    | Blue   |
| Epic       | 7%     | Purple |
| Legendary  | 4%     | Orange |
| Mythic     | 2%     | Red    |

### Leveling System

Clash Royale-style cumulative catch thresholds. 13 levels max.

| Level | Catches Required |
|-------|-----------------|
| 1     | 1               |
| 2     | 3               |
| 3     | 7               |
| 4     | 17              |
| 5     | 37              |
| 6     | 87              |
| 7     | 187             |
| 8     | 387             |
| 9     | 787             |
| 10    | 1587            |
| 11    | 2587            |
| 12    | 4587            |
| 13    | 9587            |

### Notification Tiers

1. **NEW CREATURE** — big celebration with star borders, rarity label, discovery count
2. **LEVEL UP** — party borders, new level display, next-level progress
3. **Normal Catch** — minimal: catch count, level, progress bar, one-liner

### Flavor Text

Coding humor one-liners shown with each catch. Global pool, not creature-specific. Examples:
- "was eating your semicolons"
- "was using var instead of const"
- "was catching bugs... literally"
- "was reading Stack Overflow"
- "was ignoring TypeScript errors"
- "was closing all your tabs"
- "was fixing your merge conflicts"

## Themes & Creatures

### Theme System

- Themes are **cosmetic categories only** — all creatures share one global catch pool
- Adding a new theme = adding entries to `creatures.json`, no code changes
- Rarity is assigned per creature, not constrained by theme

### Launch Themes (4 themes, ~24 creatures total)

#### 1. Elemental Beasts (Pokemon-inspired)
Parody/homage creatures inspired by Pokemon. Original names and ASCII art that nod to the source without using trademarked names or likenesses.

~6-8 creatures: elemental types (lightning, fire, water, grass, ghost, psychic, etc.)

#### 2. Galactic Warriors (Star Wars-inspired)
Parody characters inspired by Star Wars universe.

~6-8 creatures: force wielders, droids, bounty hunters, alien sages, etc.

#### 3. Marvel Heroes (Marvel-inspired)
Parody characters inspired by the broader Marvel universe (not just Avengers).

~6-8 creatures: thunder gods, armored mechs, super soldiers, sorcerers, etc.

#### 4. Legends Arena (League of Legends-inspired)
Parody characters inspired by LoL champions.

~6-8 creatures: assassins, mages, archers, tanks, void creatures, etc.

### ASCII Art Spec

- **Static art:** 6 lines x ~14 characters wide, face/portrait focused
- **Animation frames:** 2-4 frames per creature for TUI display
- Subtle animations: blinking eyes, breathing, tail wag, energy pulse, etc.
- Frame cycle rate: ~500ms

## Architecture

### Project Structure

```
catchem/
  src/
    core/
      engine.ts          # tryCatch(), weighted random selection
      leveling.ts        # 13-level threshold system, XP calculation
      state.ts           # load/save ~/.catchem/state.json, migrations
      types.ts           # all TypeScript interfaces
    tui/
      app.tsx            # Ink-based TUI entry point
      collection.tsx     # scrollable creature list with animations
      creature-view.tsx  # single creature detail view
      animation.ts       # frame cycling logic
    adapters/
      claude-code.ts     # Claude Code hook config generator
      codex.ts           # Codex hook config generator
      cursor.ts          # Cursor hook config generator
      copilot.ts         # GitHub Copilot hook config generator
      opencode.ts        # OpenCode hook config generator
    cli/
      index.ts           # CLI entry: setup, collection commands
  creatures/
    creatures.json       # single source of truth: all creatures, art, themes
  scripts/
    tick-hook.js         # universal hook script (plain JS, no build needed)
```

### Tech Stack

- **Language:** TypeScript (source), plain JS for hook script
- **Runtime:** Node.js 20+
- **TUI Framework:** Ink (React for terminals)
- **Build:** tsc for type-checking, esbuild for bundling
- **Testing:** Jest with ts-jest
- **Package Manager:** npm

### State Schema

```typescript
interface GameState {
  version: number;
  creatures: Record<string, CreatureState>;
  totalCatches: number;
  currentCatchRate: number; // pity timer: starts at 1.0, resets to 0.2 after catch, +0.05 per miss
  stats: {
    sessionsPlayed: number;
    firstSession: string; // ISO date
  };
}

interface CreatureState {
  name: string;
  catchCount: number;
  level: number;
  firstCaught: string;  // ISO date
  lastCaught: string;   // ISO date
}
```

### Creature Definition Schema

```typescript
interface CreatureDefinition {
  id: string;
  name: string;
  theme: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  art: string[];          // static ASCII art lines
  frames?: string[][];    // animation frames (array of art arrays)
  description: string;
}
```

## CLI Interface

```bash
catchem setup            # auto-detect platform, install hooks
catchem collection       # open interactive TUI collection viewer
```

### Setup Flow

1. Detect which coding platforms are installed
2. Present detected platforms, let user confirm
3. Write appropriate hook configuration for each selected platform
4. Create `~/.catchem/` directory
5. Confirm installation

## TUI Collection Viewer

Launched via `catchem collection`. Opens an interactive terminal UI.

### Features

- **Scrollable list** of all creatures (single list, not tabbed by theme)
- Each creature shows: ASCII art (animated), name, level, catch count, rarity badge
- Undiscovered creatures shown as silhouettes / mystery blocks
- Level-up progress bar per creature
- Stats summary at top (total catches, discovery progress)

### Controls

- Arrow keys — scroll through creatures
- Enter — focus creature (full detail view with animation)
- Q — quit

## Cross-Platform Support

### Supported Platforms

- Claude Code
- Claude Codex
- Cursor (VS Code-based)
- GitHub Copilot (VS Code/JetBrains)
- OpenCode

### Adapter Pattern

Each adapter is a thin config generator that wires the platform's hook/event system to call `tick-hook.js`. The hook script is universal — platform differences are isolated to hook registration only.

### Distribution

Each platform has its own marketplace/plugin system. Distribution format per platform requires investigation:

- **Claude Code** — plugin registry format (`.claude-plugin/`)
- **Cursor / Copilot** — VS Code extension marketplace (`.vsix`)
- **Codex** — TBD (investigate plugin/package format)
- **OpenCode** — TBD (investigate plugin format)

> **NOTE:** Platform-specific packaging formats need research before implementation. The core game is platform-agnostic; only the packaging wrapper varies.

## Design Principles

- **Zero friction** — no prompts, menus, or energy systems. Creatures catch passively.
- **Pure functions** — catch logic is deterministic with injected RNG for testability
- **Single source of truth** — `creatures.json` defines all creatures, shared by hook and TS code
- **Theme extensibility** — adding a theme is just adding JSON entries, no code changes
- **Universal core** — one codebase, thin adapters per platform
- **ASCII-first** — works in every terminal, no image dependencies
