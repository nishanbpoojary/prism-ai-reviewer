export type FeatureCardItem = {
  title: string;
  text: string;
};

export type MockReviewFinding = {
  id: string;
  text: string;
};

export type MockReviewPreview = {
  riskScore: number;
  riskLevel: string;
  summary: string;
  findings: MockReviewFinding[];
};

export type GitHubPullRequestRef = {
  owner: string;
  repo: string;
  pullNumber: number;
  url: string;
};

export type AnalyzePullRequestSuccessResponse = {
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreview;
};

export type AnalyzePullRequestErrorResponse = {
  error: string;
};
