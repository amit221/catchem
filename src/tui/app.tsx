import React from "react";
import { render } from "ink";
import { CollectionView } from "./collection-view.js";
import { StateManager } from "../core/state.js";

export function launchTUI(): void {
  const mgr = new StateManager();
  const state = mgr.load();
  render(<CollectionView state={state} />);
}
