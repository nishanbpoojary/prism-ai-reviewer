import "server-only";

import OpenAI from "openai";
import { mockReviewPreview } from "@/features/pull-request-review/data/mock-review-data";
import { getOpenAiApiKey } from "@/features/pull-request-review/lib/env";
import type {
  GeneratePullRequestReviewInput,
  GeneratePullRequestReviewResult,
  MockReviewPreview,
  RiskLevel,
} from "@/features/pull-request-review/types";

const openAiReviewModel = "gpt-5.5";
const maxSummaryLength = 140;
const maxFindingLength = 120;
const maxTestCaseLength = 140;
const maxSuggestedDescriptionLength = 360;
const maxReviewerCommentLength = 140;

type OpenAiPullRequestReview = {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: string[];
  testCases: string[];
  suggestedPrDescription: string;
  reviewerComments: string[];
};

const pullRequestReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "riskScore",
    "riskLevel",
    "summary",
    "findings",
    "testCases",
    "suggestedPrDescription",
    "reviewerComments",
  ],
  properties: {
    riskScore: {
      type: "number",
      description: "Overall risk score from 0 to 100.",
    },
    riskLevel: {
      type: "string",
      enum: ["Low", "Medium", "High"],
    },
    summary: {
      type: "string",
    },
    findings: {
      type: "array",
      items: {
        type: "string",
      },
    },
    testCases: {
      type: "array",
      items: {
        type: "string",
      },
    },
    suggestedPrDescription: {
      type: "string",
    },
    reviewerComments: {
      type: "array",
      items: {
        type: "string",
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

function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "Low" || value === "Medium" || value === "High";
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isOpenAiPullRequestReview(
  value: unknown,
): value is OpenAiPullRequestReview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const review = value as {
    findings?: unknown;
    riskLevel?: unknown;
    riskScore?: unknown;
    summary?: unknown;
    suggestedPrDescription?: unknown;
    testCases?: unknown;
    reviewerComments?: unknown;
  };

  return (
    typeof review.riskScore === "number" &&
    Number.isFinite(review.riskScore) &&
    review.riskScore >= 0 &&
    review.riskScore <= 100 &&
    isRiskLevel(review.riskLevel) &&
    typeof review.summary === "string" &&
    review.summary.trim().length > 0 &&
    isNonEmptyStringArray(review.findings) &&
    isNonEmptyStringArray(review.testCases) &&
    typeof review.suggestedPrDescription === "string" &&
    review.suggestedPrDescription.trim().length > 0 &&
    isNonEmptyStringArray(review.reviewerComments)
  );
}

function limitText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function normalizeRiskScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function createFindingId(text: string, index: number) {
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return id || `finding-${index + 1}`;
}

function normalizeStringList(
  values: string[],
  maxItems: number,
  maxLength: number,
) {
  return values
    .map((value) => limitText(value, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeReview(review: OpenAiPullRequestReview): MockReviewPreview {
  const findings = normalizeStringList(
    review.findings,
    5,
    maxFindingLength,
  ).map((finding, index) => ({
    id: createFindingId(finding, index),
    text: finding,
  }));

  return {
    riskScore: normalizeRiskScore(review.riskScore),
    riskLevel: review.riskLevel,
    summary: limitText(review.summary, maxSummaryLength),
    findings,
    testCases: normalizeStringList(review.testCases, 4, maxTestCaseLength),
    suggestedPrDescription: limitText(
      review.suggestedPrDescription,
      maxSuggestedDescriptionLength,
    ),
    reviewerComments: normalizeStringList(
      review.reviewerComments,
      4,
      maxReviewerCommentLength,
    ),
  };
}

function sanitizeErrorMessage(message: string) {
  return message.replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]");
}

function getErrorField(error: unknown, field: "name" | "message" | "status") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return undefined;
  }

  return (error as Record<typeof field, unknown>)[field];
}

function logOpenAiFailure(error: unknown) {
  const name = getErrorField(error, "name");
  const message = getErrorField(error, "message");
  const status = getErrorField(error, "status");

  console.warn("[PRism AI] OpenAI review fallback", {
    errorName: typeof name === "string" ? name : "UnknownError",
    errorMessage:
      typeof message === "string"
        ? sanitizeErrorMessage(message)
        : "OpenAI review generation failed.",
    statusCode: typeof status === "number" ? status : undefined,
  });
}

function createStructuredOutputError(message: string) {
  return {
    name: "OpenAIStructuredOutputError",
    message,
  };
}

function parseOpenAiReviewResponse(outputText: string) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(outputText);
  } catch {
    logOpenAiFailure(
      createStructuredOutputError("Structured response was not valid JSON."),
    );
    return null;
  }

  if (!isOpenAiPullRequestReview(parsed)) {
    logOpenAiFailure(
      createStructuredOutputError(
        "Structured response did not match the expected review shape.",
      ),
    );
    return null;
  }

  const review = normalizeReview(parsed);

  if (review.findings.length === 0) {
    logOpenAiFailure(
      createStructuredOutputError(
        "Structured response did not include usable findings.",
      ),
    );
    return null;
  }

  return review;
}

function createChangedFilesPrompt(input: GeneratePullRequestReviewInput) {
  const files = input.metadata.files
    .slice(0, 30)
    .map(
      (file) =>
        `- ${file.filename} (${file.status}, +${file.additions}, -${file.deletions}, ${file.changes} changes)`,
    )
    .join("\n");

  return files || input.changedFilesSummary;
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
    "Changed file summaries only. Full patches are not available in this step.",
    `Files:\n${createChangedFilesPrompt(input)}`,
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
        "You are a senior frontend and code reviewer. Generate a concise, practical pull request review for recruiters and engineering reviewers. Focus on risk, correctness, tests, edge cases, and reviewer action items. Use only the provided PR metadata and changed file summaries. Do not invent code behavior or claim to have seen patches. If details are limited, mention that uncertainty directly. Return only the structured JSON object.",
      input: createReviewerPrompt(input),
      max_output_tokens: 900,
      text: {
        format: {
          type: "json_schema",
          name: "pull_request_review",
          strict: true,
          schema: pullRequestReviewSchema,
        },
      },
    });

    const review = parseOpenAiReviewResponse(response.output_text);

    if (!review) {
      return createMockReviewResult();
    }

    return {
      review,
      source: "openai",
    };
  } catch (error) {
    logOpenAiFailure(error);
    return createMockReviewResult();
  }
}
