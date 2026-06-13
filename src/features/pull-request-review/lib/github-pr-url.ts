export const githubPullRequestUrlExample =
  "https://github.com/owner/repo/pull/123";

const githubPullRequestUrlPattern =
  /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+\/?$/;

export function getGithubPullRequestUrlError(prUrl: unknown) {
  if (typeof prUrl !== "string" || !prUrl.trim()) {
    return "Paste a GitHub pull request URL before analyzing.";
  }

  if (!githubPullRequestUrlPattern.test(prUrl.trim())) {
    return `Use a GitHub pull request URL like ${githubPullRequestUrlExample}.`;
  }

  return "";
}
