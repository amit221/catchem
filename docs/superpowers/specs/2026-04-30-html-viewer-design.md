# Phase 2: HTML Viewer — Design Spec

## Goal

`catchem viewer` generates a standalone HTML file at `~/.catchem/collection.html` and opens it in the browser. It reads from local state — no network needed. Does NOT replace the TUI (`catchem collection`).

## Design Direction

Validated via mockups (v9). Dark theme with sparse pixel-geometric repeating background, neobrutalist cards, Silkscreen pixel font for headings.

## Layout

### Top: Platformer Scene (~340px)
- Full-width section above the codex
- Night sky with stars, moon, ground with grass
- Event bubble showing latest catch/achievement/discovery
- ASCII art sprite placeholders (will be replaced with PixelLab pixel art assets later)
- The scene is a placeholder for a future interactive platformer — for now it's a static visual with the latest event

### Bottom: Codex Grid
- Pokedex-style vertical cards in a responsive grid (`minmax(220px, 1fr)`)
- Each card: large art zone (190px+ min-height) → name → rarity badge + theme badge → XP bar → level + catch count

## Styling

### Background
- Dark: `#0e0e18`
- Repeating SVG tile (400x400px) with sparse pixel shapes: pink zigzags, purple plus signs, navy diamonds, green squares, cyan zigzags, yellow squares, teal dots
- Low opacity (~0.2-0.3) so shapes are subtle, not noisy

### Cards
- Background: `rgba(20,20,35,0.95)`
- Border: `3px solid #3a3a5c`
- Shadow: `5px 5px 0 #3a3a5c` (neobrutalist hard shadow)
- Hover: translate up-left, bigger shadow
- Active: translate down-right, smaller shadow
- Art zone background: `rgba(25,25,42,0.9)`

### Rarity Highlights (Epic+)
- Epic: border + shadow color = `#a855f7`
- Legendary: border + shadow color = `#f59e0b`
- Mythic: border + shadow color = `#ef4444`

### Card States
- **Caught**: full card with art, name, badges, XP, level
- **Undiscovered** (unlocked but not caught): 50% opacity, desaturated art, name shows "???"
- **Locked** (not unlocked): 15% opacity, dashed border, lock icon, no interaction

### Typography
- Headings/names/levels: `Silkscreen` (pixel font)
- Body/descriptions: `Space Grotesk`
- Stats/monospace: `Space Mono`
- Loaded via Google Fonts CDN (no npm)

### Colors
```
accent:    #ff3366
common:    #6b7280
uncommon:  #22c55e
rare:      #3b82f6
epic:      #a855f7
legendary: #f59e0b
mythic:    #ef4444
```

## Data Flow

1. `catchem viewer` runs
2. Reads `~/.catchem/state.json` (GameState v2)
3. Reads `creatures/creatures.json` (bundled with npm package) for art + metadata
4. Reads `creatures/achievement-definitions.json` for achievement data
5. Generates a single self-contained HTML file with all data embedded as inline JSON
6. Writes to `~/.catchem/collection.html`
7. Opens in default browser (`open` on Mac, `start` on Windows, `xdg-open` on Linux)

## HTML Structure

The generated HTML is a single file with:
- Inline CSS (no external stylesheets except Google Fonts CDN)
- Inline JavaScript for interactivity (sorting, filtering)
- Embedded JSON data (`<script>const STATE = {...}; const CREATURES = [...];</script>`)
- No build step, no npm dependencies

## Card Content

Each caught creature card shows:
- `#NNNN` — creature index number
- ASCII art (from `creatures.json` `.art` field) rendered in `<pre>` tag
- Name in Silkscreen font
- Rarity badge (colored pill)
- Theme badge (outlined pill)
- XP progress bar (colored by rarity)
- Level (Silkscreen) and catch count

When images are available later (from `catchem-assets` repo), the art zone will show `<img>` instead of `<pre>`. The viewer checks if an image URL exists for the creature ID; if not, falls back to ASCII art.

## Interactivity (JS)

Minimal JS, no framework:
- **Sort by**: name, rarity, level, catch count, theme
- **Filter by**: rarity, theme, caught/uncaught/locked
- Cards are generated from the embedded JSON on page load

## CLI Command

```
catchem viewer
```

- Added to `src/cli/index.ts` switch
- Implementation in `src/cli/viewer.ts`
- Generates HTML from template + state data
- Opens browser

## New Files

| Path | Purpose |
|------|---------|
| `src/social/viewer.ts` | HTML generator — reads state + creatures, outputs complete HTML string |
| `src/cli/viewer.ts` | CLI command — calls generator, writes file, opens browser |

## Image Fallback Strategy

The HTML template includes a helper:

```javascript
function getArtHtml(creature) {
  const imgUrl = `https://raw.githubusercontent.com/amit221/catchem-assets/main/images/${creature.id}.png`;
  // Try image first, fall back to ASCII
  return `<img src="${imgUrl}" onerror="this.style.display='none';this.nextSibling.style.display='block'" style="max-width:100%;image-rendering:pixelated">
  <pre style="display:none">${creature.art.join('\n')}</pre>`;
}
```

This means: when images are added to `catchem-assets`, the viewer automatically picks them up. No code change needed.

## What This Does NOT Include

- Real-time updates / file watching (static snapshot, regenerate with `catchem viewer`)
- Platformer interactivity (static scene for now)
- Gist sync (Phase 3)
- PR summary (Phase 3)
