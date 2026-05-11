"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

import { GlassSurface } from "@/components/feed/glass-surface";

type SearchHeaderProps = {
  brand: string;
};

export function SearchHeader({ brand }: SearchHeaderProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <div className="px-[18px] pt-1 pb-2.5">
      <h1 className="mb-3 text-[34px] leading-tight font-extrabold tracking-[-0.6px] text-[#15291C]">
        Поиск
      </h1>

      <GlassSurface className="h-[50px] rounded-[18px]" highlight>
        <div className="flex h-[50px] items-center gap-2.5 px-3.5 text-[#3A4A40]">
          <Search
            size={20}
            strokeWidth={2}
            color={focused ? brand : "#5C6B62"}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Найти блюдо, ресторан или автора"
            className="flex-1 border-0 bg-transparent text-[15.5px] font-medium text-[#15291C] outline-none placeholder:text-[#5C6B62]"
          />
          {query && (
            <button
              type="button"
              aria-label="Очистить"
              onClick={() => setQuery("")}
              className="grid size-[22px] cursor-pointer place-items-center rounded-full border-0 bg-[rgba(20,40,28,0.08)] text-[#3A4A40]"
            >
              <X size={11} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </GlassSurface>
    </div>
  );
}
