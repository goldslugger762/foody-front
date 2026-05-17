"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { SearchInputGlass } from "./search-input-glass";
import { useSearchSubmit } from "./use-search-submit";

type SearchResultsHeaderProps = {
  initialQuery: string;
};

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

export function SearchResultsHeader({
  initialQuery,
}: SearchResultsHeaderProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmitted = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, []);

  const submitQuery = useSearchSubmit({ onSubmitted: handleSubmitted });

  function handleBackClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/search");
  }

  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2 pb-0 max-[409px]:px-3">
      <div className="flex h-13 items-center gap-2.5 max-[409px]:gap-2">
        <motion.button
          type="button"
          aria-label="Назад к поиску"
          title="Назад"
          onClick={handleBackClick}
          className={cn(
            "grid size-11 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-[rgba(20,40,28,0.11)] p-0 text-[#3A4A40] outline-none",
            "transition-transform duration-150 ease-out active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [-webkit-tap-highlight-color:transparent]"
          )}
          whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
        >
          <ArrowLeft className="size-[19px]" strokeWidth={2.4} />
        </motion.button>

        <SearchInputGlass
          query={query}
          onQueryChange={setQuery}
          onSubmitQuery={submitQuery}
          surfaceClassName="h-13 min-w-0 flex-1 rounded-[22px]"
          contentClassName="h-13 px-3 max-[409px]:gap-2 max-[409px]:px-2.5"
          inputClassName="text-[15px] md:text-[15px]"
        />
      </div>
    </header>
  );
}
