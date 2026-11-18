"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CornerDownLeft, Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { QUESTION_BANKS } from "@/lib/question-banks";
import { cn } from "@/lib/utils";
import type { SearchResponse, SearchResult } from "@/types/search";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

type Status = "idle" | "loading" | "done" | "error";

/** Outcome of the most recent request, tagged with the query it answers. */
type Outcome = {
  query: string;
  results: SearchResult[];
  totals: SearchResponse["totals"];
  error: boolean;
};

const NO_RESULTS: SearchResult[] = [];

const subscribeToNothing = () => () => {};
const detectMac = () => /Mac|iPhone|iPad/i.test(navigator.userAgent);
const assumeNotMac = () => false;

function toTerms(query: string) {
  return Array.from(new Set(query.toLowerCase().split(/\s+/).filter(Boolean)));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;

  // A capture group makes split() keep the matches, which land on the odd indexes.
  const parts = text.split(new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="rounded-sm bg-amber-300/20 px-0.5 text-amber-100">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Server renders the non-Mac hint; the client swaps it in without a hydration mismatch.
  const isMac = useSyncExternalStore(subscribeToNothing, detectMac, assumeNotMac);

  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;

  // Loading/idle/error are derived rather than stored, so nothing needs to be set from inside an effect.
  // While a new request is in flight the previous results stay visible (dimmed) instead of flashing empty.
  const status: Status = !canSearch
    ? "idle"
    : outcome?.query === trimmedQuery
      ? outcome.error
        ? "error"
        : "done"
      : "loading";
  const results = canSearch && outcome && !outcome.error ? outcome.results : NO_RESULTS;
  const totals = outcome?.totals ?? {};
  const searchedTerms = useMemo(() => toTerms(outcome?.query ?? ""), [outcome?.query]);

  const changeOpen = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setQuery("");
      setOutcome(null);
      setActiveIndex(0);
    }
  }, []);

  // Cmd/Ctrl+K toggles the palette, except while typing in an answer editor or another dialog.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;

      const target = event.target as HTMLElement | null;
      if (!open && target?.closest('[contenteditable="true"], [role="dialog"]')) return;

      event.preventDefault();
      changeOpen(!open);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, changeOpen]);

  // Debounced search; aborting the previous request means a slow old response can never overwrite a newer one.
  useEffect(() => {
    if (!canSearch) return;

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as Partial<SearchResponse> & { error?: string };

        if (!response.ok || !payload.results) {
          throw new Error(payload.error ?? "Search failed.");
        }

        setOutcome({ query: trimmedQuery, results: payload.results, totals: payload.totals ?? {}, error: false });
        setActiveIndex(0);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOutcome({ query: trimmedQuery, results: [], totals: {}, error: true });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, trimmedQuery]);

  const groups = useMemo(() => {
    let index = 0;

    return QUESTION_BANKS.map((bank) => ({
      bank,
      items: results.filter((result) => result.bank === bank.key).map((result) => ({ result, index: index++ })),
    })).filter((group) => group.items.length > 0);
  }, [results]);

  const flatResults = useMemo(() => groups.flatMap((group) => group.items.map((item) => item.result)), [groups]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatResults]);

  function openResult(result: SearchResult) {
    const bank = QUESTION_BANKS.find((item) => item.key === result.bank);
    if (!bank) return;

    changeOpen(false);
    router.push(`${bank.href}?focus=${result.id}`);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (flatResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % flatResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = flatResults[activeIndex];
      if (selected) openResult(selected);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => changeOpen(true)}
        aria-label="Search all questions"
        className="flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 text-sm text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200 sm:w-64 sm:px-3"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Search questions...</span>
        <kbd className="hidden rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[10vh] max-w-2xl translate-y-0 gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">Search all questions</DialogTitle>
          <DialogDescription className="sr-only">
            Search technical, scenario, AI, frontend and backend questions and answers.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-zinc-500" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search every question and answer..."
              role="combobox"
              aria-expanded={flatResults.length > 0}
              aria-controls="global-search-results"
              aria-activedescendant={flatResults[activeIndex] ? `search-result-${flatResults[activeIndex].id}` : undefined}
              autoComplete="off"
              spellCheck={false}
              className="h-14 flex-1 bg-transparent text-base text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <kbd className="hidden rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 sm:inline">
              Esc
            </kbd>
          </div>

          <div ref={listRef} id="global-search-results" role="listbox" className="max-h-[min(60vh,28rem)] overflow-y-auto p-2">
            {status === "idle" ? (
              <p className="px-3 py-10 text-center text-sm text-zinc-500">
                Type at least {MIN_QUERY_LENGTH} characters to search across all five question banks.
              </p>
            ) : status === "error" ? (
              <p className="px-3 py-10 text-center text-sm text-red-300">Search failed. Please try again.</p>
            ) : status === "loading" && flatResults.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
              </div>
            ) : flatResults.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-zinc-400">
                No questions match <span className="text-zinc-200">&ldquo;{trimmedQuery}&rdquo;</span>.
              </p>
            ) : (
              <div className={cn("transition-opacity", status === "loading" && "opacity-60")}>
                {groups.map(({ bank, items }) => {
                  const Icon = bank.icon;
                  const total = totals[bank.key] ?? items.length;

                  return (
                    <div key={bank.key} role="group" aria-label={`${bank.label} questions`} className="mb-1 last:mb-0">
                      <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-[11px] font-medium tracking-[0.15em] text-zinc-500 uppercase">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{bank.label}</span>
                        <span className="ml-auto tracking-normal normal-case">
                          {total > items.length ? `Top ${items.length} of ${total}` : total}
                        </span>
                      </div>

                      {items.map(({ result, index }) => {
                        const isActive = index === activeIndex;

                        return (
                          <button
                            key={`${result.bank}-${result.id}`}
                            id={`search-result-${result.id}`}
                            type="button"
                            role="option"
                            aria-selected={isActive}
                            data-active={isActive}
                            onClick={() => openResult(result)}
                            onMouseMove={() => setActiveIndex(index)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                              isActive ? "bg-zinc-800/80" : "hover:bg-zinc-900",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                                <Highlight text={result.question} terms={searchedTerms} />
                              </p>
                              {result.snippet ? (
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                                  <Highlight text={result.snippet} terms={searchedTerms} />
                                </p>
                              ) : null}
                            </div>
                            {isActive ? <CornerDownLeft className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden items-center gap-4 border-t border-zinc-800 px-4 py-2.5 text-[11px] text-zinc-500 sm:flex">
            <span>
              <kbd className="font-mono">↑↓</kbd> navigate
            </span>
            <span>
              <kbd className="font-mono">↵</kbd> open
            </span>
            <span>
              <kbd className="font-mono">esc</kbd> close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
