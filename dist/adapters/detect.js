"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectClaudeCode = detectClaudeCode;
exports.detectAllPlatforms = detectAllPlatforms;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
function detectClaudeCode() {
    const configDir = path_1.default.join(os_1.default.homedir(), ".claude");
    return {
        name: "Claude Code",
        detected: fs_1.default.existsSync(configDir),
        configPath: configDir,
    };
}
function detectAllPlatforms() {
    return [
        detectClaudeCode(),
    ];
}
//# sourceMappingURL=detect.js.map