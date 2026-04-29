// scripts/lib/types.ts

export interface Creature {
  id: string;
  name: string;
  theme: string;
  rarity: string;
  description: string;
  art: string[];
}

export type StepStatus = "pending" | "completed";

export interface CreatureProgress {
  concept: StepStatus;
  sprite: StepStatus;
  animation: StepStatus;
}

export interface Manifest {
  [creatureId: string]: CreatureProgress;
}

export interface PipelineOptions {
  creature?: string;    // --creature <id>: process single creature
  from?: string;        // --from <id>: start from this creature
  auto: boolean;        // --auto: skip confirmations
  step?: "concept" | "sprite" | "animation";  // --step: run only this step
}
