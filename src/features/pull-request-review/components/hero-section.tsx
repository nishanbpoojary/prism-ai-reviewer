import { FeatureCard } from "@/features/pull-request-review/components/feature-card";
import { PrInputCard } from "@/features/pull-request-review/components/pr-input-card";
import type { FeatureCardItem } from "@/features/pull-request-review/types";

type HeroSectionProps = {
  errorMessage: string;
  features: FeatureCardItem[];
  isLoading: boolean;
  onAnalyze: () => void;
  onUrlChange: (value: string) => void;
  prUrl: string;
};

export function HeroSection({
  errorMessage,
  features,
  isLoading,
  onAnalyze,
  onUrlChange,
  prUrl,
}: HeroSectionProps) {
  return (
    <div className="max-w-3xl">
      <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
        Review pull requests faster with AI
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
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

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard feature={feature} key={feature.title} />
        ))}
      </div>
    </div>
  );
}
