export function PrInputCard() {
  return (
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
  );
}
