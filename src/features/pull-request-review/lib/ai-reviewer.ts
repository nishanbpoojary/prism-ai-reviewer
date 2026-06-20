import "server-only";

import OpenAI from "openai";
import { mockReviewPreview } from "@/features/pull-request-review/data/mock-review-data";
import { getOpenAiApiKey } from "@/features/pull-request-review/lib/env";
import { generateGeminiPullRequestReview } from "@/features/pull-request-review/lib/gemini-reviewer";
import { createReviewerPrompt } from "@/features/pull-request-review/lib/review-context";
import {
  logAiProviderFailure,
  parseReviewJsonResponse,
  pullRequestReviewJsonSchema,
  reviewerInstructions,
} from "@/features/pull-request-review/lib/review-format";
import type {
  GeneratePullRequestReviewInput,
  GeneratePullRequestReviewResult,
  MockReviewPreview,
} from "@/features/pull-request-review/types";

const openAiReviewModel = "gpt-5.5";

function createMockReviewResult(): GeneratePullRequestReviewResult {
  return {
    review: mockReviewPreview,
    source: "mock",
  };
}

async function generateOpenAiPullRequestReview(
  input: GeneratePullRequestReviewInput,
): Promise<MockReviewPreview | null> {
  const apiKey = getOpenAiApiKey();

  if (!apiKey) {
    return null;
  }

  const client = new OpenAI({
    apiKey,
  });

  try {
    const response = await client.responses.create({
      model: openAiReviewModel,
      instructions: reviewerInstructions,
      input: createReviewerPrompt(input),
      max_output_tokens: 1800,
      text: {
        format: {
          type: "json_schema",
          name: "pull_request_review",
          strict: true,
          schema: pullRequestReviewJsonSchema,
        },
      },
    });

    return parseReviewJsonResponse(response.output_text, "OpenAI");
  } catch (error) {
    logAiProviderFailure("OpenAI", error);
    return null;
  }
}

export async function generatePullRequestReview(
  input: GeneratePullRequestReviewInput,
): Promise<GeneratePullRequestReviewResult> {
  const openAiReview = await generateOpenAiPullRequestReview(input);

  if (openAiReview) {
    return {
      review: openAiReview,
      source: "openai",
    };
  }

  const geminiReview = await generateGeminiPullRequestReview(input);

  if (geminiReview) {
    return {
      review: geminiReview,
      source: "gemini",
    };
  }

  return createMockReviewResult();
}
