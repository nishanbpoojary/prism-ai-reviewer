import type {
  GitHubPullRequestMetadata,
  GitHubPullRequestRef,
  MockReviewPreview,
  PullRequestReviewSource,
  RecentReviewHistoryItem,
  RiskLevel,
} from "@/features/pull-request-review/types";

const REVIEW_HISTORY_STORAGE_KEY = "prism-ai:recent-reviews";
const MAX_REVIEW_HISTORY_ITEMS = 5;
const riskLevels: RiskLevel[] = ["Low", "Medium", "High"];
const reviewSources: PullRequestReviewSource[] = ["mock", "openai", "gemini"];

type CreateReviewHistoryItemInput = {
  metadata: GitHubPullRequestMetadata;
  pullRequest: GitHubPullRequestRef;
  review: MockReviewPreview;
  reviewSource: PullRequestReviewSource;
};

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "string" && riskLevels.includes(value as RiskLevel);
}

function isReviewSource(value: unknown): value is PullRequestReviewSource {
  return (
    typeof value === "string" &&
    reviewSources.includes(value as PullRequestReviewSource)
  );
}

function isRecentReviewHistoryItem(
  value: unknown,
): value is RecentReviewHistoryItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<Record<keyof RecentReviewHistoryItem, unknown>>;

  return (
    typeof item.prUrl === "string" &&
    typeof item.repositoryName === "string" &&
    typeof item.prNumber === "number" &&
    Number.isInteger(item.prNumber) &&
    typeof item.prTitle === "string" &&
    typeof item.riskScore === "number" &&
    Number.isFinite(item.riskScore) &&
    isRiskLevel(item.riskLevel) &&
    isReviewSource(item.reviewSource) &&
    typeof item.analyzedAt === "string"
  );
}

function getHistoryKey(item: RecentReviewHistoryItem) {
  return `${item.repositoryName.toLowerCase()}#${item.prNumber}`;
}

export function createRecentReviewHistoryItem({
  metadata,
  pullRequest,
  review,
  reviewSource,
}: CreateReviewHistoryItemInput): RecentReviewHistoryItem {
  return {
    prUrl: pullRequest.url,
    repositoryName: `${pullRequest.owner}/${pullRequest.repo}`,
    prNumber: pullRequest.pullNumber,
    prTitle: metadata.title,
    riskScore: review.riskScore,
    riskLevel: review.riskLevel,
    reviewSource,
    analyzedAt: new Date().toISOString(),
  };
}

export function readRecentReviewHistory(): RecentReviewHistoryItem[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    const storedValue = storage.getItem(REVIEW_HISTORY_STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      storage.removeItem(REVIEW_HISTORY_STORAGE_KEY);
      return [];
    }

    const history = parsedValue.filter(isRecentReviewHistoryItem);

    if (history.length !== parsedValue.length) {
      storage.setItem(REVIEW_HISTORY_STORAGE_KEY, JSON.stringify(history));
    }

    return history.slice(0, MAX_REVIEW_HISTORY_ITEMS);
  } catch {
    try {
      storage.removeItem(REVIEW_HISTORY_STORAGE_KEY);
    } catch {
      return [];
    }

    return [];
  }
}

export function saveRecentReviewHistoryItem(
  item: RecentReviewHistoryItem,
): RecentReviewHistoryItem[] {
  const existingHistory = readRecentReviewHistory();
  const itemKey = getHistoryKey(item);
  const nextHistory = [
    item,
    ...existingHistory.filter(
      (existingItem) => getHistoryKey(existingItem) !== itemKey,
    ),
  ].slice(0, MAX_REVIEW_HISTORY_ITEMS);
  const storage = getStorage();

  if (!storage) {
    return nextHistory;
  }

  try {
    storage.setItem(REVIEW_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return nextHistory;
  }

  return nextHistory;
}

export function clearRecentReviewHistory(): RecentReviewHistoryItem[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  try {
    storage.removeItem(REVIEW_HISTORY_STORAGE_KEY);
  } catch {
    return [];
  }

  return [];
}
