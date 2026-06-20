import type { FeatureCardItem } from "@/features/pull-request-review/types";

type FeatureCardProps = {
  feature: FeatureCardItem;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:p-3.5 xl:p-5">
      <h2 className="text-sm font-semibold text-slate-950 xl:text-base">
        {feature.title}
      </h2>
      <p className="mt-1.5 text-sm leading-5 text-slate-600 xl:mt-2 xl:leading-6">
        {feature.text}
      </p>
    </article>
  );
}
