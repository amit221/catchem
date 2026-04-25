<div align="center">

# CatchEm

**Catch creatures as you code. No interaction needed.**

A passive creature collection game that runs in the background while you use your favorite AI coding assistant. Creatures appear automatically — just keep coding.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![npm](https://img.shields.io/npm/v/catchem)](https://www.npmjs.com/package/catchem)

https://github.com/user-attachments/assets/597036c0-8a17-468e-b2ce-56aa5f556b22

</div>

---

## How It Works

1. **Install** — `npm install -g catchem`
2. **Setup** — `catchem setup` detects your platform and installs hooks
3. **Code** — creatures appear passively as you work
4. **Collect** — browse your collection with an interactive terminal UI

That's it. No prompts, no menus, no energy systems. Just code and catch.

## Installation

```bash
npm install -g catchem
```

Setup runs automatically after install. To manually set up or reconfigure:

```bash
catchem setup
```

## Passive Catching

At the end of each coding session, there's a chance a creature appears:

```
✨ You caught a Blazard! (x3)
[Lv.2] ████░░░░░░ 5/7
         ╱╲╱╲
   ╱══╲ ╱╱╱╱
  ╱ ◆◆ ╲╱╱
  ╲ ── ╱═╗
   ╲══╱  ║
    ╚═╝~🔥╝
"A TOWN?! Finally, somewhere to overheat besides your CPU fan."
```

## Creatures

**91 creatures** inspired by your favorite characters from:

| Theme | Inspired By |
|-------|------------|
| **Elemental Beasts** | Pokemon |
| **Galactic Warriors** | Star Wars |
| **Marvel Heroes** | Marvel |
| **Legends Arena** | League of Legends |
| **LOTR Legends** | Lord of the Rings |
| **Greek Myths** | Greek Mythology |
| **Egyptian Myths** | Egyptian Mythology |
| **Undead Horror** | Horror |

All creatures are original characters with unique ASCII art and coding-themed descriptions.

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

Catch duplicates to level up your creatures. 13 levels with escalating thresholds.

## Collection Viewer

Browse your collection in an interactive terminal UI with:

- Scrollable 3-column grid with windowed viewport
- Animated ASCII art (idle blinking, breathing, energy pulses)
- Rarity-colored borders and creature names
- Undiscovered creatures shown as masked silhouettes
- Detail view with full stats on Enter
- Level progress bars
- Discovery counter

Run it with:

```bash
catchem collection
```

Or use the `/catchem-collection` skill in Claude Code.

### Supported Platforms

| Platform | Status | Tested |
|----------|--------|--------|
| Claude Code | Supported | ✅ |
| Cursor | Supported | ❌ |
| GitHub Copilot | Supported | ❌ |
| Codex CLI | Supported | ❌ |
| OpenCode | Supported | ❌ |
| Gemini CLI | Supported | ❌ |

## Commands

| Command | What it does |
|---------|-------------|
| `catchem setup` | Detect platforms, install hooks and skills |
| `catchem setup --auto` | Silent setup (used by postinstall) |
| `catchem collection` | Open interactive TUI collection viewer |
| `catchem help` | Show help message |

## Auto-Updates

During setup, you can opt in to daily auto-updates. When enabled, a background check runs once per day and updates CatchEm silently via `npm update -g catchem`.

## Contributing

Found a bug? Have an idea for a new creature or theme? [Open an issue](https://github.com/amit221/catchem/issues).

---

<div align="center">

**Start catching creatures today.**

[Install](https://www.npmjs.com/package/catchem) | [Issues](https://github.com/amit221/catchem/issues) | [Changelog](https://github.com/amit221/catchem/blob/master/CHANGELOG.md)

If you enjoy CatchEm, give us a ⭐ — it helps more developers discover the project!

</div>
