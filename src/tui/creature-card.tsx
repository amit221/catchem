import React from "react";
import { Box, Text } from "ink";
import { CreatureDefinition, RARITY_LABELS } from "../core/types";
import { ProgressBar } from "./progress-bar";
import { useAnimation } from "./use-animation";

interface CreatureCardProps {
  creature: CreatureDefinition;
  discovered: boolean;
  level: number;
  catchCount: number;
  nextThreshold: number | null;
  selected: boolean;
}

export function CreatureCard({
  creature,
  discovered,
  level,
  catchCount,
  nextThreshold,
  selected,
}: CreatureCardProps): React.ReactElement {
  const frameIndex = useAnimation(creature.frames?.length ?? 1);
  const art = discovered
    ? (creature.frames?.[frameIndex] ?? creature.art)
    : creature.art.map((line) => line.replace(/[^\s]/g, "░"));

  const borderColor = selected ? "cyan" : undefined;

  if (!discovered) {
    return (
      <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
        <Text color="gray">??? — Undiscovered</Text>
        {art.map((line, i) => (
          <Text key={i} color="gray">{line}</Text>
        ))}
      </Box>
    );
  }

  const rarityLabel = RARITY_LABELS[creature.rarity];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      <Text bold color={selected ? "cyan" : "white"}>
        {creature.name} <Text dimColor>Lv.{level}</Text> <Text dimColor>x{catchCount}</Text>
      </Text>
      <Text dimColor>{rarityLabel}</Text>
      {art.map((line, i) => (
        <Text key={i}>{line}</Text>
      ))}
      {nextThreshold && (
        <Box>
          <ProgressBar current={catchCount} total={nextThreshold} />
          <Text dimColor> {catchCount}/{nextThreshold}</Text>
        </Box>
      )}
    </Box>
  );
}
