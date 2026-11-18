"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CornerDownLeft, Folder, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommandDialog, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { QUESTION_BANKS } from "@/lib/question-banks";
import { UNCATEGORIZED_SLUG } from "@/types/category";
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

/** cmdk tracks the highlighted row by a unique string value. */
function itemValue(result: SearchResult) {
  return `${result.bank}:${result.id}`;
}

/** The row shown first: results are grouped in QUESTION_BANKS order. */
function firstItemValue(results: SearchResult[]) {
  for (const bank of QUESTION_BANKS) {
    const first = results.find((result) => result.bank === bank.key);
    if (first) return itemValue(first);
  }
  return "";
}

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

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [selectedValue, setSelectedValue] = useState("");

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
      setSelectedValue("");
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
        // New results: highlight the first row so Enter opens the best match straight away.
        setSelectedValue(firstItemValue(payload.results));
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

  const groups = useMemo(
    () =>
      QUESTION_BANKS.map((bank) => ({ bank, items: results.filter((result) => result.bank === bank.key) })).filter(
        (group) => group.items.length > 0,
      ),
    [results],
  );

  function openResult(result: SearchResult) {
    const bank = QUESTION_BANKS.find((item) => item.key === result.bank);
    if (!bank) return;

    // Categorized banks keep their questions under /<bank>/<category-slug>.
    const base = bank.categorized ? `${bank.href}/${result.category?.slug ?? UNCATEGORIZED_SLUG}` : bank.href;

    changeOpen(false);
    router.push(`${base}?focus=${result.id}`);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => changeOpen(true)}
        aria-label="Search all questions"
        className="h-9 gap-2 border-zinc-800 bg-zinc-900/70 px-2.5 font-normal text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 sm:w-64 sm:px-3"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden flex-1 text-left sm:inline">Search questions...</span>
        <Kbd className="hidden sm:inline-flex">{isMac ? "⌘K" : "Ctrl K"}</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={changeOpen}
        title="Search all questions"
        description="Search technical, scenario, AI, frontend, backend and system design / database questions and answers."
        className="top-[10vh] max-w-2xl translate-y-0"
        // Results are already filtered on the server, so cmdk must not filter or re-order them again.
        commandProps={{
          shouldFilter: false,
          loop: true,
          vimBindings: false,
          label: "Search all questions",
          value: selectedValue,
          onValueChange: setSelectedValue,
        }}
      >
        <CommandInput
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search every question and answer..."
          autoComplete="off"
          spellCheck={false}
        />

        <CommandList>
          {status === "idle" ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-500">
              Type at least {MIN_QUERY_LENGTH} characters to search across all your question banks.
            </p>
          ) : status === "error" ? (
            <p className="px-3 py-10 text-center text-sm text-red-300">Search failed. Please try again.</p>
          ) : status === "loading" && groups.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-100" />
            </div>
          ) : groups.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-zinc-400">
              No questions match <span className="text-zinc-200">&ldquo;{trimmedQuery}&rdquo;</span>.
            </p>
          ) : (
            groups.map(({ bank, items }) => {
              const Icon = bank.icon;
              const total = totals[bank.key] ?? items.length;

              return (
                <CommandGroup
                  key={bank.key}
                  className={status === "loading" ? "opacity-60 transition-opacity" : "transition-opacity"}
                  heading={
                    <span className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span>{bank.label}</span>
                      <span className="ml-auto tracking-normal normal-case">
                        {total > items.length ? `Top ${items.length} of ${total}` : total}
                      </span>
                    </span>
                  }
                >
                  {items.map((result) => (
                    <CommandItem
                      key={itemValue(result)}
                      value={itemValue(result)}
                      onSelect={() => openResult(result)}
                      className="group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 font-medium text-zinc-100">
                          <Highlight text={result.question} terms={searchedTerms} />
                        </p>
                        {bank.categorized ? (
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500">
                            <Folder className="h-3 w-3 shrink-0" />
                            <span className="truncate">{result.category?.name ?? "Uncategorized"}</span>
                          </p>
                        ) : null}
                        {result.snippet ? (
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                            <Highlight text={result.snippet} terms={searchedTerms} />
                          </p>
                        ) : null}
                      </div>
                      <CornerDownLeft className="mt-0.5 hidden h-3.5 w-3.5 shrink-0 text-zinc-400 group-data-[selected=true]:block" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })
          )}
        </CommandList>

        <div className="hidden items-center gap-4 border-t border-zinc-800 px-4 py-2.5 text-[11px] text-zinc-500 sm:flex">
          <span className="flex items-center gap-1.5">
            <Kbd>↑↓</Kbd> navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> open
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>esc</Kbd> close
          </span>
        </div>
      </CommandDialog>
    </>
  );
}
