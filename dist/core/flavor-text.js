"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRandomFlavorText = getRandomFlavorText;
const FLAVOR_TEXTS = [
    "was eating your semicolons",
    "was using var instead of const",
    "was catching bugs... literally",
    "was reading Stack Overflow",
    "was ignoring TypeScript errors",
    "was closing all your tabs",
    "was fixing your merge conflicts",
    "was hiding in your node_modules",
    "was refactoring your refactoring",
    "was writing TODO comments",
    "was deleting your comments",
    "was adding console.logs everywhere",
    "was rebasing your main branch",
    "was mass-importing lodash",
    "was nesting ternaries 5 levels deep",
    "was pushing directly to main",
    "was storing passwords in plaintext",
    "was copy-pasting from ChatGPT",
    "was running rm -rf /",
    "was writing regex without tests",
    "was shipping on a Friday",
    "was ignoring the linter",
    "was committing .env files",
    "was using !important everywhere",
    "was naming variables x, y, z",
    "was parsing HTML with regex",
    "was deploying without testing",
    "was blaming the intern",
    "was spinning up another microservice",
    "was adding another dependency",
];
function getRandomFlavorText(rng = Math.random) {
    const index = Math.floor(rng() * FLAVOR_TEXTS.length);
    return FLAVOR_TEXTS[index];
}
//# sourceMappingURL=flavor-text.js.map