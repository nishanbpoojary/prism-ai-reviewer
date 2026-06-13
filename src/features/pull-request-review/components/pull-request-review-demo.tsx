"use client";

import { useRef, useState } from "react";
import { HeroSection } from "@/features/pull-request-review/components/hero-section";
import {
  MockReviewEmptyState,
  MockReviewPreview,
} from "@/features/pull-request-review/components/mock-review-preview";
import {
  featureCards,
  mockReviewPreview,
} from "@/features/pull-request-review/data/mock-review-data";

type AnalysisState = "idle" | "loading" | "complete";

const githubPullRequestUrlPattern =
  /^https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/pull\/\d+\/?$/;

function getValidationMessage(prUrl: string) {
  const trimmedUrl = prUrl.trim();

  if (!trimmedUrl) {
    return "Paste a GitHub pull request URL before analyzing.";
  }

  if (!githubPullRequestUrlPattern.test(trimmedUrl)) {
    return "Use a GitHub pull request URL like https://github.com/owner/repo/pull/123.";
  }

  return "";
}

export function PullRequestReviewDemo() {
  const [prUrl, setPrUrl] = useState("");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const analysisTimerRef = useRef<number | null>(null);

  const isLoading = analysisState === "loading";
  const hasCompletedAnalysis = analysisState === "complete";

  function handleUrlChange(value: string) {
    setPrUrl(value);

    if (analysisTimerRef.current) {
      window.clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }

    if (validationMessage) {
      setValidationMessage("");
    }

    if (hasCompletedAnalysis) {
      setAnalysisState("idle");
    }
  }

  function handleAnalyze() {
    if (isLoading) {
      return;
    }

    const message = getValidationMessage(prUrl);

    if (message) {
      setValidationMessage(message);
      setAnalysisState("idle");
      return;
    }

    setValidationMessage("");
    setAnalysisState("loading");

    if (analysisTimerRef.current) {
      window.clearTimeout(analysisTimerRef.current);
    }

    analysisTimerRef.current = window.setTimeout(() => {
      setAnalysisState("complete");
      analysisTimerRef.current = null;
    }, 1000);
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
      {hasCompletedAnalysis ? (
        <MockReviewPreview review={mockReviewPreview} />
      ) : (
        <MockReviewEmptyState isLoading={isLoading} />
      )}
    </div>
  );
}
