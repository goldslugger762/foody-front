"use client";

import { useCallback, useState } from "react";

import { CategoryPicker } from "@/components/search/category-picker";
import { PopularTags } from "@/components/search/popular-tags";
import {
  saveRecentQueries,
  useRecentSearchQueries,
} from "@/components/search/recent-search-store";
import { RecentSearches } from "@/components/search/recent-searches";
import { SearchHeader } from "@/components/search/search-header";
import { useSearchSubmit } from "@/components/search/use-search-submit";

type SearchHistoryProps = {
  brand: string;
  popularTags: string[];
};

export function SearchHistory({ brand, popularTags }: SearchHistoryProps) {
  const [query, setQuery] = useState("");
  const recentQueries = useRecentSearchQueries();

  const handleSubmitted = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, []);
  const handleSubmitQuery = useSearchSubmit({ onSubmitted: handleSubmitted });

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
