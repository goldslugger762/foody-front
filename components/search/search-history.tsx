"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

import { CategoryPicker } from "@/components/search/category-picker";
import { PopularTags } from "@/components/search/popular-tags";
import { RecentSearches } from "@/components/search/recent-searches";
import { SearchHeader } from "@/components/search/search-header";

const RECENT_SEARCH_STORAGE_KEY = "recentSearchQueries";
const MAX_RECENT_QUERIES = 10;
const EMPTY_RECENT_QUERIES: string[] = [];
const recentQueryListeners = new Set<() => void>();

let recentQueriesSnapshot: string[] = EMPTY_RECENT_QUERIES;
let recentQueriesSnapshotSource: string | null = null;

type SearchHistoryProps = {
  brand: string;
  popularTags: string[];
};

function getQueryKey(query: string) {
  return query.trim().toLowerCase();
}

function normalizeQueries(queries: unknown): string[] {
  if (!Array.isArray(queries)) return [];

  return queries.reduce<string[]>((recent, value) => {
    if (typeof value !== "string") return recent;
    if (recent.length >= MAX_RECENT_QUERIES) return recent;

    const query = value.trim();
    const queryKey = getQueryKey(query);

    if (
      queryKey.length === 0 ||
      recent.some((item) => getQueryKey(item) === queryKey)
    ) {
      return recent;
    }

    return [...recent, query];
  }, []);
}

function getNextRecentQueries(current: string[], query: string) {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length === 0) return current;

  const queryKey = getQueryKey(trimmedQuery);
  const withoutDuplicate = current.filter(
    (item) => getQueryKey(item) !== queryKey
  );

  return [trimmedQuery, ...withoutDuplicate].slice(0, MAX_RECENT_QUERIES);
}

function getStoredRecentQueries() {
  if (typeof window === "undefined") return EMPTY_RECENT_QUERIES;

  try {
    const stored = window.localStorage.getItem(RECENT_SEARCH_STORAGE_KEY);
    if (stored === recentQueriesSnapshotSource) {
      return recentQueriesSnapshot;
    }

    recentQueriesSnapshotSource = stored;
    recentQueriesSnapshot = normalizeQueries(stored ? JSON.parse(stored) : []);
    return recentQueriesSnapshot;
  } catch {
    return EMPTY_RECENT_QUERIES;
  }
}

function saveRecentQueries(queries: string[]) {
  if (typeof window === "undefined") return;

  const next = normalizeQueries(queries);
  const serialized = JSON.stringify(next);

  try {
    window.localStorage.setItem(RECENT_SEARCH_STORAGE_KEY, serialized);
  } catch {
    // Ignore storage failures so search input stays usable in restricted browsers.
  }

  recentQueriesSnapshot = next;
  recentQueriesSnapshotSource = serialized;
  recentQueryListeners.forEach((listener) => listener());
}

function subscribeToRecentQueries(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  recentQueryListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === RECENT_SEARCH_STORAGE_KEY) {
      recentQueriesSnapshotSource = null;
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    recentQueryListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function getEmptyRecentQueries() {
  return EMPTY_RECENT_QUERIES;
}

export function SearchHistory({ brand, popularTags }: SearchHistoryProps) {
  const [query, setQuery] = useState("");
  const recentQueries = useSyncExternalStore(
    subscribeToRecentQueries,
    getStoredRecentQueries,
    getEmptyRecentQueries
  );

  const handleSubmitQuery = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      if (trimmedQuery.length === 0) return;

      setQuery(trimmedQuery);
      saveRecentQueries(getNextRecentQueries(recentQueries, trimmedQuery));
    },
    [recentQueries]
  );

  const handleChangeRecentQueries = useCallback((queries: string[]) => {
    saveRecentQueries(queries);
  }, []);

  return (
    <>
      <SearchHeader
        query={query}
        onQueryChange={setQuery}
        onSubmitQuery={handleSubmitQuery}
      />
      <CategoryPicker brand={brand} />
      <RecentSearches
        items={recentQueries}
        onChange={handleChangeRecentQueries}
        onSubmitQuery={handleSubmitQuery}
      />
      <PopularTags
        tags={popularTags}
        brand={brand}
        onSubmitQuery={handleSubmitQuery}
      />
    </>
  );
}
