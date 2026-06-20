import { PullRequestReviewDemo } from "@/features/pull-request-review/components/pull-request-review-demo";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-[100dvh] w-full max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-8 lg:py-6 xl:px-10">
        <header className="flex shrink-0 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-white lg:size-8">
              PR
            </div>
            <span className="text-base font-semibold sm:text-lg">PRism AI</span>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            AI Developer Tool
          </span>
        </header>

        <PullRequestReviewDemo />
      </section>
    </main>
  );
}
