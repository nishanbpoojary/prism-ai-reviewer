import type {
  GitHubPullRequestRef,
  MockReviewPreview as MockReviewPreviewData,
} from "@/features/pull-request-review/types";

type MockReviewPreviewProps = {
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreviewData;
};

export function MockReviewPreview({
  pullRequest,
  review,
}: MockReviewPreviewProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Mock Review Preview
          </p>
          <p className="mt-2 text-sm font-medium text-sky-700">
            Analyzing {pullRequest.owner}/{pullRequest.repo} #
            {pullRequest.pullNumber}
          </p>
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
