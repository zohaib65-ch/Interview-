export default function LoadingScenarioQuestions() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-8 sm:px-8 sm:py-12">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 sm:p-8">
        <div className="h-4 w-36 animate-pulse rounded bg-zinc-800" />
        <div className="mt-2 h-7 w-64 animate-pulse rounded bg-zinc-800" />
        <div className="mt-3 h-4 w-96 animate-pulse rounded bg-zinc-800" />
      </section>
      <section className="mt-6 space-y-4">
        <div className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
        <div className="h-48 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/60" />
      </section>
    </main>
  );
}
