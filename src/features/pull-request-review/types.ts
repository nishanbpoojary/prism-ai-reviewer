export type FeatureCardItem = {
  title: string;
  text: string;
};

export type MockReviewFinding = {
  id: string;
  text: string;
};

export type RiskLevel = "Low" | "Medium" | "High";

export type MockReviewPreview = {
  riskScore: number;
  riskLevel: RiskLevel;
  summary: string;
  findings: MockReviewFinding[];
  testCases?: string[];
  suggestedPrDescription?: string;
  reviewerComments?: string[];
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
  patch?: string;
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

export type PullRequestReviewSource = "mock" | "openai" | "gemini";

export type GeneratePullRequestReviewInput = {
  pullRequest: GitHubPullRequestRef;
  metadata: GitHubPullRequestMetadata;
  changedFilesSummary: string;
};

export type GeneratePullRequestReviewResult = {
  review: MockReviewPreview;
  source: PullRequestReviewSource;
};
