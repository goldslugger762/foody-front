"use client";

import { motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import { UserAvatar } from "@/components/feed/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FeedTab = "new" | "subs";

const TABS: { id: FeedTab; label: string }[] = [
  { id: "new", label: "Новое" },
  { id: "subs", label: "Подписки" },
];

type FeedHeaderProps = {
  brand: string;
  tab: FeedTab;
  onTabChange: (next: FeedTab) => void;
  currentUser: string | null;
};

export function FeedHeader({
  brand,
  tab,
  onTabChange,
  currentUser,
}: FeedHeaderProps) {
  const isLoggedIn = !!currentUser;
  const shouldReduceMotion = useReducedMotion();
  const activeTabLeft = tab === "new" ? "3px" : "calc(50% + 1px)";

  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2.5 pb-3">
      <GlassSurface className="h-15">
        <div className="flex h-15 items-center gap-2 pr-2 pl-3">
          <div className="flex shrink-0 items-center gap-1.5 pr-0.5">
            <span
              aria-hidden="true"
              className="grid size-6 place-items-center rounded-[8px] text-[13px] leading-none"
              style={{
                background: `linear-gradient(135deg, ${brand}, #1FA85C)`,
                boxShadow: `0 4px 12px ${brand}55`,
              }}
            >
              🍴
            </span>
            <span className="font-sans text-[18px] font-black tracking-[-0.2px] text-[#15291C]">
              Foody
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Лента"
            className="relative ml-0.5 grid min-w-[148px] flex-1 grid-cols-2 gap-0.5 rounded-full bg-[rgba(20,40,28,0.06)] p-[3px]"
          >
            <motion.span
              aria-hidden="true"
              className="absolute top-[3px] bottom-[3px] w-[calc(50%_-_4px)] rounded-full bg-white shadow-[0_2px_8px_rgba(20,40,28,0.10)]"
              initial={false}
              animate={{ left: activeTabLeft }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 520,
                      damping: 42,
                      mass: 0.55,
                    }
              }
            />
            {TABS.map((t) => {
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onTabChange(t.id)}
                  className={cn(
                    "relative h-[31px] min-w-0 cursor-pointer overflow-hidden rounded-full px-1 font-sans text-[13px] leading-none font-extrabold tracking-[0px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/20",
                    isActive ? "text-[#15291C]" : "text-[#5C6B62]"
                  )}
                >
                  <span className="relative z-[1] block whitespace-nowrap">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>

          {isLoggedIn ? (
            <button
              type="button"
              className="inline-flex h-9 max-w-[140px] cursor-pointer items-center gap-[7px] rounded-full bg-[rgba(20,40,28,0.06)] py-0 pr-2.5 pl-1 text-[12.5px] font-bold tracking-[-0.1px] text-[#15291C]"
            >
              <UserAvatar name={currentUser} size={28} />
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                {currentUser}
              </span>
            </button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="h-8 rounded-full px-2 text-[10px] leading-none font-extrabold tracking-[0px] text-[#06301A]"
              style={{
                backgroundColor: brand,
                boxShadow: `0 4px 12px ${brand}55`,
              }}
            >
              Регистрация
            </Button>
          )}
        </div>
      </GlassSurface>
    </header>
  );
}
