"use client";

import { Flame } from "lucide-react";

import { SectionHeader } from "@/components/search/section-header";
import { Button } from "@/components/ui/button";

type PopularTagsProps = {
  tags: string[];
  brand: string;
};

export function PopularTags({ tags, brand }: PopularTagsProps) {
  return (
    <div className="px-[18px] pb-7">
      <SectionHeader
        icon={
          <span
            aria-hidden="true"
            className="grid size-[18px] place-items-center rounded-md text-[11px] leading-none"
            style={{ background: brand }}
          >
            🔥
          </span>
        }
        title="Популярное"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Button
            key={tag}
            type="button"
            variant="ghost"
            onClick={() => console.log("popular tag:", tag)}
            className="h-9 cursor-pointer gap-1.5 rounded-full bg-white/55 px-3.5 text-[13.5px] font-semibold text-[#15291C] backdrop-blur-[20px] backdrop-saturate-[180%] transition-colors hover:bg-[rgba(46,204,113,0.12)]"
            style={{
              borderWidth: "0.5px",
              borderStyle: "solid",
              borderColor: brand,
              boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.6)",
            }}
          >
            <Flame
              size={14}
              strokeWidth={2.2}
              color={brand}
              fill={brand}
              fillOpacity={0.2}
            />
            <span>#{tag}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
