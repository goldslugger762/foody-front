"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  Plus,
  Rows3,
  Search,
  User,
  type LucideIcon,
} from "lucide-react";

import { GlassSurface } from "@/components/feed/glass-surface";

export type NavTab = "feed" | "search" | "add" | "saved" | "me";

type TabItem = {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  href?: string;
};

const TABS: TabItem[] = [
  { id: "feed", label: "Лента", icon: Rows3, href: "/" },
  { id: "search", label: "Поиск", icon: Search, href: "/search" },
  { id: "add", label: "", icon: Plus, primary: true },
  { id: "saved", label: "Избранное", icon: Bookmark },
  { id: "me", label: "Профиль", icon: User },
];

type BottomTabBarProps = {
  brand: string;
};

export function BottomTabBar({ brand }: BottomTabBarProps) {
  const pathname = usePathname();

  const isActiveTab = (t: TabItem) =>
    t.href !== undefined && pathname === t.href;

  return (
    <nav
      aria-label="Главная навигация"
      className="absolute right-3.5 bottom-[18px] left-3.5 z-30 h-16"
    >
      <GlassSurface className="h-16 rounded-[28px]">
        <div className="flex h-16 items-center justify-around px-2">
          {TABS.map((t) => {
            const isActive = isActiveTab(t);

            if (t.primary) {
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-label="Создать пост"
                  className="grid size-[50px] cursor-pointer place-items-center border-0 bg-transparent p-0"
                  style={{ filter: `drop-shadow(0 6px 14px ${brand}55)` }}
                >
                  <svg
                    width="50"
                    height="50"
                    viewBox="0 0 50 50"
                    className="block"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient
                        id="plusRingF"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={brand} />
                        <stop offset="100%" stopColor="#1FA85C" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="25"
                      cy="25"
                      r="23"
                      fill="none"
                      stroke="url(#plusRingF)"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M25 16v18M16 25h18"
                      stroke="url(#plusRingF)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              );
            }

            const Icon = t.icon;
            const inner = (
              <>
                <Icon
                  className="size-[22px]"
                  strokeWidth={isActive ? 2.4 : 1.8}
                  color={isActive ? brand : "#5C6B62"}
                  fill={isActive ? brand : "none"}
                />
                <span>{t.label}</span>
              </>
            );

            if (t.href) {
              return (
                <Link
                  key={t.id}
                  href={t.href}
                  aria-current={isActive ? "page" : undefined}
                  className="flex cursor-pointer flex-col items-center gap-0.5 px-2 py-1.5 text-[10.5px] font-semibold transition-colors"
                  style={{ color: isActive ? brand : "#5C6B62" }}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={t.id}
                type="button"
                className="flex cursor-pointer flex-col items-center gap-0.5 border-0 bg-transparent px-2 py-1.5 text-[10.5px] font-semibold text-[#5C6B62]"
              >
                {inner}
              </button>
            );
          })}
        </div>
      </GlassSurface>
    </nav>
  );
}
