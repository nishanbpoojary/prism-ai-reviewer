import { mockReviewPreview } from "@/features/pull-request-review/data/mock-review-data";
import { getGithubPullRequestUrlError } from "@/features/pull-request-review/lib/github-pr-url";
import type {
  AnalyzePullRequestErrorResponse,
  AnalyzePullRequestSuccessResponse,
} from "@/features/pull-request-review/types";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readPrUrl(body: unknown) {
  if (typeof body !== "object" || body === null || !("prUrl" in body)) {
    return undefined;
  }

  return (body as { prUrl?: unknown }).prUrl;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "Send a JSON body with a prUrl value.",
      } satisfies AnalyzePullRequestErrorResponse,
      { status: 400 },
    );
  }

  const prUrl = readPrUrl(body);
  const validationError = getGithubPullRequestUrlError(prUrl);

  if (validationError) {
    return Response.json(
      {
        error: validationError,
      } satisfies AnalyzePullRequestErrorResponse,
      { status: 400 },
    );
  }

  await wait(800);

  return Response.json({
    review: mockReviewPreview,
  } satisfies AnalyzePullRequestSuccessResponse);
}
