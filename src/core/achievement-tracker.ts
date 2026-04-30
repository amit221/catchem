import { AchievementTracking } from "./types.js";

export interface TrackingInput {
  today: string;  // YYYY-MM-DD
  git?: {
    commitCount: number;
    fixCommits: number;
    refactorCommits: number;
    biggestDiff: number;
    repoId: string;
  };
  toolName?: string;
  isPrompt?: boolean;
}

export function updateTracking(tracking: AchievementTracking, input: TrackingInput): void {
  // Prompt count
  if (input.isPrompt) {
    tracking.promptCount += 1;
  }

  // Streak
  if (input.today !== tracking.lastActiveDate) {
    if (isConsecutiveDay(tracking.lastActiveDate, input.today)) {
      tracking.streakDays += 1;
    } else if (tracking.lastActiveDate === "") {
      tracking.streakDays = 1;
    } else {
      tracking.streakDays = 1;
    }
    tracking.lastActiveDate = input.today;
    tracking.longestStreak = Math.max(tracking.longestStreak, tracking.streakDays);
  }

  // Git stats
  if (input.git) {
    const { commitCount, fixCommits, refactorCommits, repoId } = input.git;
    const repoIndex = tracking.repos.indexOf(repoId);
    if (repoIndex === -1) {
      tracking.repos.push(repoId);
      tracking.totalCommits += commitCount;
    } else {
      tracking.totalCommits = Math.max(tracking.totalCommits, commitCount);
    }
    tracking.fixCommits = Math.max(tracking.fixCommits, fixCommits);
    tracking.refactorCommits = Math.max(tracking.refactorCommits, refactorCommits);
  }

  // Tool usage
  if (input.toolName) {
    tracking.toolUsage[input.toolName] = (tracking.toolUsage[input.toolName] || 0) + 1;
  }
}

function isConsecutiveDay(prev: string, current: string): boolean {
  if (!prev) return false;
  const prevDate = new Date(prev + "T00:00:00");
  const currDate = new Date(current + "T00:00:00");
  const diffMs = currDate.getTime() - prevDate.getTime();
  return diffMs === 86400000;
}
