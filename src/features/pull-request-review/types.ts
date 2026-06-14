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

export type GitHubPullRequestFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
};

export type GitHubPullRequestMetadata = {
  title: string;
  body: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  files: GitHubPullRequestFile[];
};

export type AnalyzePullRequestSuccessResponse = {
  pullRequest: GitHubPullRequestRef;
  metadata: GitHubPullRequestMetadata;
  review: MockReviewPreview;
  reviewSource: PullRequestReviewSource;
};

export type AnalyzePullRequestErrorResponse = {
  error: string;
};

export type PullRequestReviewSource = "mock" | "openai";

export type GeneratePullRequestReviewInput = {
  pullRequest: GitHubPullRequestRef;
  metadata: GitHubPullRequestMetadata;
  changedFilesSummary: string;
};

export type GeneratePullRequestReviewResult = {
  review: MockReviewPreview;
  source: PullRequestReviewSource;
};
