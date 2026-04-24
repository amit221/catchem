<div align="center">

# CatchEm

**Catch creatures as you code. No interaction needed.**

A passive creature collection game that runs in the background while you use your favorite AI coding assistant. Creatures appear automatically — just keep coding.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/catchem)](https://www.npmjs.com/package/catchem)

</div>

---

## How It Works

1. **Install** — `npm install -g catchem`
2. **Setup** — `catchem setup` detects your platform and installs hooks
3. **Code** — creatures appear passively as you work
4. **Collect** — browse your collection with an interactive terminal UI

That's it. No prompts, no menus, no energy systems. Just code and catch.

## Passive Catching

Every time you submit a prompt, use a tool, or start a session, there's a chance a creature appears. The **pity timer** ensures you're never unlucky for too long:

- **First ever event** — guaranteed catch (100%)
- **After each catch** — rate resets to 20%
- **Each miss** — rate increases by 5% until you catch something

Catches appear inline with ASCII art and a coding humor one-liner:

```
✨ You caught a Blazard! (x3)
[Lv.2] ████░░░░░░ 5/7  "was deploying to production on Friday"
         ╱╲╱╲
   ╱══╲ ╱╱╱╱
  ╱ ◆◆ ╲╱╱
  ╲ ── ╱═╗
   ╲══╱  ║
    ╚═╝~🔥╝
```

## Creatures

**44 creatures** across 4 themed collections, each with unique ASCII art and animations:

| Theme | Inspiration | Creatures |
|-------|------------|-----------|
| **Elemental Beasts** | Pokemon | Zappik, Blazard, Aquashell, Spectrex, Arcanox, and more |
| **Galactic Warriors** | Star Wars | Bladewing, Rustbot, Swampwise, Voidhelm, Nebulord, and more |
| **Marvel Heroes** | Marvel | Thunderox, Ironclash, Sorceron, Cosmojaw, Hawksight, and more |
| **Legends Arena** | League of Legends | Shadowstep, Hexweaver, Voidmaw, Runeking, and more |

All creatures are original parody/homage characters with their own names and art.

### Rarity System

| Tier | Chance | Color |
|------|--------|-------|
| Common | 50% | ⬜ White |
| Uncommon | 25% | 🟩 Green |
| Rare | 12% | 🟦 Blue |
| Epic | 7% | 🟪 Purple |
| Legendary | 4% | 🟧 Orange |
| Mythic | 2% | 🟥 Red |

### Leveling

Catch duplicates to level up your creatures. 13 levels with escalating thresholds — from 1 catch for Level 1 to 9,587 for max level.

## Collection Viewer

Browse your collection in an interactive terminal UI with:

- Scrollable list with windowed viewport
- Animated ASCII art (idle blinking, breathing, energy pulses)
- Rarity-colored creature names
- Theme section headers
- Detail view with full stats on Enter
- Level progress bars

Run it with:

```bash
catchem collection
```

Or use the `/catchem-collection` skill in Claude Code.

## Installation

```bash
npm install -g catchem
```

Setup runs automatically after install. To manually set up or reconfigure:

```bash
catchem setup
```

Setup detects your platform and installs the appropriate hooks:

### Supported Platforms

| Platform | Status |
|----------|--------|
| Claude Code | Supported |
| Cursor | Supported |
| GitHub Copilot | Supported |
| Codex CLI | Supported |
| OpenCode | Supported |
| Gemini CLI | Supported |

## Commands

| Command | What it does |
|---------|-------------|
| `catchem setup` | Detect platforms, install hooks and skills |
| `catchem setup --auto` | Silent setup (used by postinstall) |
| `catchem collection` | Open interactive TUI collection viewer |
| `catchem help` | Show help message |

## Game Data

Your game state is saved at `~/.catchem/state.json`. This includes:

- Caught creatures and their levels
- Total catch count
- Pity timer state
- Session stats

## Auto-Updates

During setup, you can opt in to daily auto-updates. When enabled, a background check runs once per day and updates CatchEm silently via `npm update -g catchem`.

## Contributing

Found a bug? Have an idea for a new creature or theme? [Open an issue](https://github.com/amit221/catchem/issues).

---

<div align="center">

**Start catching creatures today.**

[Install](https://www.npmjs.com/package/catchem) | [Issues](https://github.com/amit221/catchem/issues) | [Changelog](https://github.com/amit221/catchem/blob/master/CHANGELOG.md)

<sub>CatchEm — a passive creature collection game for AI-assisted coding</sub>

</div>
