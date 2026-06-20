import "server-only";

import type {
  ChecklistStatus,
  MockReviewPreview,
  ReviewChecklistItem,
  RiskLevel,
} from "@/features/pull-request-review/types";

const maxSummaryLength = 140;
const maxFindingLength = 120;
const maxChecklistTitleLength = 80;
const maxChecklistDetailLength = 170;
const maxTestCaseLength = 140;
const maxSuggestedDescriptionLength = 420;
const maxReviewerCommentLength = 140;

type AiProviderName = "OpenAI" | "Gemini";

type StructuredPullRequestReview = {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: string[];
  accessibilityChecklist: ReviewChecklistItem[];
  securityChecklist: ReviewChecklistItem[];
  testCases: string[];
  suggestedPrDescription: string;
  reviewerComments: string[];
};

export const reviewerInstructions =
  "You are a senior frontend and code reviewer. Generate a concise, practical pull request review for recruiters and engineering reviewers. Review only the provided PR metadata, changed-file summaries, and limited diff snippets. Do not claim to inspect the full repository or files that are not included. Mention uncertainty when snippets are limited or patch context is missing. Focus on correctness, edge cases, tests, security, maintainability, and frontend impact. Include 3 to 5 accessibility checklist items and 3 to 5 security checklist items. Accessibility should consider semantic HTML, keyboard interaction, focus states, labels, form validation messaging, ARIA usage, colour contrast, and responsive behaviour when relevant. Security should consider input validation, authentication and authorization, secrets exposure, API validation, error handling, data exposure, dependency concerns, and unsafe external requests when relevant. Do not invent vulnerabilities, claim full audits, or mark an item as pass unless the supplied context supports it. When evidence is limited, use status review and say manual verification is needed. Return only the structured JSON object.";

const checklistItemJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "status", "detail"],
  properties: {
    title: {
      type: "string",
    },
    status: {
      type: "string",
      enum: ["pass", "review", "not_applicable"],
    },
    detail: {
      type: "string",
    },
  },
} as const;

export const pullRequestReviewJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "riskScore",
    "riskLevel",
    "summary",
    "findings",
    "accessibilityChecklist",
    "securityChecklist",
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
    accessibilityChecklist: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: checklistItemJsonSchema,
    },
    securityChecklist: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: checklistItemJsonSchema,
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

function isChecklistStatus(value: unknown): value is ChecklistStatus {
  return (
    value === "pass" ||
    value === "review" ||
    value === "not_applicable"
  );
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isReviewChecklistItem(value: unknown): value is ReviewChecklistItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as {
    detail?: unknown;
    status?: unknown;
    title?: unknown;
  };

  return (
    typeof item.title === "string" &&
    item.title.trim().length > 0 &&
    isChecklistStatus(item.status) &&
    typeof item.detail === "string" &&
    item.detail.trim().length > 0
  );
}

function isReviewChecklist(value: unknown): value is ReviewChecklistItem[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.length <= 5 &&
    value.every(isReviewChecklistItem)
  );
}

function isStructuredPullRequestReview(
  value: unknown,
): value is StructuredPullRequestReview {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const review = value as {
    accessibilityChecklist?: unknown;
    findings?: unknown;
    riskLevel?: unknown;
    riskScore?: unknown;
    securityChecklist?: unknown;
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
    isReviewChecklist(review.accessibilityChecklist) &&
    isReviewChecklist(review.securityChecklist) &&
    isNonEmptyStringArray(review.testCases) &&
    typeof review.suggestedPrDescription === "string" &&
    review.suggestedPrDescription.trim().length > 0 &&
    isNonEmptyStringArray(review.reviewerComments)
  );
}

function limitText(value: string, maxLength: number) {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= maxLength) {
    return trimmedValue;
  }

  const maxContentLength = Math.max(0, maxLength - 3);
  const clippedValue = trimmedValue.slice(0, maxContentLength).trimEnd();
  const sentenceBoundary = Math.max(
    clippedValue.lastIndexOf(". "),
    clippedValue.lastIndexOf("! "),
    clippedValue.lastIndexOf("? "),
  );

  if (sentenceBoundary >= maxContentLength * 0.55) {
    return clippedValue.slice(0, sentenceBoundary + 1).trim();
  }

  const wordBoundary = clippedValue.lastIndexOf(" ");
  const safeValue =
    wordBoundary >= maxContentLength * 0.65
      ? clippedValue.slice(0, wordBoundary)
      : clippedValue;

  return `${safeValue.replace(/[\s,;:.-]+$/g, "")}...`;
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

function normalizeChecklistItems(values: ReviewChecklistItem[]) {
  return values
    .map((item) => ({
      title: limitText(item.title, maxChecklistTitleLength),
      status: item.status,
      detail: limitText(item.detail, maxChecklistDetailLength),
    }))
    .filter((item) => item.title && item.detail)
    .slice(0, 5);
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
    accessibilityChecklist: normalizeChecklistItems(
      review.accessibilityChecklist,
    ),
    securityChecklist: normalizeChecklistItems(review.securityChecklist),
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

