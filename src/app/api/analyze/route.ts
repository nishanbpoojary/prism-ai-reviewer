import { mockReviewPreview } from "@/features/pull-request-review/data/mock-review-data";
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

  return Response.json({
    pullRequest,
    metadata,
    review: mockReviewPreview,
  } satisfies AnalyzePullRequestSuccessResponse);
}
