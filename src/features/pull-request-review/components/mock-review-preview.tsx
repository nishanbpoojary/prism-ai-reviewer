"use client";

import { useId, useState, type ReactNode } from "react";
import { ReviewActions } from "@/features/pull-request-review/components/review-actions";
import { reviewSourceLabels } from "@/features/pull-request-review/lib/review-report";
import type {
  ChecklistStatus,
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewFinding,
  MockReviewPreview as MockReviewPreviewData,
  PullRequestReviewSource,
  ReviewChecklistItem,
  RiskLevel,
} from "@/features/pull-request-review/types";

type MockReviewPreviewProps = {
  metadata: GitHubPullRequestMetadata;
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreviewData;
  reviewSource: PullRequestReviewSource;
};

type ReviewListProps = {
  items: string[];
  markerClassName?: string;
};

const riskLevelClasses: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

const checklistStatusLabels: Record<ChecklistStatus, string> = {
  pass: "Pass",
  review: "Review",
  not_applicable: "Not applicable",
};

const checklistStatusClasses: Record<ChecklistStatus, string> = {
  pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  not_applicable: "border-slate-200 bg-slate-50 text-slate-600",
};

function ReviewSection({
  children,
  title,
}: Readonly<{
  children: ReactNode;
  title: string;
}>) {
  return (
    <section className="border-t border-slate-200 px-5 py-3 sm:px-6 lg:px-5 lg:py-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ChecklistStatusBadge({ status }: { status: ChecklistStatus }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold ${checklistStatusClasses[status]}`}
    >
      {checklistStatusLabels[status]}
    </span>
  );
}

function ReviewChecklist({
  items,
}: {
  items: ReviewChecklistItem[] | undefined;
}) {
  if (!items?.length) {
    return (
      <p className="mt-2 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
        Not available for this earlier review.
      </p>
    );
  }

  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          key={`${item.status}-${item.title}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              {item.title}
            </p>
            <ChecklistStatusBadge status={item.status} />
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            {item.detail}
          </p>
        </li>
      ))}
    </ul>
  );
}

function CollapsibleReviewSection({
  children,
  defaultExpanded = false,
  title,
}: Readonly<{
  children: ReactNode;
  defaultExpanded?: boolean;
  title: string;
}>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();

  return (
    <section className="border-t border-slate-200 px-5 py-2.5 sm:px-6 lg:px-5 lg:py-2">
      <button
        aria-controls={contentId}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        onClick={() => setIsExpanded((currentValue) => !currentValue)}
        type="button"
      >
        <span>{title}</span>
        <span className="text-[0.7rem] normal-case tracking-normal text-slate-500">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>
      <div hidden={!isExpanded} id={contentId}>
        {children}
      </div>
    </section>
  );
}

function ReviewList({
  items,
  markerClassName = "bg-sky-500",
}: ReviewListProps) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((item) => (
        <li className="flex gap-2.5 text-sm leading-5 text-slate-700" key={item}>
          <span
            aria-hidden="true"
            className={`mt-1.5 size-2 shrink-0 rounded-full ${markerClassName}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FindingsList({ findings }: { findings: MockReviewFinding[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {findings.map((finding) => (
        <li
          className="flex gap-2.5 text-sm leading-5 text-slate-700"
          key={finding.id}
        >
          <span
            aria-hidden="true"
            className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500"
          />
          <span>{finding.text}</span>
        </li>
      ))}
    </ul>
  );
}

function StatPill({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
      <span className="text-slate-500">{label}</span>
      <span>{value}</span>
    </span>
  );
}

export function MockReviewPreview({
  metadata,
  pullRequest,
  review,
  reviewSource,
}: MockReviewPreviewProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
      <div className="px-5 py-4 sm:px-6 lg:px-5 lg:py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            AI review result
          </p>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Review source: {reviewSourceLabels[reviewSource]}
          </span>
        </div>

        <p className="mt-2 text-sm font-semibold text-sky-700">
          {pullRequest.owner}/{pullRequest.repo} #{pullRequest.pullNumber}
        </p>
        <h2 className="mt-1.5 text-balance text-lg font-semibold leading-6 text-slate-950 sm:text-xl sm:leading-7">
          {metadata.title}
        </h2>

        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">Author:</span>{" "}
            {metadata.author}
          </p>
          <p>
            <span className="font-medium text-slate-800">Branches:</span>{" "}
            <span className="font-medium text-slate-700">
              {metadata.sourceBranch}
            </span>{" "}
            <span aria-label="to">-&gt;</span>{" "}
            <span className="font-medium text-slate-700">
              {metadata.targetBranch}
            </span>
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <StatPill
            label="Files"
            value={metadata.changedFiles.toLocaleString()}
          />
          <StatPill label="Added" value={`+${metadata.additions}`} />
          <StatPill label="Deleted" value={`-${metadata.deletions}`} />
        </div>

        <ReviewActions
          metadata={metadata}
          pullRequest={pullRequest}
          review={review}
          reviewSource={reviewSource}
        />
      </div>

      <section className="border-t border-slate-200 bg-slate-50 px-5 py-2.5 sm:px-6 lg:px-5 lg:py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Risk assessment
            </h3>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              {review.riskScore}
              <span className="text-xl font-medium text-slate-500">/100</span>
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${riskLevelClasses[review.riskLevel]}`}
          >
            {review.riskLevel} risk
          </span>
        </div>
        <div
          aria-label={`Risk score ${review.riskScore} out of 100`}
          className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
          role="img"
        >
          <div
            className="h-full rounded-full bg-slate-900"
            style={{ width: `${review.riskScore}%` }}
          />
        </div>
      </section>

      <ReviewSection title="Summary">
        <p className="mt-2 max-w-prose text-sm leading-5 text-slate-700">
          {review.summary}
        </p>
      </ReviewSection>

      <CollapsibleReviewSection defaultExpanded title="Accessibility checklist">
        <ReviewChecklist items={review.accessibilityChecklist} />
      </CollapsibleReviewSection>

      <CollapsibleReviewSection defaultExpanded title="Security checklist">
        <ReviewChecklist items={review.securityChecklist} />
      </CollapsibleReviewSection>

      <CollapsibleReviewSection defaultExpanded title="Findings">
        <FindingsList findings={review.findings} />
      </CollapsibleReviewSection>

      {review.testCases?.length ? (
        <CollapsibleReviewSection title="Test cases">
          <ReviewList
            items={review.testCases}
            markerClassName="bg-emerald-500"
          />
        </CollapsibleReviewSection>
      ) : null}

      {review.suggestedPrDescription ? (
        <CollapsibleReviewSection title="Suggested PR description">
          <div className="mt-2 border-l-4 border-slate-300 bg-slate-50 px-3 py-2">
            <p className="text-sm leading-5 text-slate-700">
              {review.suggestedPrDescription}
            </p>
          </div>
        </CollapsibleReviewSection>
      ) : null}

      {review.reviewerComments?.length ? (
        <CollapsibleReviewSection title="Reviewer comments">
          <ReviewList
            items={review.reviewerComments}
            markerClassName="bg-violet-500"
          />
        </CollapsibleReviewSection>
      ) : null}
    </aside>
  );
}

type MockReviewEmptyStateProps = {
  isLoading: boolean;
};

export function MockReviewEmptyState({ isLoading }: MockReviewEmptyStateProps) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70">
      <div className="flex min-h-72 flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
        <div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-950 shadow-sm">
          PR
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">
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
