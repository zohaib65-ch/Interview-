"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

const HIGHLIGHT_MS = 2500;

/**
 * Lets global search deep-link to a single question: `/some-bank?focus=<id>`.
 * Once the list has rendered, scrolls the matching `#q-<id>` element into view, marks it
 * `data-highlighted` for a moment (styled by the page), and strips the param so that
 * refreshing, or searching for the same item again, behaves normally.
 *
 * @param ready true once the question list has finished loading
 */
export function useFocusQuestion(ready: boolean) {
  const focusId = useSearchParams().get("focus");

  useEffect(() => {
    if (!focusId || !ready) return;

    const element = document.getElementById(`q-${focusId}`);
    window.history.replaceState(null, "", window.location.pathname);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.setAttribute("data-highlighted", "true");
    window.setTimeout(() => element.removeAttribute("data-highlighted"), HIGHLIGHT_MS);
  }, [focusId, ready]);
}
