import type {
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview as MockReviewPreviewData,
  PullRequestReviewSource,
} from "@/features/pull-request-review/types";

type MockReviewPreviewProps = {
  metadata: GitHubPullRequestMetadata;
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreviewData;
  reviewSource: PullRequestReviewSource;
};

export function MockReviewPreview({
  metadata,
  pullRequest,
  review,
  reviewSource,
}: MockReviewPreviewProps) {
  const reviewSourceLabels: Record<PullRequestReviewSource, string> = {
    openai: "OpenAI",
    gemini: "Gemini",
    mock: "Mock fallback",
  };

  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Mock Review Preview
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Review source: {reviewSourceLabels[reviewSource]}
          </p>
          <p className="mt-2 text-sm font-medium text-sky-700">
            Analyzing {pullRequest.owner}/{pullRequest.repo} #
            {pullRequest.pullNumber}
          </p>
          <h2 className="mt-3 max-w-xl text-xl font-semibold leading-7 text-slate-950">
            {metadata.title}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            by {metadata.author} | {metadata.sourceBranch} -&gt;{" "}
            {metadata.targetBranch}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              {metadata.changedFiles} changed files
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              +{metadata.additions}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
              -{metadata.deletions}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Risk Score: {review.riskScore} / 100
          </h2>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
          {review.riskLevel}
        </span>
      </div>

      <div className="py-5">
        <h3 className="text-sm font-semibold uppercase text-slate-500">
          Summary
        </h3>
        <p className="mt-3 text-base leading-7 text-slate-700">
          {review.summary}
        </p>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-semibold uppercase text-slate-500">
          Findings
        </h3>
        <ul className="mt-4 space-y-3">
          {review.findings.map((finding) => (
            <li
              className="flex gap-3 text-sm leading-6 text-slate-700"
              key={finding.id}
            >
              <span className="mt-2 size-2 rounded-full bg-sky-500" />
              <span>{finding.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {review.testCases?.length ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold uppercase text-slate-500">
            Test Cases
          </h3>
          <ul className="mt-4 space-y-3">
            {review.testCases.map((testCase) => (
              <li
                className="flex gap-3 text-sm leading-6 text-slate-700"
                key={testCase}
              >
                <span className="mt-2 size-2 rounded-full bg-emerald-500" />
                <span>{testCase}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {review.suggestedPrDescription ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold uppercase text-slate-500">
            Suggested PR Description
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            {review.suggestedPrDescription}
          </p>
        </div>
      ) : null}

      {review.reviewerComments?.length ? (
        <div className="mt-5 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold uppercase text-slate-500">
            Reviewer Comments
          </h3>
          <ul className="mt-4 space-y-3">
            {review.reviewerComments.map((comment) => (
              <li
                className="flex gap-3 text-sm leading-6 text-slate-700"
                key={comment}
              >
                <span className="mt-2 size-2 rounded-full bg-violet-500" />
                <span>{comment}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}

type MockReviewEmptyStateProps = {
  isLoading: boolean;
};

export function MockReviewEmptyState({ isLoading }: MockReviewEmptyStateProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex min-h-80 flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950 shadow-sm">
          PR
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-slate-950">
          {isLoading ? "Analyzing pull request..." : "Ready for review"}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
          {isLoading
            ? "Building a mock summary, risk score, findings, and test plan."
            : "Paste a GitHub pull request URL to preview the AI review output."}
        </p>
        <div className="mx-auto mt-6 h-2 w-40 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full bg-sky-500 ${
              isLoading ? "w-3/4" : "w-1/4"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
