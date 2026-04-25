import { useState, useEffect } from "react";
import type { Rarity } from "../core/types.js";

type InkColor = "white" | "green" | "blue" | "magenta" | "yellow" | "red" | "cyan" | "cyanBright" | "yellowBright" | "redBright" | "gray";

const RARITY_COLORS: Record<Rarity, InkColor> = {
  common: "white",
  uncommon: "green",
  rare: "blue",
  epic: "magenta",
  legendary: "yellow",
  mythic: "red",
};

const SELECTED_CYCLE: InkColor[] = ["cyan", "cyanBright", "white"];
const LEGENDARY_CYCLE: InkColor[] = ["yellow", "yellowBright", "white"];
const MYTHIC_CYCLE: InkColor[] = ["red", "magenta", "redBright"];

export function getBorderColor(rarity: Rarity, selected: boolean, frame: number): InkColor {
  if (selected) {
    return SELECTED_CYCLE[frame % SELECTED_CYCLE.length];
  }
  if (rarity === "legendary") {
    return LEGENDARY_CYCLE[frame % LEGENDARY_CYCLE.length];
  }
  if (rarity === "mythic") {
    return MYTHIC_CYCLE[frame % MYTHIC_CYCLE.length];
  }
  return RARITY_COLORS[rarity];
}

export function useBorderColor(rarity: Rarity, selected: boolean): InkColor {
  const shouldAnimate = selected || rarity === "legendary" || rarity === "mythic";
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) return;
    const interval = selected ? 300 : 800;
    const timer = setInterval(() => {
      setFrame((prev) => prev + 1);
    }, interval);
    return () => clearInterval(timer);
  }, [shouldAnimate, selected]);

  return getBorderColor(rarity, selected, frame);
}
