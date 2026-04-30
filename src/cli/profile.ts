import { findUserGist, fetchGist, isGhAvailable } from "../social/gist.js";

export function showProfile(username: string): void {
  if (!isGhAvailable()) {
    console.log(
      "GitHub CLI (gh) is required to view profiles. Install it at https://cli.github.com",
    );
    return;
  }

  console.log(`Looking up ${username}'s CatchEm collection...`);

  const gistId = findUserGist(username);
  if (!gistId) {
    console.log(`No CatchEm collection found for @${username}`);
    return;
  }

  const content = fetchGist(gistId);
  if (!content) {
    console.log(`Could not fetch collection for @${username}`);
    return;
  }

  console.log(`\n${content}`);
}
