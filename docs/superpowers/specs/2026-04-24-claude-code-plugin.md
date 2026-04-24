# CatchEm — Claude Code Marketplace Plugin

## Overview

Package the catchem repo as a Claude Code marketplace plugin so users can install it via `claude plugin add github:amit221/catchem` and immediately start catching creatures. The repo root doubles as the plugin — no separate build or packaging step.

## Distribution

- **Source:** GitHub repo (`github:amit221/catchem`)
- **Install:** `claude plugin add github:amit221/catchem`
- **Updates:** Users get the latest version on each plugin update (version tracked via `plugin.json` version field or git SHA)

## Plugin Structure

Three static file groups added to the repo root:

### 1. Manifest — `.claude-plugin/plugin.json`

```json
{
  "name": "catchem",
  "version": "1.0.0",
  "description": "Passive creature collection — catch creatures as you code",
  "author": { "name": "amit221" },
  "homepage": "https://github.com/amit221/catchem",
  "repository": "https://github.com/amit221/catchem",
  "license": "MIT",
  "keywords": ["game", "terminal", "creatures", "collection"]
}
```

### 2. Hooks — `hooks/hooks.json`

Wires four Claude Code lifecycle events to `scripts/tick-hook.js` using `${CLAUDE_PLUGIN_ROOT}` for portable paths:

```json
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\"" }] }],
    "PostToolUse":      [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\"" }] }],
    "Stop":             [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\"" }] }],
    "SessionStart":     [{ "hooks": [{ "type": "command", "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/tick-hook.js\"" }] }]
  }
}
```

**Events:**
- `UserPromptSubmit` — user sends a prompt
- `PostToolUse` — a tool completes successfully
- `Stop` — Claude finishes responding
- `SessionStart` — session begins

Each event triggers one catch attempt via the existing pity timer system.

### 3. Skill — `skills/collection/SKILL.md`

Single skill: `/catchem:collection` — launches the TUI viewer.

```markdown
---
description: View your CatchEm creature collection — shows all discovered creatures, levels, and progress
---

Launch the CatchEm collection TUI viewer by running:
node "${CLAUDE_PLUGIN_ROOT}/dist/cli/index.js" collection
```

### 4. Build artifacts — `dist/` committed to repo

The TUI skill needs compiled TypeScript (`dist/cli/index.js`). Since Claude Code plugins install directly from GitHub with no build step, `dist/` must be committed to the repo. The `.gitignore` entry for `dist/` should be removed.

Alternatively, a `postinstall` script could build on install, but committing `dist/` is simpler and avoids requiring devDependencies on the user's machine.

## Cleanup

### Remove generated plugin files approach

The `installClaudeCode()` function in `src/adapters/claude-code.ts` currently generates `.claude-plugin/plugin.json` and `hooks/hooks.json` dynamically. Since these are now static files in the repo, this function becomes unnecessary.

**Action:** Remove `installClaudeCode()` and `generatePluginJson()` from `src/adapters/claude-code.ts`. Keep `generateHooksJson()` if other adapters might reuse the hook structure, otherwise remove it too.

### Update CLI setup command

The `catchem setup` command currently calls `installClaudeCode()`. Update it to:
- Skip Claude Code (plugin handles it)
- Still detect and set up other platforms via their adapters

### tick-hook.js path update

The `tick-hook.js` currently uses `CLAUDE_PLUGIN_ROOT` env var with a fallback to `__dirname/..`. This already works — the plugin hooks set `${CLAUDE_PLUGIN_ROOT}` which Claude Code resolves as an environment variable for plugin commands. No changes needed to `tick-hook.js`.

## What stays unchanged

- `scripts/tick-hook.js` — the hook script, no changes
- `creatures/creatures.json` — creature definitions
- `src/core/` — all game logic
- `src/tui/` — TUI collection viewer
- `src/cli/index.ts` — CLI entry point (still works standalone)
- `src/adapters/detect.ts` — multi-platform detection
- All tests

## File inventory

New files:
- `.claude-plugin/plugin.json`
- `hooks/hooks.json`
- `skills/collection/SKILL.md`

Modified files:
- `src/adapters/claude-code.ts` — remove `installClaudeCode()`, `generatePluginJson()`, `generateHooksJson()`
- `src/cli/index.ts` — update setup to skip Claude Code platform

Removed files:
- None (old generated files were in gitignore / not committed)
