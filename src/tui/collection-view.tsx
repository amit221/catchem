import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { GameState, CreatureDefinition } from "../core/types.js";
import { getAllCreatures } from "../core/registry.js";
import { getNextLevelThreshold } from "../core/leveling.js";
import { CreatureCard, getRarityColor, CARD_WIDTH } from "./creature-card.js";
import { ProgressBar } from "./progress-bar.js";
import { useAnimation } from "./use-animation.js";

const COLS = 3;
// Each card row is ~9 terminal lines tall (5 art + 2 borders + header + footer).
// Reserve ~8 lines for the surrounding chrome (header box, nav hint, padding, scroll indicators).
// Compute visible rows dynamically so the component never exceeds the terminal height,
// which would cause Ink to re-render and make the header appear a second time at the bottom.
const CARD_ROW_HEIGHT = 10;
const CHROME_HEIGHT = 8;
const termRows = process.stdout.rows ?? 24;
const VISIBLE_ROWS = Math.max(1, Math.floor((termRows - CHROME_HEIGHT) / CARD_ROW_HEIGHT));

const THEME_LABELS: Record<string, string> = {
  "elemental-beasts": "Elemental Beasts",
  "galactic-warriors": "Galactic Warriors",
  "marvel-heroes": "Marvel Heroes",
  "legends-arena": "Legends Arena",
};

function formatThemeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme;
}

/** Chunk an array into groups of n */
function chunk<T>(arr: T[], n: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += n) {
    rows.push(arr.slice(i, i + n));
  }
  return rows;
}

interface DetailViewProps {
  creature: CreatureDefinition;
  state: GameState;
}

function DetailView({ creature, state }: DetailViewProps): React.ReactElement {
  const entry = state.creatures[creature.id];
  const frameIndex = useAnimation(creature.frames?.length ?? 1);
  const color = getRarityColor(creature.rarity);
  const art = creature.frames?.[frameIndex] ?? creature.art;
  const level = entry?.level ?? 0;
  const catchCount = entry?.catchCount ?? 0;
  const nextThreshold = level > 0 ? getNextLevelThreshold(level) : null;

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" alignItems="center">
        {art.map((line, i) => (
          <Text key={i} color={color}>{line}</Text>
        ))}
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold color={color}>{creature.name}</Text>
        <Text dimColor>Theme: {formatThemeLabel(creature.theme)}</Text>
        <Text dimColor>Rarity: {creature.rarity.charAt(0).toUpperCase() + creature.rarity.slice(1)}</Text>
        <Text dimColor>Level: {level}  ·  Catches: {catchCount}</Text>
        {entry && <Text dimColor>First caught: {entry.firstCaught.slice(0, 10)}</Text>}
        {entry && <Text dimColor>Last caught:  {entry.lastCaught.slice(0, 10)}</Text>}
        <Text italic color="gray">{creature.description}</Text>
        {nextThreshold && (
          <Box marginTop={1}>
            <ProgressBar current={catchCount} total={nextThreshold} width={20} />
            <Text dimColor> {catchCount}/{nextThreshold}</Text>
          </Box>
        )}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Press Escape or Q to go back</Text>
      </Box>
    </Box>
  );
}

interface CollectionViewProps {
  state: GameState;
}

export function CollectionView({ state }: CollectionViewProps): React.ReactElement {
  const allCreatures = getAllCreatures();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [detailCreature, setDetailCreature] = useState<CreatureDefinition | null>(null);
  const uniqueCount = Object.keys(state.creatures).length;

  const rows = chunk(allCreatures, COLS);
  const totalRows = rows.length;

  const selectedRow = Math.floor(selectedIndex / COLS);
  const selectedCol = selectedIndex % COLS;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useInput((input: string, key: any) => {
    if (detailCreature) {
      if (key.escape || input === "q") {
        setDetailCreature(null);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => {
        const r = Math.floor(prev / COLS);
        const c = prev % COLS;
        if (r <= 0) return prev;
        const newRow = r - 1;
        const newIdx = newRow * COLS + Math.min(c, rows[newRow].length - 1);
        return newIdx;
      });
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => {
        const r = Math.floor(prev / COLS);
        const c = prev % COLS;
        if (r >= totalRows - 1) return prev;
        const newRow = r + 1;
        const newIdx = newRow * COLS + Math.min(c, rows[newRow].length - 1);
        return newIdx;
      });
    }
    if (key.leftArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.rightArrow) {
      setSelectedIndex((prev) => Math.min(allCreatures.length - 1, prev + 1));
    }
    if (key.return) {
      const creature = allCreatures[selectedIndex];
      if (state.creatures[creature.id]) {
        setDetailCreature(creature);
      }
    }
    if (input === "q") {
      process.exit(0);
    }
  });

  // Detail view mode
  if (detailCreature) {
    return <DetailView creature={detailCreature} state={state} />;
  }

  // Compute visible row window: show VISIBLE_ROWS rows centered around selectedRow
  const halfRows = Math.floor(VISIBLE_ROWS / 2);
  let startRow = Math.max(0, selectedRow - halfRows);
  const endRow = Math.min(totalRows - 1, startRow + VISIBLE_ROWS - 1);
  startRow = Math.max(0, endRow - VISIBLE_ROWS + 1);

  const hasAbove = startRow > 0;
  const hasBelow = endRow < totalRows - 1;

  const visibleRows = rows.slice(startRow, endRow + 1);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={2}>
        <Text bold color="yellow">
          CatchEm    {uniqueCount}/{allCreatures.length} discovered
        </Text>
        <Text dimColor>
          {"   "}Total catches: {state.totalCatches}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>{"←/→ select · ↑/↓ scroll rows · Enter detail · q quit"}</Text>
      </Box>

      {/* Scroll indicator top */}
      {hasAbove && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="gray">{"▲ more above"}</Text>
        </Box>
      )}

      {/* Card grid */}
      <Box flexDirection="column" marginTop={hasAbove ? 0 : 1}>
        {visibleRows.map((row, rowIdx) => {
          const actualRowIdx = startRow + rowIdx;
          return (
            <Box key={actualRowIdx} flexDirection="row" justifyContent="center">
              {row.map((creature, colIdx) => {
                const creatureGlobalIdx = actualRowIdx * COLS + colIdx;
                const entry = state.creatures[creature.id];
                const discovered = !!entry;
                const level = entry?.level ?? 0;
                const catchCount = entry?.catchCount ?? 0;
                const nextThreshold = level > 0 ? getNextLevelThreshold(level) : null;

                return (
                  <Box key={creature.id} marginRight={colIdx < row.length - 1 ? 1 : 0}>
                    <CreatureCard
                      creature={creature}
                      discovered={discovered}
                      level={level}
                      catchCount={catchCount}
                      nextThreshold={nextThreshold}
                      selected={creatureGlobalIdx === selectedIndex}
                    />
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Scroll indicator bottom */}
      {hasBelow && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="cyan" bold>{`  ↓↓↓ Scroll down for more creatures (${totalRows - endRow - 1} more rows) ↓↓↓`}</Text>
        </Box>
      )}
    </Box>
  );
}
