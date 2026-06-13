type PrInputCardProps = {
  errorMessage: string;
  isLoading: boolean;
  onAnalyze: () => void;
  onUrlChange: (value: string) => void;
  prUrl: string;
};

export function PrInputCard({
  errorMessage,
  isLoading,
  onAnalyze,
  onUrlChange,
  prUrl,
}: PrInputCardProps) {
  return (
    <div className="mt-8 w-full max-w-2xl">
      <form
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          onAnalyze();
        }}
      >
        <label className="sr-only" htmlFor="pr-url">
          GitHub pull request URL
        </label>
        <input
          aria-describedby={errorMessage ? "pr-url-error" : undefined}
          aria-invalid={Boolean(errorMessage)}
          id="pr-url"
          className="min-h-12 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Paste GitHub PR URL"
          type="text"
          value={prUrl}
        />
        <button
          className="min-h-12 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Analyzing..." : "Analyze Pull Request"}
        </button>
      </form>
      {errorMessage ? (
        <p className="mt-3 text-sm font-medium text-red-600" id="pr-url-error">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
