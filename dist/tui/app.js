"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchTUI = launchTUI;
const jsx_runtime_1 = require("react/jsx-runtime");
const ink_1 = require("ink");
const collection_view_1 = require("./collection-view");
const state_1 = require("../core/state");
function launchTUI() {
    const mgr = new state_1.StateManager();
    const state = mgr.load();
    (0, ink_1.render)((0, jsx_runtime_1.jsx)(collection_view_1.CollectionView, { state: state }));
}
//# sourceMappingURL=app.js.map