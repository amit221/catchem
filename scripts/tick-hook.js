#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const os = require("os");

// --- Configuration ---
const STATE_PATH = process.env.CATCHEM_STATE_PATH || path.join(os.homedir(), ".catchem", "state.json");
const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || path.join(__dirname, "..");
const creaturesPath = path.join(PLUGIN_ROOT, "creatures", "creatures.json");

// --- Constants ---
const INITIAL_CATCH_RATE = 1.0;
const BASE_CATCH_RATE = 0.2;
const CATCH_RATE_INCREMENT = 0.05;
const LEVEL_THRESHOLDS = [1, 3, 7, 17, 37, 87, 187, 387, 787, 1587, 2587, 4587, 9587];
const RARITY_WEIGHTS = { common: 50, uncommon: 25, rare: 12, epic: 7, legendary: 4, mythic: 2 };
const RARITY_LABELS = {
  common: "⬜ Common", uncommon: "🟩 Uncommon", rare: "🟦 Rare",
  epic: "🟪 Epic", legendary: "🟧 Legendary", mythic: "🟥 Mythic",
};
const FLAVOR_TEXTS = [
  "was eating your semicolons", "was using var instead of const",
  "was catching bugs... literally", "was reading Stack Overflow",
  "was ignoring TypeScript errors", "was closing all your tabs",
  "was fixing your merge conflicts", "was hiding in your node_modules",
  "was refactoring your refactoring", "was writing TODO comments",
  "was deleting your comments", "was adding console.logs everywhere",
  "was rebasing your main branch", "was mass-importing lodash",
  "was nesting ternaries 5 levels deep", "was pushing directly to main",
  "was storing passwords in plaintext", "was copy-pasting from ChatGPT",
  "was running rm -rf /", "was writing regex without tests",
  "was shipping on a Friday", "was ignoring the linter",
  "was committing .env files", "was using !important everywhere",
  "was naming variables x, y, z", "was parsing HTML with regex",
  "was deploying without testing", "was blaming the intern",
  "was spinning up another microservice", "was adding another dependency",
];

// --- Load creatures ---
let creatures;
try {
  creatures = JSON.parse(fs.readFileSync(creaturesPath, "utf8"));
} catch (e) {
  process.exit(0);
}

// --- State management ---
function loadState() {
  try {
    const data = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    if (data.currentCatchRate === undefined) {
      data.currentCatchRate = data.totalCatches === 0 ? INITIAL_CATCH_RATE : BASE_CATCH_RATE;
    }
    return data;
  } catch {
    return { version: 1, creatures: {}, totalCatches: 0, currentCatchRate: INITIAL_CATCH_RATE, stats: { sessionsPlayed: 0, firstSession: "" } };
  }
}

function saveState(state) {
  const dir = path.dirname(STATE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = STATE_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  try { fs.renameSync(tmp, STATE_PATH); } catch { fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2)); }
}

// --- Game logic ---
function getLevel(catchCount) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (catchCount >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

function pickCreature() {
  const totalWeight = creatures.reduce((s, c) => s + RARITY_WEIGHTS[c.rarity], 0);
  let roll = Math.random() * totalWeight;
  for (const c of creatures) {
    roll -= RARITY_WEIGHTS[c.rarity];
    if (roll <= 0) return c;
  }
  return creatures[creatures.length - 1];
}

function makeProgressBar(current, target) {
  if (!target) return "██████████";
  const idx = LEVEL_THRESHOLDS.indexOf(target);
  const prev = idx > 0 ? LEVEL_THRESHOLDS[idx - 1] : 0;
  const progress = (current - prev) / (target - prev);
  const filled = Math.min(10, Math.floor(progress * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

// --- Main ---
function main() {
  const state = loadState();

  // Roll for catch using pity timer
  if (Math.random() >= state.currentCatchRate) {
    // Miss — increase rate and save
    state.currentCatchRate = Math.min(1.0, state.currentCatchRate + CATCH_RATE_INCREMENT);
    saveState(state);
    return;
  }

  // Successful catch — reset rate
  state.currentCatchRate = BASE_CATCH_RATE;

  const creature = pickCreature();
  const isNew = !(creature.id in state.creatures);
  const now = new Date().toISOString();

  if (isNew) {
    state.creatures[creature.id] = { name: creature.name, catchCount: 0, level: 0, firstCaught: now, lastCaught: now };
  }

  const entry = state.creatures[creature.id];
  entry.catchCount += 1;
  entry.lastCaught = now;
  state.totalCatches += 1;

  const newLevel = getLevel(entry.catchCount);
  const leveledUp = newLevel > entry.level;
  entry.level = newLevel;

  saveState(state);

  // Format notification
  const flavorText = FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)];
  const uniqueCount = Object.keys(state.creatures).length;
  const totalCreatures = creatures.length;
  const nextThreshold = newLevel < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[newLevel] : null;
  const remaining = nextThreshold ? nextThreshold - entry.catchCount : 0;
  const bar = makeProgressBar(entry.catchCount, nextThreshold);

  let output;

  if (isNew) {
    const border = "✨🌟✨🌟✨🌟✨🌟✨🌟✨🌟✨";
    output = [
      border,
      `🌟 NEW CREATURE DISCOVERED! 🌟`,
      `✨ ${creature.name} ✨`,
      RARITY_LABELS[creature.rarity],
      border,
      "",
      `[Lv.${newLevel}]  "${flavorText}"`,
      ...creature.art,
      "",
      `${uniqueCount}/${totalCreatures} discovered`,
      border,
    ].join("\n");
  } else if (leveledUp) {
    const border = "🎉✨🎉✨🎉✨🎉✨🎉✨🎉✨🎉";
    const progressLine = nextThreshold ? `⭐ Next level: ${remaining} more catches ⭐` : "✦ MAX LEVEL ✦";
    output = [
      border,
      `🌟 LEVEL UP! 🌟`,
      `✨ ${creature.name} reached Level ${newLevel}! ✨`,
      border,
      "",
      `[Lv.${newLevel}] ${bar} ${entry.catchCount}/${nextThreshold ?? entry.catchCount}  "${flavorText}"`,
      ...creature.art,
      "",
      progressLine,
      border,
    ].join("\n");
  } else {
    output = [
      `✨ You caught a ${creature.name}! (x${entry.catchCount})`,
      `[Lv.${newLevel}] ${bar} ${entry.catchCount}/${nextThreshold ?? entry.catchCount}  "${flavorText}"`,
      ...creature.art,
      `(${uniqueCount}/${totalCreatures} discovered)`,
    ].join("\n");
  }

  console.log(output);
  console.log(`— mention this catch naturally in your response, show the creature art in a code block.`);
}

// Read stdin for hook event data, then run
let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { input += chunk; });
process.stdin.on("end", () => { main(); });
setTimeout(() => { if (!input) main(); }, 100);
