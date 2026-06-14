import "server-only";

import OpenAI from "openai";
import { mockReviewPreview } from "@/features/pull-request-review/data/mock-review-data";
import { getOpenAiApiKey } from "@/features/pull-request-review/lib/env";
import type {
  GeneratePullRequestReviewInput,
  GeneratePullRequestReviewResult,
  MockReviewFinding,
  MockReviewPreview,
} from "@/features/pull-request-review/types";

const openAiReviewModel = "gpt-5.5";
const maxSummaryLength = 140;
const maxFindingLength = 120;

const pullRequestReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["riskScore", "riskLevel", "summary", "findings"],
  properties: {
    riskScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Overall risk score from 0 to 100.",
    },
    riskLevel: {
      type: "string",
      enum: ["Low", "Medium", "High"],
    },
    summary: {
      type: "string",
      maxLength: maxSummaryLength,
    },
    findings: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text"],
        properties: {
          id: {
            type: "string",
            pattern: "^[a-z0-9-]+$",
          },
          text: {
            type: "string",
            maxLength: maxFindingLength,
          },
        },
      },
    },
  },
} as const;

function createMockReviewResult(): GeneratePullRequestReviewResult {
  return {
    review: mockReviewPreview,
    source: "mock",
  };
}

function isRiskLevel(value: unknown): value is MockReviewPreview["riskLevel"] {
  return value === "Low" || value === "Medium" || value === "High";
}

function isReviewFinding(value: unknown): value is MockReviewFinding {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const finding = value as { id?: unknown; text?: unknown };

  return (
    typeof finding.id === "string" &&
    finding.id.trim().length > 0 &&
    typeof finding.text === "string" &&
    finding.text.trim().length > 0
  );
}

function isPullRequestReview(value: unknown): value is MockReviewPreview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const review = value as {
    findings?: unknown;
    riskLevel?: unknown;
    riskScore?: unknown;
    summary?: unknown;
  };

  return (
    typeof review.riskScore === "number" &&
    Number.isFinite(review.riskScore) &&
    review.riskScore >= 0 &&
    review.riskScore <= 100 &&
    isRiskLevel(review.riskLevel) &&
    typeof review.summary === "string" &&
    review.summary.trim().length > 0 &&
    Array.isArray(review.findings) &&
    review.findings.length > 0 &&
    review.findings.every(isReviewFinding)
  );
}

function normalizeReview(review: MockReviewPreview): MockReviewPreview {
  return {
    riskScore: Math.round(review.riskScore),
    riskLevel: review.riskLevel,
    summary: review.summary.trim(),
    findings: review.findings.slice(0, 5).map((finding, index) => ({
      id: finding.id.trim() || `finding-${index + 1}`,
      text: finding.text.trim(),
    })),
  };
}

function createReviewerPrompt(input: GeneratePullRequestReviewInput) {
  return [
    `Repository: ${input.pullRequest.owner}/${input.pullRequest.repo}`,
    `Pull request: #${input.pullRequest.pullNumber}`,
    `Title: ${input.metadata.title}`,
    `Author: ${input.metadata.author}`,
    `State: ${input.metadata.state}`,
    `Branches: ${input.metadata.sourceBranch} -> ${input.metadata.targetBranch}`,
    `Changed files: ${input.metadata.changedFiles}`,
    `Additions: ${input.metadata.additions}`,
    `Deletions: ${input.metadata.deletions}`,
    `Description: ${input.metadata.body || "No pull request description provided."}`,
    `Files:\n${input.changedFilesSummary}`,
  ].join("\n");
}

export async function generatePullRequestReview(
  input: GeneratePullRequestReviewInput,
): Promise<GeneratePullRequestReviewResult> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    return createMockReviewResult();
  }

  const client = new OpenAI({
    apiKey,
  });

  try {
    const response = await client.responses.create({
      model: openAiReviewModel,
      instructions:
        "You are a senior frontend and code reviewer. Generate a concise, practical pull request review. Focus on risk, correctness, tests, edge cases, and reviewer action items. Return only the structured JSON object.",
      input: createReviewerPrompt(input),
      max_output_tokens: 700,
      text: {
        format: {
          type: "json_schema",
          name: "pull_request_review",
          strict: true,
          schema: pullRequestReviewSchema,
        },
      },
    });

    const parsed: unknown = JSON.parse(response.output_text);

    if (!isPullRequestReview(parsed)) {
      return createMockReviewResult();
    }

    return {
      review: normalizeReview(parsed),
      source: "openai",
    };
  } catch {
    return createMockReviewResult();
  }
}
