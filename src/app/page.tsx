export default function Home() {
  const features = [
    {
      title: "AI PR Summary",
      text: "Understand code changes in seconds.",
    },
    {
      title: "Risk Detection",
      text: "Identify risky changes before merging.",
    },
    {
      title: "Test Plan Generator",
      text: "Generate practical test cases for reviewers.",
    },
  ];

  const findings = [
    "Validate edge cases for empty tokens.",
    "Add tests for expired sessions.",
    "Review error handling for failed login attempts.",
  ];

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
          <div className="max-w-3xl">
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Review pull requests faster with AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Paste a GitHub pull request URL and get an AI-generated summary,
              risk analysis, review findings, and test plan.
            </p>

            <form className="mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
              <label className="sr-only" htmlFor="pr-url">
                GitHub pull request URL
              </label>
              <input
                id="pr-url"
                className="min-h-12 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                placeholder="Paste GitHub PR URL"
                type="url"
              />
              <button
                className="min-h-12 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
                type="button"
              >
                Analyze Pull Request
              </button>
            </form>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {features.map((feature) => (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  key={feature.title}
                >
                  <h2 className="text-base font-semibold text-slate-950">
                    {feature.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Mock Review Preview
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Risk Score: 72 / 100
                </h2>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                Medium
              </span>
            </div>

            <div className="py-5">
              <h3 className="text-sm font-semibold uppercase text-slate-500">
                Summary
              </h3>
              <p className="mt-3 text-base leading-7 text-slate-700">
                This pull request updates the authentication flow and modifies
                validation handling.
              </p>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-sm font-semibold uppercase text-slate-500">
                Findings
              </h3>
              <ul className="mt-4 space-y-3">
                {findings.map((finding) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-slate-700"
                    key={finding}
                  >
                    <span className="mt-2 size-2 rounded-full bg-sky-500" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
