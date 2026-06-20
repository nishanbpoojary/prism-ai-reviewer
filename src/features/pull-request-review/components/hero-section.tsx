import { FeatureCard } from "@/features/pull-request-review/components/feature-card";
import { PrInputCard } from "@/features/pull-request-review/components/pr-input-card";
import { ReviewHistory } from "@/features/pull-request-review/components/review-history";
import type {
  FeatureCardItem,
  RecentReviewHistoryItem,
} from "@/features/pull-request-review/types";

type HeroSectionProps = {
  errorMessage: string;
  features: FeatureCardItem[];
  history: RecentReviewHistoryItem[];
  isLoading: boolean;
  onAnalyze: () => void;
  onClearHistory: () => void;
  onSelectHistoryItem: (prUrl: string) => void;
  onUrlChange: (value: string) => void;
  prUrl: string;
};

export function HeroSection({
  errorMessage,
  features,
  history,
  isLoading,
  onAnalyze,
  onClearHistory,
  onSelectHistoryItem,
  onUrlChange,
  prUrl,
}: HeroSectionProps) {
  return (
    <div className="max-w-3xl lg:max-w-none">
      <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-4xl xl:text-5xl 2xl:text-6xl">
        Review pull requests faster with AI
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 xl:text-lg xl:leading-8">
        Paste a GitHub pull request URL and get an AI-generated summary, risk
        analysis, review findings, and test plan.
      </p>

      <PrInputCard
        errorMessage={errorMessage}
        isLoading={isLoading}
        onAnalyze={onAnalyze}
        onUrlChange={onUrlChange}
        prUrl={prUrl}
      />

      <ReviewHistory
        history={history}
        onClearHistory={onClearHistory}
        onSelectReview={onSelectHistoryItem}
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:mt-5 xl:gap-4">
        {features.map((feature) => (
          <FeatureCard feature={feature} key={feature.title} />
        ))}
      </div>
    </div>
  );
}
