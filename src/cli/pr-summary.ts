import { StateManager } from "../core/state.js";
import { getCreature } from "../core/registry.js";
import { isGitRepo } from "../core/git.js";
import { execSync } from "child_process";

const RARITY_ICONS: Record<string, string> = {
  common: "⚪",
  uncommon: "🟢",
  rare: "🔵",
  epic: "🟣",
  legendary: "🟠",
  mythic: "🔴",
};

const RARITY_ORDER = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];

export function showPrSummary(): void {
  if (!isGitRepo()) {
    console.log("Not a git repo — run this from inside a git project.");
    return;
  }

  const mgr = new StateManager();
  const state = mgr.load();

  if (state.catchHistory.length === 0) {
    console.log("No catch history recorded yet. Keep coding!");
    return;
  }

  // Get commits on current branch vs main/master
  let baseBranch = "main";
  try {
    execSync("git rev-parse --verify main", { stdio: "pipe" });
  } catch {
    try {
      execSync("git rev-parse --verify master", { stdio: "pipe" });
      baseBranch = "master";
    } catch {
      console.log("Could not determine base branch (main/master).");
      return;
    }
  }

  // Get commit timestamps for current branch
  let branchStart: Date;
  try {
    const firstCommitTime = execSync(
      `git log ${baseBranch}..HEAD --reverse --format=%aI | head -1`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    ).trim();
    if (!firstCommitTime) {
      console.log("No commits on this branch yet.");
      return;
    }
    branchStart = new Date(firstCommitTime);
  } catch {
    console.log("Could not read branch history.");
    return;
  }

  // Filter catch history to this branch's timeframe
  const branchCatches = state.catchHistory.filter(
    (c) => new Date(c.timestamp) >= branchStart,
  );

  if (branchCatches.length === 0) {
    console.log("No catches during this branch's work.");
    return;
  }

  // Find the rarest catch
  const rarestCatch = branchCatches
    .map((c) => ({ ...c, def: getCreature(c.creatureId) }))
    .filter((c) => c.def)
    .sort(
      (a, b) =>
        RARITY_ORDER.indexOf(a.def!.rarity) - RARITY_ORDER.indexOf(b.def!.rarity),
    )[0];

  if (!rarestCatch || !rarestCatch.def) {
    console.log("No valid catches found for this branch.");
    return;
  }

  // Get username
  let username = "developer";
  try {
    username =
      execSync("git config user.name", {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim() || "developer";
  } catch {}

  const icon = RARITY_ICONS[rarestCatch.def.rarity] ?? "⚪";
  const imgUrl = `https://raw.githubusercontent.com/amit221/catchem-assets/main/images/${rarestCatch.creatureId}.png`;

  const markdown = `
> ![${rarestCatch.def.name}](${imgUrl})
>
> **${username} found ${rarestCatch.def.name}** ${icon} ${rarestCatch.def.rarity.charAt(0).toUpperCase() + rarestCatch.def.rarity.slice(1)}
>
> *${branchCatches.length} Bytling${branchCatches.length === 1 ? "" : "s"} caught during this PR*
>
> 🎮 *[CatchEm](https://github.com/amit221/catchem) — Catch Bytlings while you code*
`.trim();

  console.log("\nPaste this into your PR description:\n");
  console.log("---");
  console.log(markdown);
  console.log("---\n");
}
