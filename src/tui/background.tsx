import React from "react";
import { Text } from "ink";

export function patternFill(width: number, offset: number = 0): string {
  let line = "";
  for (let col = 0; col < width; col++) {
    line += (col + offset) % 2 === 0 ? "·" : " ";
  }
  return line;
}
