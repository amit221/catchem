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

/** Compact one-line summary for unselected creatures */
function CompactLine({
  creature,
  discovered,
  level,
  catchCount,
  selected,
}: {
  creature: CreatureDefinition;
  discovered: boolean;
  level: number;
  catchCount: number;
  selected: boolean;
}): React.ReactElement {
  const color = getRarityColor(creature.rarity);
  const pointer = selected ? "▸ " : "  ";

  if (!discovered) {
    return (
      <Text>
        <Text dimColor>{pointer}</Text>
        <Text color="gray">{"???".padEnd(16)}{"░░░░░".padEnd(6)}{"Undiscovered"}</Text>
      </Text>
    );
  }

  const name = creature.name.padEnd(16);
  const lvl = `Lv.${level}`.padEnd(6);
  const count = `x${catchCount}`.padEnd(6);
  const icon = RARITY_ICONS[creature.rarity];

  return (
    <Text>
      <Text color={selected ? "cyan" : undefined}>{pointer}</Text>
      <Text bold color={color}>{name}</Text>
      <Text dimColor>{lvl}</Text>
      <Text dimColor>{count}</Text>
      <Text>{icon}</Text>
    </Text>
  );
}

/** Expanded card shown for the selected creature */
function ExpandedCard({
  creature,
  discovered,
  level,
  catchCount,
  nextThreshold,
}: {
  creature: CreatureDefinition;
  discovered: boolean;
  level: number;
  catchCount: number;
  nextThreshold: number | null;
}): React.ReactElement {
  const frameIndex = useAnimation(creature.frames?.length ?? 1);
  const color = getRarityColor(creature.rarity);
  const rarityLabel = RARITY_LABELS[creature.rarity];

  if (!discovered) {
    const maskedArt = creature.art.map((line) => line.replace(/[^\s]/g, "░"));
    return (
      <Box flexDirection="column" marginLeft={4}>
        {maskedArt.map((line, i) => (
          <Text key={i} color="gray">{line}</Text>
        ))}
        <Text color="gray">??? — Undiscovered</Text>
      </Box>
    );
  }

  const art = creature.frames?.[frameIndex] ?? creature.art;
  const remaining = nextThreshold ? nextThreshold - catchCount : 0;

  return (
    <Box flexDirection="column" marginLeft={4}>
      {art.map((line, i) => (
        <Text key={i} color={color}>{line}</Text>
      ))}
      <Text bold color={color}>
        {creature.name}
      </Text>
      <Text dimColor>
        {rarityLabel} · Lv.{level} · x{catchCount}
      </Text>
      {nextThreshold && (
        <>
          <Text dimColor>Next: {remaining} more catches</Text>
          <Box>
            <ProgressBar current={catchCount} total={nextThreshold} />
            <Text dimColor> {catchCount}/{nextThreshold}</Text>
          </Box>
        </>
      )}
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
  return (
    <Box flexDirection="column">
      <CompactLine
        creature={creature}
        discovered={discovered}
        level={level}
        catchCount={catchCount}
        selected={selected}
      />
      {selected && (
        <ExpandedCard
          creature={creature}
          discovered={discovered}
          level={level}
          catchCount={catchCount}
          nextThreshold={nextThreshold}
        />
      )}
    </Box>
  );
}
