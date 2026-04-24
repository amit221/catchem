import React from "react";
import { render } from "ink";
import { CollectionView } from "./collection-view";
import { StateManager } from "../core/state";

export function launchTUI(): void {
  const mgr = new StateManager();
  const state = mgr.load();
  render(<CollectionView state={state} />);
}
