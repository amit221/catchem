import { isGitRepo, getCommitCount, getRepoId, getHeadSha, getCommitStats } from "../../src/core/git";

describe("git wrapper", () => {
  describe("isGitRepo", () => {
    it("returns true in a git repo", () => {
      expect(isGitRepo()).toBe(true);
    });
  });

  describe("getHeadSha", () => {
    it("returns a 40-char hex string", () => {
      const sha = getHeadSha();
      expect(sha).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  describe("getCommitCount", () => {
    it("returns a positive number", () => {
      const count = getCommitCount();
      expect(count).toBeGreaterThan(0);
    });
  });

  describe("getRepoId", () => {
    it("returns a non-empty string", () => {
      const id = getRepoId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe("string");
    });
  });

  describe("getCommitStats", () => {
    it("returns fix and refactor counts as numbers", () => {
      const stats = getCommitStats();
      expect(typeof stats.fixCommits).toBe("number");
      expect(typeof stats.refactorCommits).toBe("number");
      expect(typeof stats.biggestDiff).toBe("number");
    });
  });
});
