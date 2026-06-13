import type { MockReviewPreview as MockReviewPreviewData } from "@/features/pull-request-review/types";

type MockReviewPreviewProps = {
  review: MockReviewPreviewData;
};

export function MockReviewPreview({ review }: MockReviewPreviewProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Mock Review Preview
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
