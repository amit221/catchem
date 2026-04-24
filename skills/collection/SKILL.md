---
name: collection
description: View your creature collection, evolution stages, and discovery progress
---

Run the following command to open the CatchEm TUI collection viewer. Build first if needed:

```bash
cd "${CLAUDE_PLUGIN_ROOT}" && node -e "require('fs').existsSync('dist/cli/index.js') || process.exit(1)" 2>/dev/null || npx tsc && node dist/cli/index.js collection
```

This launches an interactive terminal UI where the user can browse their caught creatures. Run it with the Bash tool and let the terminal take over — do not attempt to parse or summarize the output.
