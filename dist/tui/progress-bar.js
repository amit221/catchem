"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = ProgressBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
function ProgressBar({ current, total, width = 10 }) {
    const ratio = total > 0 ? Math.min(1, current / total) : 0;
    const filled = Math.floor(ratio * width);
    const bar = "█".repeat(filled) + "░".repeat(width - filled);
    return (0, jsx_runtime_1.jsx)(ink_1.Text, { children: bar });
}
//# sourceMappingURL=progress-bar.js.map