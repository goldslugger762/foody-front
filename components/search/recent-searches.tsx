"use client";

import { useState } from "react";
import { Clock, X } from "lucide-react";

import { SectionHeader } from "@/components/search/section-header";

type RecentSearchesProps = {
  initial: string[];
};

export function RecentSearches({ initial }: RecentSearchesProps) {
  const [items, setItems] = useState(initial);

  if (items.length === 0) return null;

  return (
    <div className="px-[18px] pb-4">
      <SectionHeader
        icon={<Clock size={15} strokeWidth={2} color="#3A4A40" />}
        title="Последнее"
        action={
          <button
            type="button"
            onClick={() => setItems([])}
            className="cursor-pointer border-0 bg-transparent p-1 text-[13px] font-semibold text-[#3A4A40]"
          >
            Очистить
          </button>
        }
      />

      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((q) => (
          <div
            key={q}
            onClick={() => console.log("recent pick:", q)}
            className="inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-full border-[0.5px] border-white/60 bg-white/55 pr-1.5 pl-3 text-[13.5px] font-medium text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.6)] backdrop-blur-[20px] backdrop-saturate-[180%]"
          >
            <span>{q}</span>
            <button
              type="button"
              aria-label={`Удалить запрос «${q}»`}
              onClick={(e) => {
                e.stopPropagation();
                setItems((prev) => prev.filter((x) => x !== q));
              }}
              className="grid size-[22px] cursor-pointer place-items-center rounded-full border-0 bg-[rgba(20,40,28,0.08)] text-[#3A4A40]"
            >
              <X size={10} strokeWidth={2.4} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
