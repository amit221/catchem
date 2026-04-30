import { execSync } from "child_process";

function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, {
      encoding: "utf8",
      timeout: 5000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return null;
  }
}

export function isGitRepo(): boolean {
  return git("rev-parse --is-inside-work-tree") === "true";
}

export function getHeadSha(): string | null {
  return git("rev-parse HEAD");
}

export function getCommitCount(): number {
  const result = git("rev-list --count HEAD");
  return result ? parseInt(result, 10) : 0;
}

export function getRepoId(): string | null {
  const remote = git("remote get-url origin");
  if (remote) return remote;
  return git("rev-parse --show-toplevel");
}

export function getCommitStats(): { fixCommits: number; refactorCommits: number; biggestDiff: number } {
  const fixLog = git('log --oneline --all --grep="fix" -i');
  const fixCommits = fixLog ? fixLog.split("\n").filter(Boolean).length : 0;

  const refactorLog = git('log --oneline --all --grep="refactor" -i');
  const refactorCommits = refactorLog ? refactorLog.split("\n").filter(Boolean).length : 0;

  // Get biggest diff using git log --shortstat (single command, no per-commit calls)
  let biggestDiff = 0;
  const logOutput = git('log --pretty=format:"---" --shortstat -50');
  if (logOutput) {
    for (const block of logOutput.split("---").filter(Boolean)) {
      const insertions = block.match(/(\d+) insertion/);
      const deletions = block.match(/(\d+) deletion/);
      const lines = (insertions ? parseInt(insertions[1], 10) : 0) + (deletions ? parseInt(deletions[1], 10) : 0);
      biggestDiff = Math.max(biggestDiff, lines);
    }
  }

  return { fixCommits, refactorCommits, biggestDiff };
}
