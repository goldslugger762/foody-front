import {
  ArrowLeft,
  Flag,
  MoreVertical,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { motion, useAnimationControls } from "motion/react";
import { type KeyboardEvent, type ReactNode, useState } from "react";

import { GlassSurface } from "@/components/feed/glass-surface";
import { UserAvatar } from "@/components/feed/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import {
  ICON_PULSE_ANIMATION,
  ICON_PULSE_TRANSITION,
  canAnimate,
} from "./post-card-shared";

const SUBSCRIBE_PRESS_TRANSITION = { duration: 0.08, ease: "easeOut" } as const;
const SUBSCRIBE_RETURN_TRANSITION = {
  damping: 28,
  mass: 0.55,
  stiffness: 520,
  type: "spring",
} as const;
const SUBSCRIBE_STATE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const;
const SUBSCRIBE_STATE_SETTLE_MS = 240;
const FULLSCREEN_COMPACT_AUTHOR_LENGTH = 11;
const FULLSCREEN_SMALL_COMPACT_AUTHOR_LENGTH = 10;

const FULLSCREEN_HEADER_GLASS = {
  outer:
    "shrink-0 px-3.5 pt-[calc(env(safe-area-inset-top)+3.625rem)] pb-3 max-[409px]:px-3",
  surface:
    "rounded-[24px] shadow-[0_16px_28px_rgba(20,40,28,0.14),0_2px_8px_rgba(255,255,255,0.42)]",
  tint:
    "before:bg-green-100/32 before:backdrop-blur-[30px] before:backdrop-saturate-[220%]",
  highlight:
    "after:border-[0.5px] after:border-white/55 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.76),inset_-1px_-1px_0_rgba(255,255,255,0.98)]",
  content:
    "flex min-h-13 items-center gap-2.5 px-2.5 py-2 max-[380px]:gap-2 max-[380px]:px-2",
} as const;

const FULLSCREEN_SUBSCRIBE_BUTTON = {
  base:
    "relative h-7 shrink-0 cursor-pointer select-none overflow-hidden rounded-full border border-transparent pt-px leading-none font-extrabold tracking-[0px] text-[#0B2F1D] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [-webkit-tap-highlight-color:transparent]",
  regular: "px-2.5 text-[10.5px]",
  compact: "px-2 text-[9.75px]",
  smallRegular: "max-[380px]:h-6 max-[380px]:px-1.5 max-[380px]:text-[8.75px]",
  smallCompact: "max-[380px]:h-6.5 max-[380px]:px-2 max-[380px]:text-[9px]",
  proCompact:
    "[@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:h-7 [@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:px-2 [@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:text-[9px]",
  largeCompact:
    "[@media(min-width:401px)_and_(min-height:880px)]:h-7 [@media(min-width:401px)_and_(min-height:880px)]:px-1.75 [@media(min-width:401px)_and_(min-height:880px)]:text-[10.5px]",
} as const;

const FULLSCREEN_AUTHOR_TEXT = {
  usernameBase:
    "block max-w-full font-bold tracking-[-0.2px] whitespace-nowrap text-[#15291C]",
  usernameRegular: "text-sm",
  usernameCompact: "text-[13px]",
  usernameSmallCompact: "max-[380px]:text-[11.25px]",
  usernameProCompact:
    "[@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:text-[11.5px]",
  metaBase:
    "mt-px block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#5C6B62]",
  metaRegular: "text-[11.5px]",
  metaCompact: "text-[10.75px]",
  metaSmallCompact: "max-[380px]:text-[10px]",
  metaProCompact:
    "[@media(min-width:381px)_and_(max-width:400px)_and_(max-height:860px)]:text-[10.25px]",
} as const;

export type PostCardHeaderProps = {
  post: Post;
  brand?: string;
  currentUser: string | null;
  expanded?: boolean;
  isAuthorFollowed: boolean;
  isFollowPending?: boolean;
  sharePulse: number;
  morePulse: number;
  shouldReduceMotion: boolean | null;
  onFollowToggle: (author: string, nextFollowing: boolean) => Promise<void>;
  onShareClick: () => void;
  onMoreClick: () => void;
  onBackClick?: () => void;
};

function formatFullscreenAuthorMeta(when: string) {
  const normalizedWhen = when.trim();

  if (normalizedWhen.toLowerCase().includes("назад")) {
    return normalizedWhen;
  }

  if (/^\d+\s*(?:с|сек|м|мин|ч|д|дн|нед|мес|г|год)(?:\s|$)/i.test(normalizedWhen)) {
    return `${normalizedWhen} назад`;
  }

  return normalizedWhen;
}

function FullscreenHeaderGlass({ children }: { children: ReactNode }) {
  return (
    <div className={FULLSCREEN_HEADER_GLASS.outer}>
      <GlassSurface
        className={FULLSCREEN_HEADER_GLASS.surface}
        contentClassName={FULLSCREEN_HEADER_GLASS.content}
        highlightClassName={FULLSCREEN_HEADER_GLASS.highlight}
        tintClassName={FULLSCREEN_HEADER_GLASS.tint}
      >
        {children}
      </GlassSurface>
    </div>
  );
}

export function PostCardHeader({
  post,
  brand = "#2ECC71",
  currentUser,
  expanded = false,
  isAuthorFollowed,
  isFollowPending = false,
  sharePulse,
  morePulse,
  shouldReduceMotion,
  onFollowToggle,
  onShareClick,
  onMoreClick,
  onBackClick,
}: PostCardHeaderProps) {
  const shouldCompactAuthor =
    expanded && post.user.length >= FULLSCREEN_COMPACT_AUTHOR_LENGTH;
  const shouldCompactAuthorOnSmallScreen =
    expanded && post.user.length >= FULLSCREEN_SMALL_COMPACT_AUTHOR_LENGTH;
  const authorMeta = expanded
    ? formatFullscreenAuthorMeta(post.when)
    : `${post.realName} · ${post.when}`;
  const canShowSubscribeButton =
    expanded && currentUser !== null && currentUser !== post.user;

  const headerContent = (
    <>
      {expanded && (
        <motion.button
          type="button"
          aria-label="Назад в ленту"
          title="Назад"
          onClick={onBackClick}
          className={cn(
            "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#15291C] outline-none",
            "border border-white/65 bg-white/58 shadow-[0_8px_20px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.86),inset_-1px_-1px_0_rgba(255,255,255,0.28)]",
            "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
          )}
          whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
        >
          <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
        </motion.button>
      )}
      <UserAvatar name={post.user} size={34} />
      <div className="flex min-w-0 flex-1 flex-col items-start text-left">
        <div
          className={cn(
            FULLSCREEN_AUTHOR_TEXT.usernameBase,
            shouldCompactAuthor
              ? FULLSCREEN_AUTHOR_TEXT.usernameCompact
              : FULLSCREEN_AUTHOR_TEXT.usernameRegular,
            shouldCompactAuthorOnSmallScreen &&
              FULLSCREEN_AUTHOR_TEXT.usernameSmallCompact,
            shouldCompactAuthor &&
              FULLSCREEN_AUTHOR_TEXT.usernameProCompact
          )}
        >
          <span>{post.user}</span>
        </div>
        <div
          className={cn(
            FULLSCREEN_AUTHOR_TEXT.metaBase,
            shouldCompactAuthor
              ? FULLSCREEN_AUTHOR_TEXT.metaCompact
              : FULLSCREEN_AUTHOR_TEXT.metaRegular,
            shouldCompactAuthorOnSmallScreen &&
              FULLSCREEN_AUTHOR_TEXT.metaSmallCompact,
            shouldCompactAuthor &&
              FULLSCREEN_AUTHOR_TEXT.metaProCompact
          )}
        >
          {authorMeta}
        </div>
      </div>
      {canShowSubscribeButton && (
        <SubscribeButton
          author={post.user}
          brand={brand}
          pending={isFollowPending}
          shouldCompactAuthor={shouldCompactAuthor}
          shouldCompactAuthorOnSmallScreen={shouldCompactAuthorOnSmallScreen}
          shouldReduceMotion={shouldReduceMotion}
          subscribed={isAuthorFollowed}
          onToggle={onFollowToggle}
        />
      )}
      <IconPulseButton
        ariaLabel="Поделиться"
        icon={Share2}
        iconClassName="size-[17px]"
        onClick={onShareClick}
        pulse={sharePulse}
        shouldReduceMotion={shouldReduceMotion}
        title="Поделиться"
        wrapperClassName="size-[17px]"
      />
      <DropdownMenu
        onOpenChange={(open) => {
          if (open) {
            onMoreClick();
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Ещё"
            aria-label="Ещё"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C] outline-none transition-colors hover:bg-[rgba(20,40,28,0.09)] focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
          >
            <motion.span
              key={`Ещё-${morePulse}`}
              className="grid size-4 place-items-center"
              animate={
                morePulse > 0 && canAnimate(shouldReduceMotion)
                  ? ICON_PULSE_ANIMATION
                  : { scale: 1 }
              }
              transition={ICON_PULSE_TRANSITION}
            >
              <MoreVertical className="size-4" strokeWidth={2} />
            </motion.span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={7}
          className={cn(
            "w-[178px] translate-x-1.5 rounded-[15px] border-0 bg-[#FFF8FC] p-1.5 text-[#15291C] outline-none ring-0",
            "shadow-[0_12px_28px_rgba(20,40,28,0.16)]",
            "backdrop-blur-none backdrop-saturate-100",
            "data-open:animate-none data-closed:animate-none data-open:zoom-in-100 data-closed:zoom-out-100"
          )}
        >
          <DropdownMenuItem
            className={cn(
              "h-10 cursor-pointer rounded-[12px] px-2.5 text-[13px] font-extrabold tracking-[0px] text-[#B63B34] outline-none",
              "focus:bg-[#15291C]/8 focus:text-[#9F2E28]",
              "data-[highlighted]:bg-[#15291C]/8 data-[highlighted]:text-[#9F2E28]",
              "active:bg-[#15291C]/10"
            )}
          >
            <Flag className="size-4 text-[#E5443B]" strokeWidth={2.2} />
            <span>Пожаловаться</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  if (expanded) {
    return <FullscreenHeaderGlass>{headerContent}</FullscreenHeaderGlass>;
  }

  return (
    <div className="flex items-center gap-2.5 px-3 pt-3 pr-3 pb-2.5 pl-3.5">
      {headerContent}
    </div>
  );
}

type SubscribeButtonProps = {
  author: string;
  brand: string;
  pending: boolean;
  shouldCompactAuthor: boolean;
  shouldCompactAuthorOnSmallScreen: boolean;
  shouldReduceMotion: boolean | null;
  subscribed: boolean;
  onToggle: (author: string, nextFollowing: boolean) => Promise<void>;
};

function SubscribeButton({
  author,
  brand,
  pending,
  shouldCompactAuthor,
  shouldCompactAuthorOnSmallScreen,
  shouldReduceMotion,
  subscribed,
  onToggle,
}: SubscribeButtonProps) {
  const scaleControls = useAnimationControls();
  const [isAnimating, setIsAnimating] = useState(false);
  const shouldAnimate = canAnimate(shouldReduceMotion);
  const isBusy = pending || isAnimating;
  const label = subscribed ? "Отписаться" : "Подписаться";

  function pressSubscribeButton() {
    if (!shouldAnimate || isBusy) {
      return;
    }

    void scaleControls.start({
      scale: 0.94,
      transition: SUBSCRIBE_PRESS_TRANSITION,
    });
  }

  function releaseSubscribeButton() {
    if (!shouldAnimate) {
      return;
    }

    void scaleControls.start({
      scale: 1,
      transition: SUBSCRIBE_RETURN_TRANSITION,
    });
  }

  async function handleSubscribeClick() {
    if (isBusy) {
      return;
    }

    setIsAnimating(true);

    if (!shouldAnimate) {
      try {
        await onToggle(author, !subscribed);
      } finally {
        setIsAnimating(false);
      }

      return;
    }

    try {
      await scaleControls.start({
        scale: 1,
        transition: SUBSCRIBE_RETURN_TRANSITION,
      });
      await onToggle(author, !subscribed);
    } finally {
      window.setTimeout(() => {
        setIsAnimating(false);
      }, SUBSCRIBE_STATE_SETTLE_MS);
    }
  }

  function handleSubscribeKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    pressSubscribeButton();
  }

  function handleSubscribeKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    releaseSubscribeButton();
  }

  return (
    <motion.button
      type="button"
      aria-label={label}
      aria-busy={pending}
      aria-pressed={subscribed}
      disabled={isBusy}
      title={label}
      className={cn(
        FULLSCREEN_SUBSCRIBE_BUTTON.base,
        "disabled:cursor-not-allowed disabled:opacity-70",
        shouldCompactAuthor
          ? FULLSCREEN_SUBSCRIBE_BUTTON.compact
          : FULLSCREEN_SUBSCRIBE_BUTTON.regular,
        shouldCompactAuthorOnSmallScreen
          ? FULLSCREEN_SUBSCRIBE_BUTTON.smallCompact
          : FULLSCREEN_SUBSCRIBE_BUTTON.smallRegular,
        shouldCompactAuthor &&
          FULLSCREEN_SUBSCRIBE_BUTTON.proCompact,
        shouldCompactAuthor &&
          FULLSCREEN_SUBSCRIBE_BUTTON.largeCompact
      )}
      animate={scaleControls}
      initial={{ scale: 1 }}
      onClick={handleSubscribeClick}
      onKeyDown={handleSubscribeKeyDown}
      onKeyUp={handleSubscribeKeyUp}
      onPointerCancel={releaseSubscribeButton}
      onPointerDown={pressSubscribeButton}
      onPointerLeave={releaseSubscribeButton}
      onPointerUp={releaseSubscribeButton}
      style={{
        boxShadow: `0 8px 18px ${brand}1F, inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)`,
      }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-full"
        animate={{ opacity: subscribed ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(120deg, ${brand}E6, rgba(122,236,164,0.78), rgba(100,218,189,0.66), ${brand}A8)`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-full"
        animate={{ opacity: subscribed ? 0 : 1 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(135deg, ${brand}72 0%, rgba(189,247,208,0.68) 85%, ${brand}35 100%)`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-full"
        animate={{ opacity: subscribed ? 1 : 0 }}
        transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(226,255,235,0.78))",
        }}
      />
      <span
        aria-hidden="true"
        className="relative z-[1] grid place-items-center"
      >
        <motion.span
          className="[grid-area:1/1] whitespace-nowrap"
          animate={{
            opacity: subscribed ? 0 : 1,
            y: shouldAnimate && subscribed ? -2 : 0,
          }}
          transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        >
          Подписаться
        </motion.span>
        <motion.span
          className="[grid-area:1/1] whitespace-nowrap"
          animate={{
            opacity: subscribed ? 1 : 0,
            y: shouldAnimate && subscribed ? 0 : 2,
          }}
          transition={shouldAnimate ? SUBSCRIBE_STATE_TRANSITION : { duration: 0 }}
        >
          Отписаться
        </motion.span>
      </span>
    </motion.button>
  );
}

type IconPulseButtonProps = {
  ariaLabel: string;
  icon: LucideIcon;
  iconClassName: string;
  pulse: number;
  shouldReduceMotion: boolean | null;
  title: string;
  wrapperClassName: string;
  onClick: () => void;
};

function IconPulseButton({
  ariaLabel,
  icon: Icon,
  iconClassName,
  pulse,
  shouldReduceMotion,
  title,
  wrapperClassName,
  onClick,
}: IconPulseButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
    >
      <motion.span
        key={`${ariaLabel}-${pulse}`}
        className={cn("grid place-items-center", wrapperClassName)}
        animate={
          pulse > 0 && canAnimate(shouldReduceMotion)
            ? ICON_PULSE_ANIMATION
            : { scale: 1 }
        }
        transition={ICON_PULSE_TRANSITION}
      >
        <Icon className={iconClassName} strokeWidth={2} />
      </motion.span>
    </button>
  );
}
