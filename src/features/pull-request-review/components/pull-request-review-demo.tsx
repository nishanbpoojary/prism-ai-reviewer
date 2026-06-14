"use client";

import { useState } from "react";
import { HeroSection } from "@/features/pull-request-review/components/hero-section";
import {
  MockReviewEmptyState,
  MockReviewPreview,
} from "@/features/pull-request-review/components/mock-review-preview";
import { featureCards } from "@/features/pull-request-review/data/mock-review-data";
import type {
  AnalyzePullRequestErrorResponse,
  AnalyzePullRequestSuccessResponse,
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview as MockReviewPreviewData,
  PullRequestReviewSource,
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

  const isLoading = analysisState === "loading";

  function handleUrlChange(value: string) {
    setPrUrl(value);

    if (validationMessage) {
      setValidationMessage("");
    }

    if (review) {
      setPullRequest(null);
      setMetadata(null);
      setReview(null);
      setReviewSource(null);
      setAnalysisState("idle");
    }
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
      setAnalysisState("complete");
    } catch {
      setValidationMessage("Could not reach the analysis service. Please try again.");
      setAnalysisState("idle");
    }
  }

  return (
    <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_0.86fr] lg:py-20">
      <HeroSection
        errorMessage={validationMessage}
        features={featureCards}
        isLoading={isLoading}
        onAnalyze={handleAnalyze}
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
