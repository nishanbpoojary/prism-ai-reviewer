"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createReviewMarkdownFilename,
  createReviewMarkdownReport,
  createReviewerCommentsMarkdown,
} from "@/features/pull-request-review/lib/review-report";
import type {
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview,
  PullRequestReviewSource,
} from "@/features/pull-request-review/types";

type ReviewActionsProps = {
  metadata: GitHubPullRequestMetadata;
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreview;
  reviewSource: PullRequestReviewSource;
};

type FeedbackMessage =
  | "Copied report"
  | "Copied PR description"
  | "Copied reviewer comments"
  | "Downloaded"
  | "Action failed";

const actionButtonClassName =
  "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 lg:px-2 lg:py-1 lg:text-[0.7rem]";

export function ReviewActions({
  metadata,
  pullRequest,
  review,
  reviewSource,
}: ReviewActionsProps) {
  const [feedbackMessage, setFeedbackMessage] =
    useState<FeedbackMessage | null>(null);
  const markdownReport = useMemo(
    () =>
      createReviewMarkdownReport({
        metadata,
        pullRequest,
        review,
        reviewSource,
      }),
    [metadata, pullRequest, review, reviewSource],
  );
  const filename = useMemo(
    () => createReviewMarkdownFilename({ pullRequest }),
    [pullRequest],
  );
  const reviewerComments = useMemo(
    () => createReviewerCommentsMarkdown(review),
    [review],
  );

  useEffect(() => {
    if (!feedbackMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage(null);
    }, 2200);

    return () => window.clearTimeout(timeoutId);
  }, [feedbackMessage]);

  async function copyText(text: string, successMessage: FeedbackMessage) {
    try {
      await navigator.clipboard.writeText(text);
      setFeedbackMessage(successMessage);
    } catch {
      setFeedbackMessage("Action failed");
    }
  }

  function downloadMarkdownReport() {
    try {
      const blob = new Blob([markdownReport], {
        type: "text/markdown;charset=utf-8",
      });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setFeedbackMessage("Downloaded");
    } catch {
      setFeedbackMessage("Action failed");
    }
  }

  return (
    <div className="mt-2">
      <div className="flex flex-wrap gap-1.5">
        <button
          className={actionButtonClassName}
          onClick={() => copyText(markdownReport, "Copied report")}
          type="button"
        >
          Copy report
        </button>
        {review.suggestedPrDescription ? (
          <button
            className={actionButtonClassName}
            onClick={() =>
              copyText(
                review.suggestedPrDescription ?? "",
                "Copied PR description",
              )
            }
            type="button"
          >
            Copy PR description
          </button>
        ) : null}
        {reviewerComments ? (
          <button
            className={actionButtonClassName}
            onClick={() =>
              copyText(reviewerComments, "Copied reviewer comments")
            }
            type="button"
          >
            Copy reviewer comments
          </button>
        ) : null}
        <button
          className={actionButtonClassName}
          onClick={downloadMarkdownReport}
          type="button"
        >
          Download .md
        </button>
      </div>

      <p
        aria-live="polite"
        className="mt-1 min-h-3 text-xs font-medium text-slate-500"
      >
        {feedbackMessage}
      </p>
    </div>
  );
}
