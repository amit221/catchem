"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectionView = CollectionView;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ink_1 = require("ink");
const registry_1 = require("../core/registry");
const leveling_1 = require("../core/leveling");
const creature_card_1 = require("./creature-card");
const progress_bar_1 = require("./progress-bar");
const use_animation_1 = require("./use-animation");
const VIEWPORT_SIZE = 5;
const THEME_LABELS = {
    "elemental-beasts": "Elemental Beasts",
    "galactic-warriors": "Galactic Warriors",
    "marvel-heroes": "Marvel Heroes",
    "legends-arena": "Legends Arena",
};
function formatThemeLabel(theme) {
    return THEME_LABELS[theme] ?? theme;
}
function buildList(creatures) {
    const items = [];
    let currentTheme = "";
    let idx = 0;
    for (const c of creatures) {
        if (c.theme !== currentTheme) {
            currentTheme = c.theme;
            items.push({ kind: "theme", theme: currentTheme });
        }
        items.push({ kind: "creature", creature: c, index: idx });
        idx++;
    }
    return items;
}
/** Map a creature index to the position of that creature in the flat list */
function creatureIndexToListPos(list, creatureIdx) {
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.kind === "creature" && item.index === creatureIdx)
            return i;
    }
    return 0;
}
function DetailView({ creature, state }) {
    const entry = state.creatures[creature.id];
    const frameIndex = (0, use_animation_1.useAnimation)(creature.frames?.length ?? 1);
    const color = (0, creature_card_1.getRarityColor)(creature.rarity);
    const art = creature.frames?.[frameIndex] ?? creature.art;
    const level = entry?.level ?? 0;
    const catchCount = entry?.catchCount ?? 0;
    const nextThreshold = level > 0 ? (0, leveling_1.getNextLevelThreshold)(level) : null;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", padding: 1, children: [(0, jsx_runtime_1.jsx)(ink_1.Box, { flexDirection: "column", alignItems: "center", children: art.map((line, i) => ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: color, children: line }, i))) }), (0, jsx_runtime_1.jsxs)(ink_1.Box, { marginTop: 1, flexDirection: "column", children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { bold: true, color: color, children: creature.name }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["Theme: ", formatThemeLabel(creature.theme)] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["Rarity: ", creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["Level: ", level, "  \u00B7  Catches: ", catchCount] }), entry && (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["First caught: ", entry.firstCaught.slice(0, 10)] }), entry && (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["Last caught:  ", entry.lastCaught.slice(0, 10)] }), (0, jsx_runtime_1.jsx)(ink_1.Text, { italic: true, color: "gray", children: creature.description }), nextThreshold && ((0, jsx_runtime_1.jsxs)(ink_1.Box, { marginTop: 1, children: [(0, jsx_runtime_1.jsx)(progress_bar_1.ProgressBar, { current: catchCount, total: nextThreshold, width: 20 }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: [" ", catchCount, "/", nextThreshold] })] }))] }), (0, jsx_runtime_1.jsx)(ink_1.Box, { marginTop: 1, children: (0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: "Press Escape or Q to go back" }) })] }));
}
function CollectionView({ state }) {
    const allCreatures = (0, registry_1.getAllCreatures)();
    const [selectedIndex, setSelectedIndex] = (0, react_1.useState)(0);
    const [detailCreature, setDetailCreature] = (0, react_1.useState)(null);
    const uniqueCount = Object.keys(state.creatures).length;
    const list = buildList(allCreatures);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (0, ink_1.useInput)((input, key) => {
        if (detailCreature) {
            if (key.escape || input === "q") {
                setDetailCreature(null);
            }
            return;
        }
        if (key.upArrow) {
            setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
        if (key.downArrow) {
            setSelectedIndex((prev) => Math.min(allCreatures.length - 1, prev + 1));
        }
        if (key.return) {
            const creature = allCreatures[selectedIndex];
            if (state.creatures[creature.id]) {
                setDetailCreature(creature);
            }
        }
        if (input === "q") {
            process.exit(0);
        }
    });
    // Detail view mode
    if (detailCreature) {
        return (0, jsx_runtime_1.jsx)(DetailView, { creature: detailCreature, state: state });
    }
    // Compute viewport window around selected creature in flat list
    const selectedListPos = creatureIndexToListPos(list, selectedIndex);
    const half = Math.floor(VIEWPORT_SIZE / 2);
    // We need to show VIEWPORT_SIZE creature rows (plus any theme headers in between).
    // Find creature rows to display centered on selectedIndex.
    const startCreature = Math.max(0, selectedIndex - half);
    const endCreature = Math.min(allCreatures.length - 1, startCreature + VIEWPORT_SIZE - 1);
    const adjustedStart = Math.max(0, endCreature - VIEWPORT_SIZE + 1);
    // Gather the list items in the viewport
    const viewportItems = [];
    const startListPos = creatureIndexToListPos(list, adjustedStart);
    // Include the theme header just before the first visible creature if it exists
    if (startListPos > 0 && list[startListPos - 1].kind === "theme") {
        viewportItems.push(list[startListPos - 1]);
    }
    let seenCreatures = 0;
    for (let i = startListPos; i < list.length && seenCreatures < VIEWPORT_SIZE; i++) {
        const item = list[i];
        viewportItems.push(item);
        if (item.kind === "creature")
            seenCreatures++;
    }
    const hasAbove = adjustedStart > 0;
    const hasBelow = endCreature < allCreatures.length - 1;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", padding: 1, children: [(0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", borderStyle: "round", borderColor: "yellow", paddingX: 2, children: [(0, jsx_runtime_1.jsxs)(ink_1.Text, { bold: true, color: "yellow", children: ["CatchEm    ", uniqueCount, "/", allCreatures.length, " discovered"] }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["   ", "Total catches: ", state.totalCatches] })] }), (0, jsx_runtime_1.jsx)(ink_1.Box, { marginTop: 1, children: (0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: "↑/↓ navigate · Enter detail · q quit" }) }), hasAbove && ((0, jsx_runtime_1.jsx)(ink_1.Box, { justifyContent: "center", marginTop: 1, children: (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "▲ more above" }) })), (0, jsx_runtime_1.jsx)(ink_1.Box, { flexDirection: "column", marginTop: hasAbove ? 0 : 1, children: viewportItems.map((item, i) => {
                    if (item.kind === "theme") {
                        const label = formatThemeLabel(item.theme);
                        const line = `── ${label} ${"─".repeat(Math.max(0, 34 - label.length))}`;
                        return ((0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: line }, `theme-${item.theme}`));
                    }
                    const creature = item.creature;
                    const entry = state.creatures[creature.id];
                    const discovered = !!entry;
                    const level = entry?.level ?? 0;
                    const catchCount = entry?.catchCount ?? 0;
                    const nextThreshold = level > 0 ? (0, leveling_1.getNextLevelThreshold)(level) : null;
                    return ((0, jsx_runtime_1.jsx)(creature_card_1.CreatureCard, { creature: creature, discovered: discovered, level: level, catchCount: catchCount, nextThreshold: nextThreshold, selected: item.index === selectedIndex }, creature.id));
                }) }), hasBelow && ((0, jsx_runtime_1.jsx)(ink_1.Box, { justifyContent: "center", children: (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "▼ more below" }) }))] }));
}
//# sourceMappingURL=collection-view.js.map