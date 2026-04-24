"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHooksJson = generateHooksJson;
exports.generatePluginJson = generatePluginJson;
exports.installClaudeCode = installClaudeCode;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateHooksJson(hookScriptPath) {
    const command = `node "${hookScriptPath}"`;
    const hookEntry = { hooks: [{ type: "command", command }] };
    return {
        hooks: {
            UserPromptSubmit: [hookEntry],
            PostToolUse: [hookEntry],
            Stop: [hookEntry],
            SessionStart: [hookEntry],
        },
    };
}
function generatePluginJson(version) {
    return {
        name: "catchem",
        version,
        description: "Passive creature collection — catch creatures as you code",
        author: { name: "catchem" },
        license: "MIT",
        keywords: ["game", "terminal", "creatures", "collection"],
    };
}
function installClaudeCode(projectRoot) {
    const hookScriptPath = path_1.default.join(projectRoot, "scripts", "tick-hook.js");
    const pluginDir = path_1.default.join(projectRoot, ".claude-plugin");
    const hooksDir = path_1.default.join(projectRoot, "hooks");
    fs_1.default.mkdirSync(pluginDir, { recursive: true });
    fs_1.default.mkdirSync(hooksDir, { recursive: true });
    const pkg = JSON.parse(fs_1.default.readFileSync(path_1.default.join(projectRoot, "package.json"), "utf8"));
    fs_1.default.writeFileSync(path_1.default.join(pluginDir, "plugin.json"), JSON.stringify(generatePluginJson(pkg.version), null, 2));
    fs_1.default.writeFileSync(path_1.default.join(hooksDir, "hooks.json"), JSON.stringify(generateHooksJson(hookScriptPath), null, 2));
}
//# sourceMappingURL=claude-code.js.map