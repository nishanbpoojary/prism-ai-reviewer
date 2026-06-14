import { generatePullRequestReview } from "@/features/pull-request-review/lib/ai-reviewer";
import {
  fetchGitHubPullRequestMetadata,
  GitHubPullRequestFetchError,
} from "@/features/pull-request-review/lib/github-api";
import {
  getGithubPullRequestUrlError,
  parseGitHubPullRequestUrl,
} from "@/features/pull-request-review/lib/github-pr-url";
import type {
  AnalyzePullRequestErrorResponse,
  AnalyzePullRequestSuccessResponse,
} from "@/features/pull-request-review/types";

function readPrUrl(body: unknown) {
  if (typeof body !== "object" || body === null || !("prUrl" in body)) {
    return undefined;
  }

  return (body as { prUrl?: unknown }).prUrl;
}

function createErrorResponse(error: string, status: number) {
  return Response.json(
    {
      error,
    } satisfies AnalyzePullRequestErrorResponse,
    { status },
  );
}

function createChangedFilesSummary(
  metadata: AnalyzePullRequestSuccessResponse["metadata"],
) {
  if (metadata.files.length === 0) {
    return "No changed files returned by GitHub.";
  }

  return metadata.files
    .slice(0, 30)
    .map(
      (file) =>
        `- ${file.filename} (${file.status}, +${file.additions}, -${file.deletions}, ${file.changes} changes)`,
    )
    .join("\n");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse("Send a JSON body with a prUrl value.", 400);
  }

  const prUrl = readPrUrl(body);
  const validationError = getGithubPullRequestUrlError(prUrl);

  if (validationError) {
    return createErrorResponse(validationError, 400);
  }

  const pullRequest =
    typeof prUrl === "string" ? parseGitHubPullRequestUrl(prUrl) : null;

  if (!pullRequest) {
    return createErrorResponse(
      "Could not parse that GitHub pull request URL.",
      400,
    );
  }

  let metadata;

  try {
    metadata = await fetchGitHubPullRequestMetadata(pullRequest);
  } catch (error) {
    if (error instanceof GitHubPullRequestFetchError) {
      return createErrorResponse(error.message, error.status);
    }

    return createErrorResponse(
      "Could not analyze that pull request right now. Please try again.",
      502,
    );
  }

  const reviewResult = await generatePullRequestReview({
    pullRequest,
    metadata,
    changedFilesSummary: createChangedFilesSummary(metadata),
  });

  return Response.json({
    pullRequest,
    metadata,
    review: reviewResult.review,
    reviewSource: reviewResult.source,
  } satisfies AnalyzePullRequestSuccessResponse);
}
