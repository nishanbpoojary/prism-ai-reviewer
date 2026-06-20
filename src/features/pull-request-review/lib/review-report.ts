import type {
  ChecklistStatus,
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview,
  PullRequestReviewSource,
} from "@/features/pull-request-review/types";

export const reviewSourceLabels: Record<PullRequestReviewSource, string> = {
  openai: "OpenAI",
  gemini: "Gemini",
  mock: "Mock fallback",
};

const checklistStatusLabels: Record<ChecklistStatus, string> = {
  pass: "Pass",
  review: "Review",
  not_applicable: "Not applicable",
};

type ReviewReportInput = {
  metadata: GitHubPullRequestMetadata;
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreview;
  reviewSource: PullRequestReviewSource;
};

function createMarkdownList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

export function createReviewerCommentsMarkdown(review: MockReviewPreview) {
  return review.reviewerComments?.length
    ? createMarkdownList(review.reviewerComments)
    : "";
}

function createOptionalSection(title: string, content: string | undefined) {
  return content ? [`## ${title}`, content].join("\n\n") : "";
}

function createOptionalListSection(title: string, items: string[] | undefined) {
  return items?.length
    ? [`## ${title}`, createMarkdownList(items)].join("\n\n")
    : "";
}

function createChecklistSection(
  title: string,
  items: MockReviewPreview["accessibilityChecklist"],
) {
  const content = items?.length
    ? items
        .map(
          (item) =>
            `- [${checklistStatusLabels[item.status]}] ${item.title}: ${item.detail}`,
        )
        .join("\n")
    : "Not available for this earlier review.";

  return [`## ${title}`, content].join("\n\n");
}

function sanitizeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createReviewMarkdownFilename({
  pullRequest,
}: Pick<ReviewReportInput, "pullRequest">) {
  const owner = sanitizeFilenamePart(pullRequest.owner) || "owner";
  const repo = sanitizeFilenamePart(pullRequest.repo) || "repo";

  return `prism-ai-review-${owner}-${repo}-pr-${pullRequest.pullNumber}.md`;
}

export function createReviewMarkdownReport({
  metadata,
  pullRequest,
  review,
  reviewSource,
}: ReviewReportInput) {
  const sections = [
    "# PRism AI Review Report",
    [
      `- Repository: ${pullRequest.owner}/${pullRequest.repo}`,
      `- Pull request: #${pullRequest.pullNumber}`,
      `- Title: ${metadata.title}`,
      `- Author: ${metadata.author}`,
      `- Branches: ${metadata.sourceBranch} -> ${metadata.targetBranch}`,
      `- Changed files: ${metadata.changedFiles}`,
      `- Additions: +${metadata.additions}`,
      `- Deletions: -${metadata.deletions}`,
      `- Review source: ${reviewSourceLabels[reviewSource]}`,
      `- Risk: ${review.riskScore} / 100 (${review.riskLevel})`,
    ].join("\n"),
    "## Summary",
    review.summary,
    "## Findings",
    createMarkdownList(review.findings.map((finding) => finding.text)),
    createChecklistSection(
      "Accessibility checklist",
      review.accessibilityChecklist,
    ),
    createChecklistSection("Security checklist", review.securityChecklist),
    createOptionalListSection("Test cases", review.testCases),
    createOptionalSection(
      "Suggested PR description",
      review.suggestedPrDescription,
    ),
    createOptionalListSection("Reviewer comments", review.reviewerComments),
  ];

  return sections.filter(Boolean).join("\n\n");
}
