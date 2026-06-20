import { reviewSourceLabels } from "@/features/pull-request-review/lib/review-report";
import type {
  RecentReviewHistoryItem,
  RiskLevel,
} from "@/features/pull-request-review/types";

type ReviewHistoryProps = {
  history: RecentReviewHistoryItem[];
  onClearHistory: () => void;
  onSelectReview: (prUrl: string) => void;
};

const riskLevelClasses: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

function formatAnalyzedTime(value: string) {
  const analyzedAt = new Date(value);

  if (Number.isNaN(analyzedAt.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(analyzedAt);
}

export function ReviewHistory({
  history,
  onClearHistory,
  onSelectReview,
}: ReviewHistoryProps) {
  if (!history.length) {
    return null;
  }

  return (
    <section className="mt-4 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-950">
          Recent reviews
        </h2>
        <button
          className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
          onClick={onClearHistory}
          type="button"
        >
          Clear history
        </button>
      </div>

      <div className="mt-2 grid gap-2 lg:grid-cols-2">
        {history.map((item) => (
          <button
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
            key={`${item.repositoryName}-${item.prNumber}`}
            onClick={() => onSelectReview(item.prUrl)}
            type="button"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-sky-700">
                {item.repositoryName} #{item.prNumber}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${riskLevelClasses[item.riskLevel]}`}
              >
                {item.riskLevel} {item.riskScore}/100
              </span>
            </div>
            <p className="mt-1 line-clamp-1 text-sm font-medium leading-5 text-slate-900">
              {item.prTitle}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{reviewSourceLabels[item.reviewSource]}</span>
              <span aria-hidden="true">&middot;</span>
              <span>{formatAnalyzedTime(item.analyzedAt)}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
