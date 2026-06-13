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
