import {
  GameState,
  CreatureDefinition,
  AchievementDefinition,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
} from "../core/types.js";

const THEME_LABELS: Record<string, string> = {
  "elemental-beasts": "Elemental",
  "galactic-warriors": "Galactic",
  "marvel-heroes": "Marvel",
  "legends-arena": "Legends",
  "lotr-legends": "LOTR",
  "greek-myths": "Greek",
  "egyptian-myths": "Egyptian",
  "undead-horror": "Undead",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getNextThreshold(level: number): number | null {
  return level < MAX_LEVEL ? LEVEL_THRESHOLDS[level] : null;
}

function xpProgress(levelCatches: number, level: number): number {
  const next = getNextThreshold(level);
  if (next === null) return 100;
  return Math.min(100, Math.round((levelCatches / next) * 100));
}

function buildCardHtml(
  def: CreatureDefinition,
  state: GameState,
  index: number
): string {
  const caught = state.creatures[def.id];
  const unlocked = state.unlockedBytlings.includes(def.id);

  if (!unlocked) {
    // Locked card
    const rarityClass = `hl-${def.rarity}`;
    return `
<div class="card locked ${rarityClass}" style="min-width:0">
  <div class="card-art-zone">
    <div class="card-art">&#x1F512;</div>
  </div>
  <div class="card-body" style="border-top:3px solid var(--border)">
    <div class="card-id">#${String(index + 1).padStart(3, "0")}</div>
    <div class="card-name">???</div>
    <div class="card-badges">
      <span class="badge badge-${def.rarity}">${def.rarity}</span>
    </div>
  </div>
</div>`.trim();
  }

  if (!caught) {
    // Undiscovered — unlocked but not yet caught
    const rarityClass =
      def.rarity === "legendary" || def.rarity === "epic" || def.rarity === "mythic"
        ? `hl-${def.rarity}`
        : "";
    return `
<div class="card undiscovered ${rarityClass}" style="min-width:0">
  <div class="card-art-zone">
    <div class="card-art">${escapeHtml(def.art.join("\n"))}</div>
  </div>
  <div class="card-body" style="border-top:3px solid var(--border)">
    <div class="card-id">#${String(index + 1).padStart(3, "0")}</div>
    <div class="card-name">???</div>
    <div class="card-badges">
      <span class="badge badge-${def.rarity}">${def.rarity}</span>
      ${
        THEME_LABELS[def.theme]
          ? `<span class="theme-badge">${escapeHtml(THEME_LABELS[def.theme])}</span>`
          : ""
      }
    </div>
  </div>
</div>`.trim();
  }

  // Caught card
  const level = caught.level;
  const levelCatches = caught.levelCatches;
  const progress = xpProgress(levelCatches, level);
  const nextThreshold = getNextThreshold(level);
  const isMaxLevel = level >= MAX_LEVEL;
  const rarityHighlight =
    def.rarity === "legendary" || def.rarity === "epic" || def.rarity === "mythic"
      ? `hl-${def.rarity}`
      : "";

  return `
<div class="card ${rarityHighlight}" style="min-width:0">
  <div class="card-art-zone">
    <div class="card-art">${escapeHtml(def.art.join("\n"))}</div>
  </div>
  <div class="card-body" style="border-top:3px solid var(--border)">
    <div class="card-id">#${String(index + 1).padStart(3, "0")}</div>
    <div class="card-name">${escapeHtml(def.name)}</div>
    <div class="card-badges">
      <span class="badge badge-${def.rarity}">${def.rarity}</span>
      ${
        THEME_LABELS[def.theme]
          ? `<span class="theme-badge">${escapeHtml(THEME_LABELS[def.theme])}</span>`
          : ""
      }
    </div>
    <div class="card-xp">
      <div class="card-xp-fill ${def.rarity}" style="width:${progress}%"></div>
    </div>
    <div class="card-footer">
      <span class="card-level">LVL ${level}${isMaxLevel ? " <span style='color:var(--legendary)'>MAX</span>" : ""}</span>
      <span class="card-catches">${caught.catchCount}x caught</span>
    </div>
    ${
      !isMaxLevel && nextThreshold !== null
        ? `<div style="font-family:'Space Mono',monospace;font-size:9px;color:var(--text-muted);margin-top:4px">${levelCatches}/${nextThreshold} to next</div>`
        : ""
    }
  </div>
</div>`.trim();
}

function buildSceneBubble(state: GameState, creatures: CreatureDefinition[]): string {
  if (!state.catchHistory || state.catchHistory.length === 0) {
    return `<div class="scene-bubble">
      <span class="hl">» CatchEm</span><br>
      No catches yet. Start coding to encounter creatures!
    </div>`;
  }

  const lastEntry = state.catchHistory[state.catchHistory.length - 1];
  const def = creatures.find((c) => c.id === lastEntry.creatureId);
  const name = def ? def.name : lastEntry.creatureId;
  const rarity = def ? def.rarity : "common";
  const ts = new Date(lastEntry.timestamp);
  const dateStr = ts.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `<div class="scene-bubble">
    <span class="hl">» Last catch</span><br>
    <span class="hl">${escapeHtml(name)}</span> [${rarity}]<br>
    ${dateStr}
  </div>`;
}

function buildSceneSprites(state: GameState, creatures: CreatureDefinition[]): string {
  const caughtIds = Object.keys(state.creatures);
  if (caughtIds.length === 0) return "";

  // Pick up to 3 random caught creatures deterministically (last 3 caught)
  const history = state.catchHistory ?? [];
  const seenIds = new Set<string>();
  const pickedIds: string[] = [];
  for (let i = history.length - 1; i >= 0 && pickedIds.length < 3; i--) {
    const id = history[i].creatureId;
    if (!seenIds.has(id) && state.creatures[id]) {
      seenIds.add(id);
      pickedIds.push(id);
    }
  }

  const sprites = pickedIds
    .map((id) => {
      const def = creatures.find((c) => c.id === id);
      if (!def) return "";
      // Use first 4 lines of art to keep the sprite compact
      const art = def.art.slice(0, 4).join("\n");
      return `<div class="scene-sprite">${escapeHtml(art)}</div>`;
    })
    .filter(Boolean)
    .join("\n");

  return `<div class="scene-sprites">${sprites}</div>`;
}

export function generateViewerHtml(
  state: GameState,
  creatures: CreatureDefinition[],
  achievementDefs: AchievementDefinition[]
): string {
  // ── Stats ──────────────────────────────────────────────────────────────────
  const discoveredCount = Object.keys(state.creatures).length;
  const totalCreatures = creatures.length;
  const totalCatches = state.totalCatches;
  const streak = state.achievementTracking?.streakDays ?? 0;
  const achievementsUnlocked = Object.keys(state.achievements ?? {}).length;
  const totalAchievements = achievementDefs.length;

  // ── Sort creatures ─────────────────────────────────────────────────────────
  const sorted = [...creatures].sort((a, b) => {
    const aCaught = state.creatures[a.id];
    const bCaught = state.creatures[b.id];
    const aUnlocked = state.unlockedBytlings.includes(a.id);
    const bUnlocked = state.unlockedBytlings.includes(b.id);

    if (aCaught && !bCaught) return -1;
    if (!aCaught && bCaught) return 1;
    if (aCaught && bCaught) return bCaught.catchCount - aCaught.catchCount;
    if (aUnlocked && !bUnlocked) return -1;
    if (!aUnlocked && bUnlocked) return 1;
    return 0;
  });

  const cardsHtml = sorted
    .map((def, i) => buildCardHtml(def, state, i))
    .join("\n");

  const bubbleHtml = buildSceneBubble(state, creatures);
  const spritesHtml = buildSceneSprites(state, creatures);

  // ── CSS ────────────────────────────────────────────────────────────────────
  const css = `
@import url('https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Space+Grotesk:wght@500;600;700&family=Space+Mono:wght@400;700&display=swap');

* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #0e0e18;
  --card-bg: rgba(20,20,35,0.95);
  --card-art-bg: rgba(25,25,42,0.9);
  --text: #e4e4f0;
  --text-muted: #6a6a8e;
  --border: #3a3a5c;
  --accent: #ff3366;
  --common: #6b7280;
  --uncommon: #22c55e;
  --rare: #3b82f6;
  --epic: #a855f7;
  --legendary: #f59e0b;
  --mythic: #ef4444;
}

body {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--text);
  min-height: 100vh;
  background-color: var(--bg);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='none'%3E%3Cpath d='M30 50h6v6h-6zM36 56h6v6h-6zM42 62h6v6h-6zM48 56h6v6h-6zM54 50h6v6h-6z' fill='%23ff7eb3' opacity='0.3'/%3E%3Crect x='250' y='40' width='4' height='14' fill='%238b5cf6' opacity='0.3'/%3E%3Crect x='245' y='45' width='14' height='4' fill='%238b5cf6' opacity='0.3'/%3E%3Crect x='340' y='130' width='14' height='14' stroke='%236a6aaa' stroke-width='3' fill='none' opacity='0.18' transform='rotate(45 347 137)'/%3E%3Crect x='120' y='160' width='16' height='16' stroke='%2380f0a0' stroke-width='3' fill='none' opacity='0.2'/%3E%3Crect x='60' y='200' width='3' height='3' fill='%236a6aaa' opacity='0.2'/%3E%3Cpath d='M280 240h5v5h-5zM285 245h5v5h-5zM290 250h5v5h-5zM295 245h5v5h-5zM300 240h5v5h-5z' fill='%237edbff' opacity='0.25'/%3E%3Crect x='50' y='310' width='14' height='14' stroke='%23ffd700' stroke-width='3' fill='none' opacity='0.2'/%3E%3Crect x='350' y='320' width='4' height='14' fill='%23ff7eb3' opacity='0.2'/%3E%3Crect x='345' y='325' width='14' height='4' fill='%23ff7eb3' opacity='0.2'/%3E%3Crect x='200' y='350' width='3' height='3' fill='%2340e8d0' opacity='0.25'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 400px 400px;
}

.container { max-width: 1100px; margin: 0 auto; padding: 24px 28px 60px; }

.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  border: 3px solid var(--border);
  background: var(--card-bg);
  box-shadow: 5px 5px 0 var(--border);
  margin-bottom: 24px;
}
.header h1 { font-family: 'Silkscreen', cursive; font-size: 22px; letter-spacing: 3px; }
.header h1 span { color: var(--accent); }
.stats-row { display: flex; gap: 20px; }
.stat { text-align: center; }
.stat-val { font-family: 'Silkscreen', cursive; font-size: 18px; }
.stat-val .dim { font-size: 12px; color: var(--text-muted); }
.stat-lbl { font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; }

.scene {
  width: 100%; height: 340px;
  border: 3px solid var(--border);
  background: linear-gradient(180deg, #0f1833 0%, #162040 35%, #1a3050 65%, #1a4030 90%, #1a4a35 100%);
  box-shadow: 5px 5px 0 var(--border);
  position: relative; overflow: hidden;
  margin-bottom: 24px;
}
.scene-stars {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 8% 15%, #fff8, transparent),
    radial-gradient(1px 1px at 18% 32%, #fff5, transparent),
    radial-gradient(2px 2px at 28% 10%, #fffa, transparent),
    radial-gradient(1px 1px at 38% 28%, #fff4, transparent),
    radial-gradient(1px 1px at 48% 40%, #fff6, transparent),
    radial-gradient(2px 2px at 58% 14%, #fff7, transparent),
    radial-gradient(1px 1px at 68% 36%, #fff3, transparent),
    radial-gradient(1px 1px at 78% 8%, #fff5, transparent),
    radial-gradient(2px 2px at 88% 22%, #fff8, transparent),
    radial-gradient(1px 1px at 95% 38%, #fff4, transparent);
}
.scene-moon {
  position: absolute; top: 18px; right: 60px;
  width: 40px; height: 40px; border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #fffde8, #f5e6a8);
  box-shadow: 0 0 30px rgba(255,253,232,0.25);
}
.scene-ground {
  position: absolute; bottom: 0; left: 0; right: 0; height: 45px;
  background: #1a4030; border-top: 3px solid #2a7a4a;
}
.scene-ground::after {
  content: ''; position: absolute; top: -5px; left: 0; right: 0; height: 6px;
  background: repeating-linear-gradient(90deg, #2a7a4a 0px, #2a7a4a 4px, transparent 4px, transparent 18px);
}
.scene-bubble {
  position: absolute; top: 16px; left: 24px; max-width: 380px;
  background: rgba(0,0,0,0.75); border: 2px solid rgba(255,255,255,0.25);
  padding: 10px 16px;
  font-family: 'Silkscreen', cursive; font-size: 11px; line-height: 1.7; color: #e0e0f0;
}
.scene-bubble .hl { color: var(--accent); }
.scene-sprites {
  position: absolute; bottom: 50px; left: 0; right: 0;
  display: flex; justify-content: space-around; padding: 0 40px;
}
.scene-sprite {
  font-family: 'Space Mono', monospace; font-size: 9px; line-height: 1; white-space: pre;
  color: #b0c8e0; text-shadow: 0 0 4px rgba(180,200,230,0.3);
}

.codex-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.card {
  border: 3px solid var(--border);
  background: var(--card-bg);
  box-shadow: 5px 5px 0 var(--border);
  cursor: pointer;
  transition: all 0.1s ease;
  overflow: hidden;
}
.card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 8px 8px 0 var(--border);
}
.card:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 var(--border);
}

.card-art-zone {
  padding: 28px 20px;
  min-height: 190px;
  display: flex; align-items: center; justify-content: center;
  background: var(--card-art-bg);
}
.card-art {
  font-family: 'Space Mono', monospace;
  font-size: 14px; line-height: 1.2;
  white-space: pre; color: #b0b0d0;
}

.card-body {
  padding: 14px 16px 16px;
  border-top: 3px solid var(--border);
}
.card-id { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-muted); margin-bottom: 2px; }
.card-name { font-family: 'Silkscreen', cursive; font-size: 15px; letter-spacing: 1px; margin-bottom: 6px; }
.card-badges { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
.badge {
  font-family: 'Silkscreen', cursive; font-size: 9px;
  padding: 3px 10px; border-radius: 4px; color: #fff; letter-spacing: 1px;
}
.badge-common { background: var(--common); }
.badge-uncommon { background: var(--uncommon); }
.badge-rare { background: var(--rare); }
.badge-epic { background: var(--epic); }
.badge-legendary { background: var(--legendary); }
.badge-mythic { background: var(--mythic); }
.theme-badge {
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-muted);
  border: 1px solid #444; padding: 2px 8px; border-radius: 3px;
}
.card-xp { height: 5px; background: #2a2a40; border-radius: 3px; overflow: hidden; margin-top: 8px; }
.card-xp-fill { height: 100%; border-radius: 3px; }
.card-xp-fill.common { background: var(--common); }
.card-xp-fill.uncommon { background: var(--uncommon); }
.card-xp-fill.rare { background: var(--rare); }
.card-xp-fill.epic { background: var(--epic); }
.card-xp-fill.legendary { background: var(--legendary); }
.card-xp-fill.mythic { background: var(--mythic); }
.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; }
.card-level { font-family: 'Silkscreen', cursive; font-size: 11px; }
.card-catches { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-muted); }

.card.hl-legendary { border-color: var(--legendary); box-shadow: 5px 5px 0 var(--legendary); }
.card.hl-legendary:hover { box-shadow: 8px 8px 0 var(--legendary); }
.card.hl-epic { border-color: var(--epic); box-shadow: 5px 5px 0 var(--epic); }
.card.hl-epic:hover { box-shadow: 8px 8px 0 var(--epic); }
.card.hl-mythic { border-color: var(--mythic); box-shadow: 5px 5px 0 var(--mythic); }
.card.hl-mythic:hover { box-shadow: 8px 8px 0 var(--mythic); }

.card.undiscovered { opacity: 0.5; }
.card.undiscovered .card-art { filter: saturate(0) brightness(0.4); }
.card.locked { opacity: 0.15; border-style: dashed; pointer-events: none; }
.card.locked .card-art { font-size: 28px; filter: none; color: var(--text-muted); }
`.trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CatchEm — Collection</title>
  <style>${css}</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <header class="header">
    <h1>CATCH<span>EM</span></h1>
    <div class="stats-row">
      <div class="stat">
        <div class="stat-val">${discoveredCount}<span class="dim">/${totalCreatures}</span></div>
        <div class="stat-lbl">Discovered</div>
      </div>
      <div class="stat">
        <div class="stat-val">${totalCatches}</div>
        <div class="stat-lbl">Total Catches</div>
      </div>
      <div class="stat">
        <div class="stat-val">${streak}</div>
        <div class="stat-lbl">Day Streak</div>
      </div>
      <div class="stat">
        <div class="stat-val">${achievementsUnlocked}<span class="dim">/${totalAchievements}</span></div>
        <div class="stat-lbl">Achievements</div>
      </div>
    </div>
  </header>

  <!-- Platformer scene -->
  <div class="scene">
    <div class="scene-stars"></div>
    <div class="scene-moon"></div>
    ${bubbleHtml}
    ${spritesHtml}
    <div class="scene-ground"></div>
  </div>

  <!-- Codex grid -->
  <div class="codex-grid">
${cardsHtml}
  </div>

</div>
</body>
</html>`;
}
