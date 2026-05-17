"use client";

import { type CSSProperties, type KeyboardEvent, useState } from "react";
import { Search, X } from "lucide-react";

import { GlassSurface } from "@/components/feed/glass-surface";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export function SearchHeader() {
  const [query, setQuery] = useState("");

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && query.trim().length === 0) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <div className="px-[18px] pt-1 pb-2.5">
      <h1 className="mb-3 text-[34px] leading-tight font-extrabold tracking-[-0.6px] text-[#15291C]">
        Поиск
      </h1>

      <GlassSurface
        className="h-[50px] rounded-[18px] ring-0 ring-transparent transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[var(--search-focus-ring)] focus-within:after:border-[rgba(21,41,28,0.16)]"
        style={
          {
            "--search-focus-ring": "rgba(34,139,34,0.18)",
          } as CSSProperties
        }
        highlight
      >
        <div className="flex h-[50px] items-center gap-2.5 px-3.5 text-[#3A4A40]">
          <Search size={20} strokeWidth={2} color="#5C6B62" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Найти блюдо или ресторан"
            className="h-auto flex-1 border-0 bg-transparent p-0 text-[15.5px] font-medium text-[#15291C] shadow-none outline-none placeholder:text-[#5C6B62] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15.5px]"
          />
          {query && (
            <button
              type="button"
              aria-label="Очистить"
              onClick={() => setQuery("")}
              className={cn(
                "flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(20,40,28,0.08)] p-0 text-[#3A4A40]",
                PRESS_CLASSES
              )}
            >
              <X className="size-[11px] shrink-0" strokeWidth={2.4} />
            </button>
          )}
        </div>
      </GlassSurface>
    </div>
  );
}
