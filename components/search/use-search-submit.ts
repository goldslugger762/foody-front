"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { getSearchResultsHref } from "@/lib/search";

import {
  getNextRecentQueries,
  saveRecentQueries,
  useRecentSearchQueries,
} from "./recent-search-store";

type UseSearchSubmitOptions = {
  onSubmitted?: (query: string) => void;
};

export function useSearchSubmit({ onSubmitted }: UseSearchSubmitOptions = {}) {
  const router = useRouter();
  const recentQueries = useRecentSearchQueries();

  return useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) return;

      saveRecentQueries(getNextRecentQueries(recentQueries, trimmedQuery));
      onSubmitted?.(trimmedQuery);
      router.push(getSearchResultsHref(trimmedQuery));
    },
    [onSubmitted, recentQueries, router]
  );
}
