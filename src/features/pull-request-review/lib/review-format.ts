import "server-only";

import type {
  GeneratePullRequestReviewInput,
  MockReviewPreview,
  RiskLevel,
} from "@/features/pull-request-review/types";

const maxSummaryLength = 140;
const maxFindingLength = 120;
const maxTestCaseLength = 140;
const maxSuggestedDescriptionLength = 360;
const maxReviewerCommentLength = 140;

type AiProviderName = "OpenAI" | "Gemini";

type StructuredPullRequestReview = {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: string[];
  testCases: string[];
  suggestedPrDescription: string;
  reviewerComments: string[];
};

export const reviewerInstructions =
  "You are a senior frontend and code reviewer. Generate a concise, practical pull request review for recruiters and engineering reviewers. Focus on risk, correctness, tests, edge cases, and reviewer action items. Use only the provided PR metadata and changed file summaries. Do not invent code behavior or claim to have seen patches. If details are limited, mention that uncertainty directly. Return only the structured JSON object.";

export const pullRequestReviewJsonSchema = {
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

function isStructuredPullRequestReview(
  value: unknown,
): value is StructuredPullRequestReview {
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

function normalizeReview(
  review: StructuredPullRequestReview,
): MockReviewPreview {
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
  return message
    .replace(
      /Incorrect API key provided:\s*[^.\s]+/gi,
      "Incorrect API key provided: [redacted]",
    )
    .replace(/sk-[a-zA-Z0-9_-]+/g, "[redacted]")
    .replace(/AIza[a-zA-Z0-9_-]+/g, "[redacted]");
}

function getErrorField(error: unknown, field: "name" | "message" | "status") {
  if (typeof error !== "object" || error === null || !(field in error)) {
    return undefined;
  }

  return (error as Record<typeof field, unknown>)[field];
}

export function logAiProviderFailure(
  providerName: AiProviderName,
  error: unknown,
) {
  const name = getErrorField(error, "name");
  const message = getErrorField(error, "message");
  const status = getErrorField(error, "status");

  console.warn(`[PRism AI] ${providerName} review fallback`, {
    errorName: typeof name === "string" ? name : "UnknownError",
    errorMessage:
      typeof message === "string"
        ? sanitizeErrorMessage(message)
        : `${providerName} review generation failed.`,
    statusCode: typeof status === "number" ? status : undefined,
  });
}

function createStructuredOutputError(providerName: AiProviderName, message: string) {
  return {
    name: `${providerName}StructuredOutputError`,
    message,
  };
}

function extractJsonObjectText(outputText: string) {
  const trimmedOutput = outputText.trim();
  const fencedJsonMatch = trimmedOutput.match(
    /^```(?:json)?\s*([\s\S]*?)\s*```$/i,
  );

  if (fencedJsonMatch?.[1]) {
    return fencedJsonMatch[1].trim();
  }

  const firstBrace = trimmedOutput.indexOf("{");
  const lastBrace = trimmedOutput.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmedOutput.slice(firstBrace, lastBrace + 1);
  }

  return trimmedOutput;
}

export function parseReviewJsonResponse(
  outputText: string,
  providerName: AiProviderName,
) {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJsonObjectText(outputText));
  } catch {
    logAiProviderFailure(
      providerName,
      createStructuredOutputError(
        providerName,
        "Structured response was not valid JSON.",
      ),
    );
    return null;
  }

  if (!isStructuredPullRequestReview(parsed)) {
    logAiProviderFailure(
      providerName,
      createStructuredOutputError(
        providerName,
        "Structured response did not match the expected review shape.",
      ),
    );
    return null;
  }

  const review = normalizeReview(parsed);

  if (review.findings.length === 0) {
    logAiProviderFailure(
      providerName,
      createStructuredOutputError(
        providerName,
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

export function createReviewerPrompt(input: GeneratePullRequestReviewInput) {
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
