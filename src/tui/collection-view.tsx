import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { GameState } from "../core/types";
import { getAllCreatures } from "../core/registry";
import { getNextLevelThreshold } from "../core/leveling";
import { CreatureCard } from "./creature-card";

interface CollectionViewProps {
  state: GameState;
}

export function CollectionView({ state }: CollectionViewProps): React.ReactElement {
  const allCreatures = getAllCreatures();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const uniqueCount = Object.keys(state.creatures).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useInput((input: string, key: any) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(allCreatures.length - 1, prev + 1));
    }
    if (input === "q") {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="yellow">
          🎮 CatchEm Collection — {uniqueCount}/{allCreatures.length} discovered — {state.totalCatches} total catches
        </Text>
      </Box>
      <Text dimColor>↑/↓ navigate • q quit</Text>
      <Box flexDirection="column" marginTop={1}>
        {allCreatures.map((creature, i) => {
          const entry = state.creatures[creature.id];
          const discovered = !!entry;
          const level = entry?.level ?? 0;
          const catchCount = entry?.catchCount ?? 0;
          const nextThreshold = level > 0 ? getNextLevelThreshold(level) : null;

          return (
            <CreatureCard
              key={creature.id}
              creature={creature}
              discovered={discovered}
              level={level}
              catchCount={catchCount}
              nextThreshold={nextThreshold}
              selected={i === selectedIndex}
            />
          );
        })}
      </Box>
    </Box>
  );
}
