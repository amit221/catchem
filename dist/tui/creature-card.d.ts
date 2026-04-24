import React from "react";
import { CreatureDefinition, Rarity } from "../core/types";
type InkColor = "white" | "green" | "blue" | "magenta" | "yellow" | "red" | "cyan" | "gray";
export declare function getRarityColor(rarity: Rarity): InkColor;
interface CreatureCardProps {
    creature: CreatureDefinition;
    discovered: boolean;
    level: number;
    catchCount: number;
    nextThreshold: number | null;
    selected: boolean;
}
export declare function CreatureCard({ creature, discovered, level, catchCount, nextThreshold, selected, }: CreatureCardProps): React.ReactElement;
export {};
