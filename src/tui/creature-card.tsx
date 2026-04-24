import React from "react";
import { Box, Text } from "ink";
import { CreatureDefinition, Rarity, RARITY_LABELS } from "../core/types.js";
import { ProgressBar } from "./progress-bar.js";
import { useAnimation } from "./use-animation.js";

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

export const CARD_WIDTH = 22;
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

function padOrTruncate(s: string, len: number): string {
  if (s.length > len) return s.slice(0, len);
  return s + " ".repeat(len - s.length);
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
        <Text key={i} color="gray" dimColor>{padOrTruncate(line, CARD_WIDTH - 4)}</Text>
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
  const frameIndex = useAnimation(creature.frames?.length ?? 1);
  const color = getRarityColor(creature.rarity);
  const borderColor: InkColor = selected ? "cyan" : color;
  const icon = RARITY_ICONS[creature.rarity];
  const art = creature.frames?.[frameIndex] ?? creature.art;

  // Normalize art to ART_LINES lines
  const artLines: string[] = [];
  for (let i = 0; i < ART_LINES; i++) {
    artLines.push(art[i] ?? "");
  }

  const innerWidth = CARD_WIDTH - 4;
  const nameStr = creature.name;
  const lvlStr = `L${level}`;
  // Header: "Name     icon Ln"
  const headerPad = Math.max(0, innerWidth - nameStr.length - lvlStr.length - 3);
  const headerLine = `${nameStr}${" ".repeat(headerPad)}${icon} ${lvlStr}`;

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
        <Text key={i} color={color}>{padOrTruncate(line, innerWidth)}</Text>
      ))}
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
