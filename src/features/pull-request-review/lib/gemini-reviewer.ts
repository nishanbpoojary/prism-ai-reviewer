import "server-only";

import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { getGeminiApiKey } from "@/features/pull-request-review/lib/env";
import { createReviewerPrompt } from "@/features/pull-request-review/lib/review-context";
import {
  logAiProviderFailure,
  parseReviewJsonResponse,
  reviewerInstructions,
} from "@/features/pull-request-review/lib/review-format";
import type {
  GeneratePullRequestReviewInput,
  MockReviewPreview,
} from "@/features/pull-request-review/types";

const geminiReviewModel = "gemini-2.5-flash";
const geminiReviewerInstructions = `${reviewerInstructions} Keep every field brief enough for the provided JSON schema. Return a complete JSON object only, with no markdown fences and no prose before or after the JSON.`;

const geminiReviewSchema = {
  type: Type.OBJECT,
  required: [
    "riskScore",
    "riskLevel",
    "summary",
    "findings",
    "testCases",
    "suggestedPrDescription",
    "reviewerComments",
  ],
  propertyOrdering: [
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
      type: Type.NUMBER,
      description: "Overall risk score from 0 to 100.",
    },
    riskLevel: {
      type: Type.STRING,
      format: "enum",
      enum: ["Low", "Medium", "High"],
    },
    summary: {
      type: Type.STRING,
      maxLength: "140",
    },
    findings: {
      type: Type.ARRAY,
      maxItems: "5",
      items: {
        type: Type.STRING,
        maxLength: "120",
      },
    },
    testCases: {
      type: Type.ARRAY,
      maxItems: "4",
      items: {
        type: Type.STRING,
        maxLength: "140",
      },
    },
    suggestedPrDescription: {
      type: Type.STRING,
      maxLength: "420",
    },
    reviewerComments: {
      type: Type.ARRAY,
      maxItems: "4",
      items: {
        type: Type.STRING,
        maxLength: "140",
      },
    },
  },
} satisfies Schema;

export async function generateGeminiPullRequestReview(
  input: GeneratePullRequestReviewInput,
): Promise<MockReviewPreview | null> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return null;
  }

  const client = new GoogleGenAI({
    apiKey,
  });

  try {
    const response = await client.models.generateContent({
      model: geminiReviewModel,
      contents: createReviewerPrompt(input),
      config: {
        systemInstruction: geminiReviewerInstructions,
        maxOutputTokens: 2400,
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: geminiReviewSchema,
      },
    });

    if (!response.text) {
      logAiProviderFailure("Gemini", {
        name: "GeminiEmptyResponseError",
        message: "Gemini returned an empty review response.",
      });
      return null;
    }

    return parseReviewJsonResponse(response.text, "Gemini");
  } catch (error) {
    logAiProviderFailure("Gemini", error);
    return null;
  }
}
