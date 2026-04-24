import React from "react";
import { Text } from "ink";

interface ProgressBarProps {
  current: number;
  total: number;
  width?: number;
}

export function ProgressBar({ current, total, width = 10 }: ProgressBarProps): React.ReactElement {
  const ratio = total > 0 ? Math.min(1, current / total) : 0;
  const filled = Math.floor(ratio * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return <Text>{bar}</Text>;
}
