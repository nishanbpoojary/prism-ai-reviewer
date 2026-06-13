import type {
  FeatureCardItem,
  MockReviewPreview,
} from "@/features/pull-request-review/types";

export const featureCards: FeatureCardItem[] = [
  {
    title: "AI PR Summary",
    text: "Understand code changes in seconds.",
  },
  {
    title: "Risk Detection",
    text: "Identify risky changes before merging.",
  },
  {
    title: "Test Plan Generator",
    text: "Generate practical test cases for reviewers.",
  },
];

export const mockReviewPreview: MockReviewPreview = {
  riskScore: 72,
  riskLevel: "Medium",
  summary:
    "This pull request updates the authentication flow and modifies validation handling.",
  findings: [
    {
      id: "empty-tokens",
      text: "Validate edge cases for empty tokens.",
    },
    {
      id: "expired-sessions",
      text: "Add tests for expired sessions.",
    },
    {
      id: "failed-login-errors",
      text: "Review error handling for failed login attempts.",
    },
  ],
};
