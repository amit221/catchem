"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateManager = exports.DEFAULT_STATE_PATH = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const types_1 = require("./types");
function defaultState() {
    return {
        version: 1,
        creatures: {},
        totalCatches: 0,
        currentCatchRate: types_1.INITIAL_CATCH_RATE,
        stats: {
            sessionsPlayed: 0,
            firstSession: "",
        },
    };
}
exports.DEFAULT_STATE_PATH = path_1.default.join(os_1.default.homedir(), ".catchem", "state.json");
class StateManager {
    filePath;
    constructor(filePath = exports.DEFAULT_STATE_PATH) {
        this.filePath = filePath;
    }
    load() {
        try {
            const raw = fs_1.default.readFileSync(this.filePath, "utf8");
            const data = JSON.parse(raw);
            if (!data || typeof data !== "object" || !data.version) {
                return defaultState();
            }
            return data;
        }
        catch {
            return defaultState();
        }
    }
    save(state) {
        const dir = path_1.default.dirname(this.filePath);
        fs_1.default.mkdirSync(dir, { recursive: true });
        const tmpPath = this.filePath + ".tmp";
        fs_1.default.writeFileSync(tmpPath, JSON.stringify(state, null, 2));
        try {
            fs_1.default.renameSync(tmpPath, this.filePath);
        }
        catch {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify(state, null, 2));
            try {
                fs_1.default.unlinkSync(tmpPath);
            }
            catch { /* ignore */ }
        }
    }
}
exports.StateManager = StateManager;
//# sourceMappingURL=state.js.map