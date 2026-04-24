# Platform Adapter Research

## Summary

| Platform | Manifest | Hook Format | Effort | Notes |
|---|---|---|---|---|
| **Claude Code** | `.claude-plugin/plugin.json` | `hooks/hooks.json` + shell | **Done** | Current implementation |
| **Cursor** | `.cursor-plugin/plugin.json` | JSON + shell commands | **Low** | Nearly identical to Claude Code |
| **Copilot** | `.github/hooks/*.json` | JSON + shell commands | **Low** | Similar format, fewer events (6) |
| **Codex CLI** | `.codex/hooks.json` | JSON + shell commands | **Low** | Very similar, missing sessionStart |
| **OpenCode** | `.opencode/plugins/*.ts` | TypeScript module | **Medium** | Needs TS wrapper around tick-hook.js |

## Cursor

- `.cursor-plugin/plugin.json` — nearly identical format to Claude Code
- 14 hook events: `sessionStart`, `sessionEnd`, `preToolUse`, `postToolUse`, etc.
- CatchEm mapping: `SessionStart`→`sessionStart`, `PostToolUse`→`postToolUse`, `Stop`→`stop`
- No exact `UserPromptSubmit` equivalent — use `preToolUse` or `beforeShellExecution`
- Distribution: Cursor Marketplace or local `.cursor-plugin/` directory

## GitHub Copilot

- `.github/hooks/*.json` — version 1 format
- 6 hook events: `sessionStart`, `sessionEnd`, `userPromptSubmitted`, `preToolUse`, `postToolUse`, `errorOccurred`
- Good mapping: `UserPromptSubmit`→`userPromptSubmitted`
- Hooks must be on repo default branch for cloud agent
- Platform-specific: needs both `bash` and `powershell` fields

## Codex CLI

- `.codex/hooks.json` — similar to Claude Code format
- 4-5 events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `PermissionRequest`
- No `SessionStart` event
- Plugin system with `/plugins` command

## OpenCode

- TypeScript/JavaScript modules in `.opencode/plugins/` or `~/.config/opencode/plugins/`
- 25+ events: `session.created`, `tool.execute.after`, `chat.message`, etc.
- Requires wrapping tick-hook.js in a TypeScript plugin export
- Distribution: local files or npm packages via Bun
