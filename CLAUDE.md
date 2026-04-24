# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CatchEm is a passive creature collection game that runs alongside coding sessions. Creatures are caught via hooks triggered by coding activity (e.g., Claude Code hooks on UserPromptSubmit, PostToolUse, Stop, SessionStart). The TUI is built with Ink (React for CLI).

## Commands

```bash
npm run build          # TypeScript compilation (tsc)
npm run bundle         # esbuild single-file CJS bundle → dist/catchem.js
npm run build:all      # build + bundle
npm test               # Jest with ESM support (node --experimental-vm-modules)
npm run test:watch     # Jest in watch mode
npm run dev            # tsc --watch

# Run a single test file:
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/core/engine.test.ts

# Type-check without emitting:
npx tsc --noEmit
```

## Architecture

- **`src/core/`** — Game logic (no I/O dependencies beyond creature registry file read)
  - `types.ts` — All shared types, rarity weights, level thresholds, catch rate constants
  - `engine.ts` — `tryCatch()`: the main catch-or-miss function, mutates GameState in place
  - `registry.ts` — Loads `creatures/creatures.json` at module init, provides weighted random creature selection via `pickRandomCreature()`
  - `state.ts` — `StateManager` class: reads/writes game state to `~/.catchem/state.json` with atomic write (tmp + rename)
  - `leveling.ts` — Level calculation from catch count using `LEVEL_THRESHOLDS`
  - `notification.ts` — Formats catch results into terminal-friendly strings (new creature / level up / normal catch)
  - `flavor-text.ts` — Random flavor text for catch notifications

- **`src/adapters/`** — Platform integration (Claude Code hooks, future: Cursor, Copilot, Codex)
  - `claude-code.ts` — Generates hooks.json and plugin.json for Claude Code integration
  - `detect.ts` — Platform detection (checks for `~/.claude` dir)

- **`src/tui/`** — Ink/React terminal UI for viewing the collection (`catchem collection`)

- **`src/cli/index.ts`** — CLI entry point with `setup`, `collection`, and `help` commands

- **`creatures/creatures.json`** — Creature definitions (id, name, theme, rarity, description, ASCII art)

- **`tests/core/`** — Unit tests for core modules

## Key Design Decisions

- The engine's `tryCatch()` uses a pity system: catch rate starts at 1.0 (guaranteed first catch), resets to 0.2 on success, and increments by 0.05 on each miss
- All randomness is injectable via `rng: () => number` parameter for testability
- Registry loads creatures synchronously from JSON at import time; path is relative to compiled output (`../../creatures/creatures.json`)
- State persistence uses atomic writes (write to .tmp then rename) with a fallback for platforms where rename fails
- Tests use ESM mode via ts-jest with `useESM: true` and a custom `transformIgnorePatterns` to handle Ink's ESM-only dependencies
