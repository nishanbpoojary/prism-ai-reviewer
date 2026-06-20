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
  accessibilityChecklist: [
    {
      title: "Form labels and validation messaging",
      status: "review",
      detail:
        "Patch context is limited; manually confirm inputs have labels and errors are announced near the relevant controls.",
    },
    {
      title: "Keyboard interaction",
      status: "review",
      detail:
        "Review interactive controls with keyboard only, especially submit and copy actions, before merging.",
    },
    {
      title: "Responsive layout",
      status: "pass",
      detail:
        "The changed UI is structured to stack on smaller screens while preserving readable spacing.",
    },
  ],
  securityChecklist: [
    {
      title: "Token handling",
      status: "review",
      detail:
        "Authentication changes should be checked for empty, expired, and malformed token handling.",
    },
    {
      title: "Error disclosure",
      status: "review",
      detail:
        "Confirm failed login and token errors do not expose sensitive implementation details.",
    },
    {
      title: "Secrets exposure",
      status: "not_applicable",
      detail:
        "No secret values are present in the mock review context used for this fallback result.",
    },
  ],
};
