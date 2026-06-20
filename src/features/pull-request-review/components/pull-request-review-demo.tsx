"use client";

import { useEffect, useState } from "react";
import { HeroSection } from "@/features/pull-request-review/components/hero-section";
import {
  MockReviewEmptyState,
  MockReviewPreview,
} from "@/features/pull-request-review/components/mock-review-preview";
import { featureCards } from "@/features/pull-request-review/data/mock-review-data";
import {
  clearRecentReviewHistory,
  createRecentReviewHistoryItem,
  readRecentReviewHistory,
  saveRecentReviewHistoryItem,
} from "@/features/pull-request-review/lib/review-history";
import type {
  AnalyzePullRequestErrorResponse,
  AnalyzePullRequestSuccessResponse,
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview as MockReviewPreviewData,
  PullRequestReviewSource,
  RecentReviewHistoryItem,
} from "@/features/pull-request-review/types";

type AnalysisState = "idle" | "loading" | "complete";

function isErrorResponse(value: unknown): value is AnalyzePullRequestErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

function isSuccessResponse(
  value: unknown,
): value is AnalyzePullRequestSuccessResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const response = value as {
    metadata?: unknown;
    pullRequest?: unknown;
    review?: unknown;
    reviewSource?: unknown;
  };

  return (
    "metadata" in value &&
    "review" in value &&
    "pullRequest" in value &&
    "reviewSource" in value &&
    typeof response.metadata === "object" &&
    response.metadata !== null &&
    typeof response.review === "object" &&
    response.review !== null &&
    typeof response.pullRequest === "object" &&
    response.pullRequest !== null &&
    (response.reviewSource === "mock" ||
      response.reviewSource === "openai" ||
      response.reviewSource === "gemini")
  );
}

export function PullRequestReviewDemo() {
  const [prUrl, setPrUrl] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [pullRequest, setPullRequest] = useState<GitHubPullRequestRef | null>(
    null,
  );
  const [metadata, setMetadata] = useState<GitHubPullRequestMetadata | null>(
    null,
  );
  const [review, setReview] = useState<MockReviewPreviewData | null>(null);
  const [reviewSource, setReviewSource] =
    useState<PullRequestReviewSource | null>(null);
  const [reviewHistory, setReviewHistory] = useState<
    RecentReviewHistoryItem[]
  >([]);

  const isLoading = analysisState === "loading";

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setReviewHistory(readRecentReviewHistory());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function resetReviewResult() {
    setPullRequest(null);
    setMetadata(null);
    setReview(null);
    setReviewSource(null);
    setAnalysisState("idle");
  }

  function handleUrlChange(value: string) {
    setPrUrl(value);

    if (validationMessage) {
      setValidationMessage("");
    }

    if (review) {
      resetReviewResult();
    }
  }

  function handleHistoryItemSelect(value: string) {
    setPrUrl(value);
    setValidationMessage("");

    if (review) {
      resetReviewResult();
    }
  }

  function handleClearHistory() {
    setReviewHistory(clearRecentReviewHistory());
  }

  async function handleAnalyze() {
    if (isLoading) {
      return;
    }

    setValidationMessage("");
    setPullRequest(null);
    setMetadata(null);
    setReview(null);
    setReviewSource(null);
    setAnalysisState("loading");

    try {
      const response = await fetch("/api/analyze", {
        body: JSON.stringify({ prUrl }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data: unknown = await response.json();

      if (!response.ok) {
        setValidationMessage(
          isErrorResponse(data)
            ? data.error
            : "Something went wrong while analyzing the pull request.",
        );
        setAnalysisState("idle");
        return;
      }

      if (!isSuccessResponse(data)) {
        setValidationMessage("The analysis response was not in the expected format.");
        setAnalysisState("idle");
        return;
      }

      setPullRequest(data.pullRequest);
      setMetadata(data.metadata);
      setReview(data.review);
      setReviewSource(data.reviewSource);
      setReviewHistory(
        saveRecentReviewHistoryItem(
          createRecentReviewHistoryItem({
            metadata: data.metadata,
            pullRequest: data.pullRequest,
            review: data.review,
            reviewSource: data.reviewSource,
          }),
        ),
      );
      setAnalysisState("complete");
    } catch {
      setValidationMessage("Could not reach the analysis service. Please try again.");
      setAnalysisState("idle");
    }
  }

  return (
    <div className="grid items-start gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.88fr)] lg:gap-7 lg:py-12 xl:gap-9">
      <HeroSection
        errorMessage={validationMessage}
        features={featureCards}
        history={reviewHistory}
        isLoading={isLoading}
        onAnalyze={handleAnalyze}
        onClearHistory={handleClearHistory}
        onSelectHistoryItem={handleHistoryItemSelect}
        onUrlChange={handleUrlChange}
        prUrl={prUrl}
      />
      {analysisState === "complete" &&
      pullRequest &&
      metadata &&
      review &&
      reviewSource ? (
        <MockReviewPreview
          metadata={metadata}
          pullRequest={pullRequest}
          review={review}
          reviewSource={reviewSource}
        />
      ) : (
        <MockReviewEmptyState isLoading={isLoading} />
      )}
    </div>
  );
}
