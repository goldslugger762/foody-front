"use client";

import { Flame } from "lucide-react";

import { SectionHeader } from "@/components/search/section-header";
import { cn } from "@/lib/utils";

type PopularTagsProps = {
  tags: string[];
  brand: string;
  onSubmitQuery: (query: string) => void;
};

const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";

export function PopularTags({ tags, brand, onSubmitQuery }: PopularTagsProps) {
  return (
    <div className="px-[18px] pb-7">
      <SectionHeader
        icon={
          <Flame size={17} strokeWidth={2.25} color={brand} />
        }
        title="Популярное"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSubmitQuery(tag)}
            className={cn(
              "inline-flex h-[30px] cursor-pointer items-center justify-center rounded-full border-[0.5px] border-transparent px-3 text-[12.5px] font-bold tracking-[0px] text-[#0E8A4F] outline-none backdrop-blur-[20px] backdrop-saturate-[180%]",
              "focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
              PRESS_CLASSES
            )}
            style={{
              background: `linear-gradient(rgba(46,204,113,0.14), rgba(46,204,113,0.14)) padding-box, linear-gradient(135deg, ${brand}A8, rgba(115,232,159,0.72), rgba(100,218,189,0.46)) border-box`,
              boxShadow:
                "0 4px 12px rgba(20,40,28,0.09), inset 1px 1px 0 rgba(255,255,255,0.66)",
            }}
          >
            <span>#{tag}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
