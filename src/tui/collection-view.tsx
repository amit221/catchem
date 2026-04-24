import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { GameState, CreatureDefinition } from "../core/types.js";
import { getAllCreatures } from "../core/registry.js";
import { getNextLevelThreshold } from "../core/leveling.js";
import { CreatureCard, getRarityColor } from "./creature-card.js";
import { ProgressBar } from "./progress-bar.js";
import { useAnimation } from "./use-animation.js";

const VIEWPORT_SIZE = 5;

const THEME_LABELS: Record<string, string> = {
  "elemental-beasts": "Elemental Beasts",
  "galactic-warriors": "Galactic Warriors",
  "marvel-heroes": "Marvel Heroes",
  "legends-arena": "Legends Arena",
};

function formatThemeLabel(theme: string): string {
  return THEME_LABELS[theme] ?? theme;
}

/** Items in the flat list: either a theme header or a creature row */
type ListItem =
  | { kind: "theme"; theme: string }
  | { kind: "creature"; creature: CreatureDefinition; index: number };

function buildList(creatures: CreatureDefinition[]): ListItem[] {
  const items: ListItem[] = [];
  let currentTheme = "";
  let idx = 0;
  for (const c of creatures) {
    if (c.theme !== currentTheme) {
      currentTheme = c.theme;
      items.push({ kind: "theme", theme: currentTheme });
    }
    items.push({ kind: "creature", creature: c, index: idx });
    idx++;
  }
  return items;
}

/** Map a creature index to the position of that creature in the flat list */
function creatureIndexToListPos(list: ListItem[], creatureIdx: number): number {
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (item.kind === "creature" && item.index === creatureIdx) return i;
  }
  return 0;
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

  const list = buildList(allCreatures);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useInput((input: string, key: any) => {
    if (detailCreature) {
      if (key.escape || input === "q") {
        setDetailCreature(null);
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
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

  // Compute viewport window around selected creature in flat list
  const selectedListPos = creatureIndexToListPos(list, selectedIndex);
  const half = Math.floor(VIEWPORT_SIZE / 2);

  // We need to show VIEWPORT_SIZE creature rows (plus any theme headers in between).
  // Find creature rows to display centered on selectedIndex.
  const startCreature = Math.max(0, selectedIndex - half);
  const endCreature = Math.min(allCreatures.length - 1, startCreature + VIEWPORT_SIZE - 1);
  const adjustedStart = Math.max(0, endCreature - VIEWPORT_SIZE + 1);

  // Gather the list items in the viewport
  const viewportItems: ListItem[] = [];
  const startListPos = creatureIndexToListPos(list, adjustedStart);

  // Include the theme header just before the first visible creature if it exists
  if (startListPos > 0 && list[startListPos - 1].kind === "theme") {
    viewportItems.push(list[startListPos - 1]);
  }

  let seenCreatures = 0;
  for (let i = startListPos; i < list.length && seenCreatures < VIEWPORT_SIZE; i++) {
    const item = list[i];
    viewportItems.push(item);
    if (item.kind === "creature") seenCreatures++;
  }

  const hasAbove = adjustedStart > 0;
  const hasBelow = endCreature < allCreatures.length - 1;

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
        <Text dimColor>{"↑/↓ navigate · Enter detail · q quit"}</Text>
      </Box>

      {/* Scroll indicator top */}
      {hasAbove && (
        <Box justifyContent="center" marginTop={1}>
          <Text color="gray">{"▲ more above"}</Text>
        </Box>
      )}

      {/* Viewport */}
      <Box flexDirection="column" marginTop={hasAbove ? 0 : 1}>
        {viewportItems.map((item, i) => {
          if (item.kind === "theme") {
            const label = formatThemeLabel(item.theme);
            const line = `── ${label} ${"─".repeat(Math.max(0, 34 - label.length))}`;
            return (
              <Text key={`theme-${item.theme}`} dimColor>{line}</Text>
            );
          }

          const creature = item.creature;
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
              selected={item.index === selectedIndex}
            />
          );
        })}
      </Box>

      {/* Scroll indicator bottom */}
      {hasBelow && (
        <Box justifyContent="center">
          <Text color="gray">{"▼ more below"}</Text>
        </Box>
      )}
    </Box>
  );
}
