import type { GitHubPullRequestRef } from "@/features/pull-request-review/types";

export const githubPullRequestUrlExample =
  "https://github.com/owner/repo/pull/123";

const githubPullRequestUrlPattern =
  /^https:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/pull\/(\d+)\/?$/;

export function parseGitHubPullRequestUrl(
  prUrl: string,
): GitHubPullRequestRef | null {
  const match = prUrl.trim().match(githubPullRequestUrlPattern);

  if (!match) {
    return null;
  }

  const [, owner, repo, pullNumberValue] = match;
  const pullNumber = Number(pullNumberValue);

  if (!Number.isSafeInteger(pullNumber)) {
    return null;
  }

  return {
    owner,
    repo,
    pullNumber,
    url: `https://github.com/${owner}/${repo}/pull/${pullNumber}`,
  };
}

export function getGithubPullRequestUrlError(prUrl: unknown) {
  if (typeof prUrl !== "string" || !prUrl.trim()) {
    return "Paste a GitHub pull request URL before analyzing.";
  }

  if (!parseGitHubPullRequestUrl(prUrl)) {
    return `Use a GitHub pull request URL like ${githubPullRequestUrlExample}.`;
  }

  return "";
}
