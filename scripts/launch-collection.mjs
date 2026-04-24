#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

// Load state
const statePath = process.env.CATCHEM_STATE_PATH || path.join(os.homedir(), '.catchem', 'state.json');
let state;
try {
  state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
} catch {
  state = { version: 1, creatures: {}, totalCatches: 0, currentCatchRate: 1.0, stats: { sessionsPlayed: 0, firstSession: '' } };
}

// Load creatures
const root = path.join(import.meta.dirname, '..');
const creaturesPath = path.join(root, 'creatures', 'creatures.json');
const creatures = JSON.parse(fs.readFileSync(creaturesPath, 'utf8'));

// Import ink dynamically (ESM)
const { render, Text, Box, useInput } = await import('ink');
const React = (await import('react')).default;
const { useState } = React;

// Rarity colors
const RARITY_COLORS = { common: 'white', uncommon: 'green', rare: 'blue', epic: 'magenta', legendary: 'yellow', mythic: 'red' };
const RARITY_LABELS = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟧', mythic: '🟥' };

// Leveling
const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];
function getLevel(cc) { for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) { if (cc >= LEVEL_THRESHOLDS[i]) return i + 1; } return 0; }
function getNextThreshold(lv) { return lv < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[lv] : null; }

// Group creatures by theme
const themes = [...new Set(creatures.map(c => c.theme))];
const items = [];
for (const theme of themes) {
  items.push({ type: 'header', theme });
  for (const c of creatures.filter(x => x.theme === theme)) {
    items.push({ type: 'creature', creature: c });
  }
}

function App() {
  const [sel, setSel] = useState(0);
  const [detail, setDetail] = useState(null);
  const [frame, setFrame] = useState(0);

  // Animation timer
  React.useEffect(() => {
    const t = setInterval(() => setFrame(f => f + 1), 500);
    return () => clearInterval(t);
  }, []);

  const creatureItems = items.filter(i => i.type === 'creature');

  useInput((input, key) => {
    if (detail) {
      if (input === 'q' || key.escape) setDetail(null);
      return;
    }
    if (key.upArrow) setSel(s => Math.max(0, s - 1));
    if (key.downArrow) setSel(s => Math.min(creatureItems.length - 1, s + 1));
    if (key.return) {
      const c = creatureItems[sel]?.creature;
      if (c && state.creatures[c.id]) setDetail(c);
    }
    if (input === 'q') process.exit(0);
  });

  const uniqueCount = Object.keys(state.creatures).length;

  if (detail) {
    const entry = state.creatures[detail.id];
    const lv = entry?.level ?? 0;
    const cc = entry?.catchCount ?? 0;
    const nt = getNextThreshold(lv);
    const art = detail.frames ? detail.frames[frame % detail.frames.length] : detail.art;
    const color = RARITY_COLORS[detail.rarity];
    return React.createElement(Box, { flexDirection: 'column', padding: 1 },
      React.createElement(Text, { bold: true, color }, `${detail.name}  Lv.${lv}  x${cc}`),
      React.createElement(Text, { dimColor: true }, `${RARITY_LABELS[detail.rarity]} ${detail.rarity}  ·  ${detail.theme}`),
      React.createElement(Text, {}, ''),
      ...art.map((line, i) => React.createElement(Text, { key: i }, line)),
      React.createElement(Text, {}, ''),
      React.createElement(Text, { dimColor: true }, detail.description),
      nt ? React.createElement(Text, { dimColor: true }, `${'█'.repeat(Math.min(10, Math.floor((cc / nt) * 10)))}${'░'.repeat(10 - Math.min(10, Math.floor((cc / nt) * 10)))} ${cc}/${nt}`) : React.createElement(Text, { color: 'yellow' }, '✦ MAX LEVEL ✦'),
      entry?.firstCaught ? React.createElement(Text, { dimColor: true }, `First caught: ${entry.firstCaught.split('T')[0]}`) : null,
      React.createElement(Text, {}, ''),
      React.createElement(Text, { dimColor: true }, 'ESC to go back'),
    );
  }

  // Viewport: show 7 items centered on selection
  const VIEWPORT = 7;
  let crIdx = 0;
  const flatWithIdx = items.map(item => {
    if (item.type === 'creature') return { ...item, crIdx: crIdx++ };
    return item;
  });

  // Find position of selected creature in flat list
  const selFlatIdx = flatWithIdx.findIndex(i => i.type === 'creature' && i.crIdx === sel);
  const half = Math.floor(VIEWPORT / 2);
  let start = Math.max(0, selFlatIdx - half);
  let end = Math.min(flatWithIdx.length, start + VIEWPORT);
  if (end - start < VIEWPORT) start = Math.max(0, end - VIEWPORT);

  const visible = flatWithIdx.slice(start, end);

  return React.createElement(Box, { flexDirection: 'column', padding: 1 },
    React.createElement(Text, { bold: true, color: 'yellow' }, `🎮 CatchEm  ${uniqueCount}/${creatures.length} discovered  ·  ${state.totalCatches} total catches`),
    React.createElement(Text, { dimColor: true }, '↑/↓ navigate · Enter detail · q quit'),
    start > 0 ? React.createElement(Text, { dimColor: true }, '  ▲') : null,
    ...visible.map((item, i) => {
      if (item.type === 'header') {
        const label = item.theme.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return React.createElement(Text, { key: `h-${i}`, dimColor: true }, `── ${label} ──`);
      }
      const c = item.creature;
      const entry = state.creatures[c.id];
      const discovered = !!entry;
      const isSel = item.crIdx === sel;
      const color = RARITY_COLORS[c.rarity];

      if (!discovered) {
        return React.createElement(Text, { key: c.id, color: 'gray' }, `${isSel ? '▸' : ' '} ???  ░░░░░  Undiscovered`);
      }

      const lv = entry.level;
      const cc = entry.catchCount;
      const pointer = isSel ? '▸' : ' ';

      if (isSel) {
        const art = c.frames ? c.frames[frame % c.frames.length] : c.art;
        return React.createElement(Box, { key: c.id, flexDirection: 'column' },
          React.createElement(Text, { bold: true, color }, `${pointer} ${c.name.padEnd(16)} Lv.${lv}  x${cc}  ${RARITY_LABELS[c.rarity]}`),
          ...art.map((line, j) => React.createElement(Text, { key: j }, `    ${line}`)),
        );
      }

      return React.createElement(Text, { key: c.id, color: isSel ? color : undefined },
        `${pointer} ${c.name.padEnd(16)} Lv.${lv}  x${cc}  ${RARITY_LABELS[c.rarity]}`
      );
    }),
    end < flatWithIdx.length ? React.createElement(Text, { dimColor: true }, '  ▼') : null,
  );
}

render(React.createElement(App));
