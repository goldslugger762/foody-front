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

  return (
    <header className="sticky top-0 z-20 px-3.5 pt-2.5 pb-3">
      <GlassSurface className="h-15">
        <div className="flex h-15 items-center gap-2.5 pr-2 pl-3.5">
          <div className="flex shrink-0 items-center gap-2 pr-1">
            <span
              aria-hidden="true"
              className="grid size-[26px] place-items-center rounded-[9px] text-sm leading-none"
              style={{
                background: `linear-gradient(135deg, ${brand}, #1FA85C)`,
                boxShadow: `0 4px 12px ${brand}55`,
              }}
            >
              🍴
            </span>
            <span className="text-[20px] font-black tracking-[-0.6px] text-[#15291C]">
              Foody
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Лента"
            className="ml-1 flex flex-1 gap-1 rounded-full bg-[rgba(20,40,28,0.06)] p-[3px]"
          >
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
                    "h-[30px] flex-1 cursor-pointer rounded-full text-[12.5px] font-bold tracking-[-0.1px] transition-colors",
                    isActive
                      ? "bg-white text-[#15291C] shadow-[0_2px_8px_rgba(20,40,28,0.10)]"
                      : "bg-transparent text-[#5C6B62]"
                  )}
                >
                  {t.label}
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
              size="lg"
              className="h-9 rounded-full px-3.5 text-[12.5px] font-extrabold tracking-[-0.1px] text-[#06301A]"
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
