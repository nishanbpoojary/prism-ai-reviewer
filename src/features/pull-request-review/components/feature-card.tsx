import type { FeatureCardItem } from "@/features/pull-request-review/types";

type FeatureCardProps = {
  feature: FeatureCardItem;
};

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">
        {feature.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p>
    </article>
  );
}
