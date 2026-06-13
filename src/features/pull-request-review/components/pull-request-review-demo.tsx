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
  MockReviewPreview as MockReviewPreviewData,
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
  return (
    typeof value === "object" &&
    value !== null &&
    "review" in value &&
    typeof (value as { review: unknown }).review === "object" &&
    (value as { review: unknown }).review !== null
  );
}

export function PullRequestReviewDemo() {
  const [prUrl, setPrUrl] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [review, setReview] = useState<MockReviewPreviewData | null>(null);

  const isLoading = analysisState === "loading";

  function handleUrlChange(value: string) {
    setPrUrl(value);

    if (validationMessage) {
      setValidationMessage("");
    }

    if (review) {
      setReview(null);
      setAnalysisState("idle");
    }
  }

  async function handleAnalyze() {
    if (isLoading) {
      return;
    }

    setValidationMessage("");
    setReview(null);
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

      setReview(data.review);
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
      {analysisState === "complete" && review ? (
        <MockReviewPreview review={review} />
      ) : (
        <MockReviewEmptyState isLoading={isLoading} />
      )}
    </div>
  );
}
