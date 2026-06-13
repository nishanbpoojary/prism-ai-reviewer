import { HeroSection } from "@/features/pull-request-review/components/hero-section";
import { MockReviewPreview } from "@/features/pull-request-review/components/mock-review-preview";
import {
  featureCards,
  mockReviewPreview,
} from "@/features/pull-request-review/data/mock-review-data";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white">
              PR
            </div>
            <span className="text-lg font-semibold">PRism AI</span>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            AI Developer Tool
          </span>
        </header>

        <div className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_0.86fr] lg:py-20">
          <HeroSection features={featureCards} />
          <MockReviewPreview review={mockReviewPreview} />
        </div>
      </section>
    </main>
  );
}
