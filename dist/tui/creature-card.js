"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRarityColor = getRarityColor;
exports.CreatureCard = CreatureCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const types_1 = require("../core/types");
const progress_bar_1 = require("./progress-bar");
const use_animation_1 = require("./use-animation");
const RARITY_COLORS = {
    common: "white",
    uncommon: "green",
    rare: "blue",
    epic: "magenta",
    legendary: "yellow",
    mythic: "red",
};
const RARITY_ICONS = {
    common: "⬜",
    uncommon: "🟩",
    rare: "🟦",
    epic: "🟪",
    legendary: "🟧",
    mythic: "🟥",
};
function getRarityColor(rarity) {
    return RARITY_COLORS[rarity];
}
/** Compact one-line summary for unselected creatures */
function CompactLine({ creature, discovered, level, catchCount, selected, }) {
    const color = getRarityColor(creature.rarity);
    const pointer = selected ? "▸ " : "  ";
    if (!discovered) {
        return ((0, jsx_runtime_1.jsxs)(ink_1.Text, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: pointer }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { color: "gray", children: ["???".padEnd(16), "░░░░░".padEnd(6), "Undiscovered"] })] }));
    }
    const name = creature.name.padEnd(16);
    const lvl = `Lv.${level}`.padEnd(6);
    const count = `x${catchCount}`.padEnd(6);
    const icon = RARITY_ICONS[creature.rarity];
    return ((0, jsx_runtime_1.jsxs)(ink_1.Text, { children: [(0, jsx_runtime_1.jsx)(ink_1.Text, { color: selected ? "cyan" : undefined, children: pointer }), (0, jsx_runtime_1.jsx)(ink_1.Text, { bold: true, color: color, children: name }), (0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: lvl }), (0, jsx_runtime_1.jsx)(ink_1.Text, { dimColor: true, children: count }), (0, jsx_runtime_1.jsx)(ink_1.Text, { children: icon })] }));
}
/** Expanded card shown for the selected creature */
function ExpandedCard({ creature, discovered, level, catchCount, nextThreshold, }) {
    const frameIndex = (0, use_animation_1.useAnimation)(creature.frames?.length ?? 1);
    const color = getRarityColor(creature.rarity);
    const rarityLabel = types_1.RARITY_LABELS[creature.rarity];
    if (!discovered) {
        const maskedArt = creature.art.map((line) => line.replace(/[^\s]/g, "░"));
        return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", marginLeft: 4, children: [maskedArt.map((line, i) => ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: line }, i))), (0, jsx_runtime_1.jsx)(ink_1.Text, { color: "gray", children: "??? \u2014 Undiscovered" })] }));
    }
    const art = creature.frames?.[frameIndex] ?? creature.art;
    const remaining = nextThreshold ? nextThreshold - catchCount : 0;
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", marginLeft: 4, children: [art.map((line, i) => ((0, jsx_runtime_1.jsx)(ink_1.Text, { color: color, children: line }, i))), (0, jsx_runtime_1.jsx)(ink_1.Text, { bold: true, color: color, children: creature.name }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: [rarityLabel, " \u00B7 Lv.", level, " \u00B7 x", catchCount] }), nextThreshold && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: ["Next: ", remaining, " more catches"] }), (0, jsx_runtime_1.jsxs)(ink_1.Box, { children: [(0, jsx_runtime_1.jsx)(progress_bar_1.ProgressBar, { current: catchCount, total: nextThreshold }), (0, jsx_runtime_1.jsxs)(ink_1.Text, { dimColor: true, children: [" ", catchCount, "/", nextThreshold] })] })] }))] }));
}
function CreatureCard({ creature, discovered, level, catchCount, nextThreshold, selected, }) {
    return ((0, jsx_runtime_1.jsxs)(ink_1.Box, { flexDirection: "column", children: [(0, jsx_runtime_1.jsx)(CompactLine, { creature: creature, discovered: discovered, level: level, catchCount: catchCount, selected: selected }), selected && ((0, jsx_runtime_1.jsx)(ExpandedCard, { creature: creature, discovered: discovered, level: level, catchCount: catchCount, nextThreshold: nextThreshold }))] }));
}
//# sourceMappingURL=creature-card.js.map