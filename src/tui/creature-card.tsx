import React from "react";
import { Box, Text } from "ink";
import stringWidth from "string-width";
import { CreatureDefinition, Rarity, RARITY_LABELS } from "../core/types.js";
import { ProgressBar } from "./progress-bar.js";
import { useBorderColor } from "./use-border-color.js";

type InkColor = "white" | "green" | "blue" | "magenta" | "yellow" | "red" | "cyan" | "gray";

const RARITY_COLORS: Record<Rarity, InkColor> = {
  common: "white",
  uncommon: "green",
  rare: "blue",
  epic: "magenta",
  legendary: "yellow",
  mythic: "red",
};

const RARITY_ICONS: Record<Rarity, string> = {
  common: "⬜",
  uncommon: "🟩",
  rare: "🟦",
  epic: "🟪",
  legendary: "🟧",
  mythic: "🟥",
};

export const CARD_WIDTH = 26;
const ART_LINES = 5;

export function getRarityColor(rarity: Rarity): InkColor {
  return RARITY_COLORS[rarity];
}

interface CreatureCardProps {
  creature: CreatureDefinition;
  discovered: boolean;
  level: number;
  catchCount: number;
  nextThreshold: number | null;
  selected: boolean;
}

/**
 * Pad or truncate `s` to fit within `jsTargetLen` JS characters (Ink's layout unit),
 * while ensuring the visual (terminal column) width also does not exceed `jsTargetLen`.
 *
 * Ink measures string length in JS chars for box layout. For BMP emoji like ⚡ (JS
 * length 1, visual 2), padding to `jsTargetLen` JS chars would produce a string
 * that is visually wider than `jsTargetLen` columns. We compensate by reducing
 * padding when the content has more visual cols than JS chars.
 *
 * Result: JS length ≤ jsTargetLen AND visual width ≤ jsTargetLen.
 */
function visualPadOrTruncate(s: string, jsTargetLen: number): string {
  let result = "";
  let jsLen = 0;
  let visLen = 0;
  for (const char of s) {
    const charJsLen = char.length;
    const charVisLen = stringWidth(char);
    if (jsLen + charJsLen > jsTargetLen) break;
    if (visLen + charVisLen > jsTargetLen) break;
    result += char;
    jsLen += charJsLen;
    visLen += charVisLen;
  }
  // Extra visual columns used by wide chars (visLen > jsLen when BMP wide chars present)
  const extraWide = Math.max(0, visLen - jsLen);
  // Pad with spaces: reduce padding by extraWide so totalVisLen ≤ jsTargetLen
  const padding = Math.max(0, jsTargetLen - jsLen - extraWide);
  return result + " ".repeat(padding);
}

function UndiscoveredCard({ creature, selected }: { creature: CreatureDefinition; selected: boolean }): React.ReactElement {
  const borderColor: InkColor = selected ? "cyan" : "gray";
  const maskedArt = creature.art.map((line) => line.replace(/[^\s]/g, "░"));

  // Normalize art to ART_LINES lines
  const artLines: string[] = [];
  for (let i = 0; i < ART_LINES; i++) {
    artLines.push(maskedArt[i] ?? "");
  }

  return (
    <Box
      flexDirection="column"
      borderStyle={selected ? "double" : "single"}
      borderColor={borderColor}
      width={CARD_WIDTH}
    >
      <Text color="gray" dimColor>{"???"}</Text>
      {artLines.map((line, i) => (
        <Text key={i} color="gray" dimColor>{visualPadOrTruncate(line, CARD_WIDTH - 2)}</Text>
      ))}
      <Text color="gray" dimColor>{"Undiscovered"}</Text>
    </Box>
  );
}

function DiscoveredCard({
  creature,
  level,
  catchCount,
  nextThreshold,
  selected,
}: {
  creature: CreatureDefinition;
  level: number;
  catchCount: number;
  nextThreshold: number | null;
  selected: boolean;
}): React.ReactElement {
  const color = getRarityColor(creature.rarity);
  const borderColor = useBorderColor(creature.rarity, selected);
  const icon = RARITY_ICONS[creature.rarity];
  const art = creature.art;

  // Normalize art to ART_LINES lines
  const artLines: string[] = [];
  for (let i = 0; i < ART_LINES; i++) {
    artLines.push(art[i] ?? "");
  }

  const inkInnerJsWidth = CARD_WIDTH - 2;
  const nameStr = creature.name;
  const lvlStr = `L${level}`;
  // Header: "Name     icon Ln"
  // Build the fixed suffix "icon Ln" first, then fill name + padding into remaining space.
  // Both JS-char length AND visual width must stay within inkInnerJsWidth so Ink doesn't overflow.
  const suffix = `${icon} ${lvlStr}`; // e.g. "⬜ L2" — JS len 4, visual 5
  const suffixJsLen = suffix.length;
  const suffixVisLen = stringWidth(suffix);
  const availableJsLen = inkInnerJsWidth - suffixJsLen; // JS chars available for name + padding
  const availableVisLen = inkInnerJsWidth - suffixVisLen; // visual cols available for name + padding
  const nameTruncated = visualPadOrTruncate(nameStr, Math.min(availableJsLen, availableVisLen));
  const headerLine = `${nameTruncated}${suffix}`;

  // Footer: "xN  progressbar N/M"
  const countStr = `x${catchCount}`;
  const barWidth = 6;
  const total = nextThreshold ?? catchCount;
  const ratio = total > 0 ? Math.min(1, catchCount / total) : 0;
  const filled = Math.floor(ratio * barWidth);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(barWidth - filled);
  const fracStr = nextThreshold ? `${catchCount}/${nextThreshold}` : `${catchCount}`;
  const footerLine = `${countStr} ${bar} ${fracStr}`;

  return (
    <Box
      flexDirection="column"
      borderStyle={selected ? "double" : "single"}
      borderColor={borderColor}
      width={CARD_WIDTH}
    >
      <Text bold color={color}>{headerLine}</Text>
      {artLines.map((line, i) => (
        <Text key={i} color={color}>{visualPadOrTruncate(line, CARD_WIDTH - 2)}</Text>
      ))}
      <Text>{" "}</Text>
      <Text dimColor>{footerLine}</Text>
    </Box>
  );
}

export function CreatureCard({
  creature,
  discovered,
  level,
  catchCount,
  nextThreshold,
  selected,
}: CreatureCardProps): React.ReactElement {
  if (!discovered) {
    return <UndiscoveredCard creature={creature} selected={selected} />;
  }

  return (
    <DiscoveredCard
      creature={creature}
      level={level}
      catchCount={catchCount}
      nextThreshold={nextThreshold}
      selected={selected}
    />
  );
}
