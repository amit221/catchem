import { updateTracking } from "../../src/core/achievement-tracker";
import { AchievementTracking } from "../../src/core/types";

function emptyTracking(): AchievementTracking {
  return {
    totalCommits: 0, repos: [], fixCommits: 0, refactorCommits: 0, biggestDiff: 0,
    streakDays: 0, longestStreak: 0, lastActiveDate: "",
    toolUsage: {}, promptCount: 0, prsMerged: 0, prsReviewed: 0,
  };
}

describe("updateTracking", () => {
  describe("streak", () => {
    it("starts a streak on first day", () => {
      const tracking = emptyTracking();
      updateTracking(tracking, { today: "2026-04-30" });
      expect(tracking.streakDays).toBe(1);
      expect(tracking.lastActiveDate).toBe("2026-04-30");
    });

    it("increments streak on consecutive day", () => {
      const tracking = emptyTracking();
      tracking.lastActiveDate = "2026-04-29";
      tracking.streakDays = 5;
      updateTracking(tracking, { today: "2026-04-30" });
      expect(tracking.streakDays).toBe(6);
    });

    it("resets streak on skipped day", () => {
      const tracking = emptyTracking();
      tracking.lastActiveDate = "2026-04-28";
      tracking.streakDays = 5;
      updateTracking(tracking, { today: "2026-04-30" });
      expect(tracking.streakDays).toBe(1);
    });

    it("does not double-count same day", () => {
      const tracking = emptyTracking();
      tracking.lastActiveDate = "2026-04-30";
      tracking.streakDays = 3;
      updateTracking(tracking, { today: "2026-04-30" });
      expect(tracking.streakDays).toBe(3);
    });

    it("updates longest streak", () => {
      const tracking = emptyTracking();
      tracking.lastActiveDate = "2026-04-29";
      tracking.streakDays = 9;
      tracking.longestStreak = 9;
      updateTracking(tracking, { today: "2026-04-30" });
      expect(tracking.longestStreak).toBe(10);
    });
  });

  describe("git stats", () => {
    it("updates commit counts from git data", () => {
      const tracking = emptyTracking();
      updateTracking(tracking, {
        today: "2026-04-30",
        git: { commitCount: 42, fixCommits: 5, refactorCommits: 2, biggestDiff: 100, repoId: "repo-a" },
      });
      expect(tracking.totalCommits).toBe(42);
      expect(tracking.fixCommits).toBe(5);
      expect(tracking.refactorCommits).toBe(2);
      expect(tracking.repos).toContain("repo-a");
    });

    it("accumulates commits across repos", () => {
      const tracking = emptyTracking();
      tracking.totalCommits = 100;
      tracking.repos = ["repo-a"];
      updateTracking(tracking, {
        today: "2026-04-30",
        git: { commitCount: 50, fixCommits: 0, refactorCommits: 0, biggestDiff: 0, repoId: "repo-b" },
      });
      expect(tracking.totalCommits).toBe(150);
      expect(tracking.repos).toEqual(["repo-a", "repo-b"]);
    });

    it("does not double-count same repo", () => {
      const tracking = emptyTracking();
      tracking.totalCommits = 100;
      tracking.repos = ["repo-a"];
      updateTracking(tracking, {
        today: "2026-04-30",
        git: { commitCount: 110, fixCommits: 0, refactorCommits: 0, biggestDiff: 0, repoId: "repo-a" },
      });
      expect(tracking.totalCommits).toBe(110);
      expect(tracking.repos).toEqual(["repo-a"]);
    });
  });

  describe("tool usage", () => {
    it("increments tool counter", () => {
      const tracking = emptyTracking();
      updateTracking(tracking, { today: "2026-04-30", toolName: "Edit" });
      expect(tracking.toolUsage.Edit).toBe(1);
    });

    it("accumulates tool uses", () => {
      const tracking = emptyTracking();
      tracking.toolUsage.Edit = 5;
      updateTracking(tracking, { today: "2026-04-30", toolName: "Edit" });
      expect(tracking.toolUsage.Edit).toBe(6);
    });
  });

  describe("prompt count", () => {
    it("increments prompt count", () => {
      const tracking = emptyTracking();
      updateTracking(tracking, { today: "2026-04-30", isPrompt: true });
      expect(tracking.promptCount).toBe(1);
    });
  });
});
