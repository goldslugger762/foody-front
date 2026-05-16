import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import {
  HEART_COLOR,
  ICON_PULSE_ANIMATION,
  ICON_PULSE_TRANSITION,
  TEXT_PRIMARY,
  canAnimate,
} from "./post-card-shared";

const LIKE_ICON_ACTIVE_ANIMATION = {
  rotate: [0, -7, 4, 0],
  scale: [1, 1.24, 0.96, 1],
};
const LIKE_ICON_IDLE_ANIMATION = { rotate: 0, scale: 1 };
const LIKE_RING_ACTIVE_ANIMATION = {
  opacity: [0.45, 0],
  scale: [0.55, 1.85],
};
const LIKE_RING_IDLE_ANIMATION = { opacity: 0, scale: 0.55 };
const LIKE_COUNT_ACTIVE_ANIMATION = {
  opacity: [0.82, 1],
  y: [0, -1, 0],
};
const LIKE_COUNT_IDLE_ANIMATION = { opacity: 1, y: 0 };
const SAVE_ICON_ACTIVE_ANIMATION = {
  scale: [1, 1.2, 0.98, 1],
  y: [0, -2, 0],
};
const SAVE_ICON_IDLE_ANIMATION = { scale: 1, y: 0 };
const FULLSCREEN_SAVE_GLOW_ACTIVE_ANIMATION = {
  opacity: [0, 0.36, 0],
  scale: [0.72, 1.18, 1.32],
};
const COLLAPSED_SAVE_GLOW_ACTIVE_ANIMATION = {
  opacity: [0, 0.28, 0],
  scale: [0.72, 1.15, 1.26],
};
const SAVE_GLOW_IDLE_ANIMATION = { opacity: 0, scale: 0.72 };

const FULLSCREEN_ACTION_BUTTON_CLASS =
  "inline-flex h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-3 text-[#15291C] outline-none backdrop-blur-[20px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [@media(max-width:430px)_and_(max-height:860px)]:h-11";
const COLLAPSED_ACTION_BUTTON_CLASS =
  "inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0";
const FULLSCREEN_SAVE_BUTTON_CLASS =
  "relative grid h-12 min-w-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/65 px-4 text-[#06301A] outline-none backdrop-blur-[20px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [@media(max-width:430px)_and_(max-height:860px)]:h-11";
const COLLAPSED_SAVE_BUTTON_CLASS =
  "relative ml-auto grid size-9 cursor-pointer place-items-center overflow-hidden rounded-[10px] transition-colors [@media(max-width:430px)_and_(max-height:860px)]:size-8";

export type EngagementBarProps = {
  post: Post;
  brand: string;
  fullscreen?: boolean;
  liked: boolean;
  saved: boolean;
  likeCount: number;
  likePulse: number;
  commentPulse: number;
  savePulse: number;
  shouldReduceMotion: boolean | null;
  onLikeClick: () => void;
  onCommentClick: () => void;
  onSaveClick: () => void;
};

export function EngagementBar({
  post,
  brand,
  fullscreen = false,
  liked,
  saved,
  likeCount,
  likePulse,
  commentPulse,
  savePulse,
  shouldReduceMotion,
  onLikeClick,
  onCommentClick,
  onSaveClick,
}: EngagementBarProps) {
  if (fullscreen) {
    const actionPillStyle = {
      background: `linear-gradient(rgba(255,255,255,0.62), rgba(255,255,255,0.36)) padding-box, linear-gradient(135deg, ${brand}D9, rgba(255,255,255,0.86), ${brand}70) border-box`,
      boxShadow: `0 12px 28px rgba(20,40,28,0.14), 0 4px 16px ${brand}18, inset 1px 1px 0 rgba(255,255,255,0.82), inset -1px -1px 0 rgba(255,255,255,0.2)`,
    };

    return (
      <div className="shrink-0 px-3.5 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.875rem)] [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pt-2.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-[calc(env(safe-area-inset-bottom)+0.625rem)]">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_58px] items-center gap-2.5 max-[360px]:gap-2">
          <motion.button
            type="button"
            aria-pressed={liked}
            onClick={onLikeClick}
            className={FULLSCREEN_ACTION_BUTTON_CLASS}
            style={actionPillStyle}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
          >
            <LikeActionContent
              fullscreen
              liked={liked}
              likeCount={likeCount}
              pulse={likePulse}
              shouldReduceMotion={shouldReduceMotion}
            />
          </motion.button>

          <motion.button
            type="button"
            onClick={onCommentClick}
            className={FULLSCREEN_ACTION_BUTTON_CLASS}
            style={actionPillStyle}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
          >
            <span className="grid size-5 shrink-0 place-items-center">
              <MessageCircle
                className="size-5"
                strokeWidth={2}
                color={TEXT_PRIMARY}
              />
            </span>
            <span className="min-w-0 truncate text-[13.5px] font-extrabold tracking-[-0.1px] tabular-nums text-[#15291C]">
              {post.comments}
            </span>
          </motion.button>

          <motion.button
            type="button"
            aria-pressed={saved}
            title="В избранное"
            aria-label="В избранное"
            onClick={onSaveClick}
            className={FULLSCREEN_SAVE_BUTTON_CLASS}
            style={{
              background: saved
                ? `linear-gradient(135deg, ${brand}, #1FA85C)`
                : `linear-gradient(135deg, ${brand}4D, rgba(255,255,255,0.66))`,
              boxShadow: `0 12px 28px ${brand}30, inset 1px 1px 0 rgba(255,255,255,0.7), inset -1px -1px 0 rgba(11,47,29,0.08)`,
            }}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
          >
            <SaveActionIcon
              fullscreen
              brand={brand}
              pulse={savePulse}
              saved={saved}
              shouldReduceMotion={shouldReduceMotion}
            />
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 pt-3 pb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:pt-2.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-1.5">
      <motion.button
        type="button"
        aria-pressed={liked}
        onClick={onLikeClick}
        className={COLLAPSED_ACTION_BUTTON_CLASS}
        whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
      >
        <LikeActionContent
          liked={liked}
          likeCount={likeCount}
          pulse={likePulse}
          shouldReduceMotion={shouldReduceMotion}
        />
      </motion.button>

      <motion.button
        type="button"
        onClick={onCommentClick}
        className={COLLAPSED_ACTION_BUTTON_CLASS}
      >
        <motion.span
          key={`comment-${commentPulse}`}
          className="grid size-5 place-items-center"
          animate={
            commentPulse > 0 && canAnimate(shouldReduceMotion)
              ? ICON_PULSE_ANIMATION
              : { scale: 1 }
          }
          transition={ICON_PULSE_TRANSITION}
        >
          <MessageCircle className="size-5" strokeWidth={2} color={TEXT_PRIMARY} />
        </motion.span>
        <span className="text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]">
          {post.comments}
        </span>
      </motion.button>

      <motion.button
        type="button"
        aria-pressed={saved}
        title="В избранное"
        aria-label="В избранное"
        onClick={onSaveClick}
        className={COLLAPSED_SAVE_BUTTON_CLASS}
        style={{
          backgroundColor: saved ? `${brand}22` : "rgba(20,40,28,0.06)",
          color: saved ? brand : TEXT_PRIMARY,
        }}
      >
        <SaveActionIcon
          brand={brand}
          pulse={savePulse}
          saved={saved}
          shouldReduceMotion={shouldReduceMotion}
        />
      </motion.button>
    </div>
  );
}

type LikeActionContentProps = {
  liked: boolean;
  likeCount: number;
  pulse: number;
  shouldReduceMotion: boolean | null;
  fullscreen?: boolean;
};

function LikeActionContent({
  liked,
  likeCount,
  pulse,
  shouldReduceMotion,
  fullscreen = false,
}: LikeActionContentProps) {
  const shouldAnimate = liked && canAnimate(shouldReduceMotion);
  const keyPrefix = fullscreen ? "fullscreen-like" : "like";

  return (
    <>
      <motion.span
        key={`${keyPrefix}-${pulse}`}
        className={cn(
          "relative grid size-[22px] place-items-center",
          fullscreen && "shrink-0"
        )}
        animate={
          shouldAnimate
            ? LIKE_ICON_ACTIVE_ANIMATION
            : LIKE_ICON_IDLE_ANIMATION
        }
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-[#E5443B]/45"
          animate={
            shouldAnimate
              ? LIKE_RING_ACTIVE_ANIMATION
              : LIKE_RING_IDLE_ANIMATION
          }
          transition={{ duration: 0.42, ease: "easeOut" }}
        />
        <Heart
          className="relative size-[22px]"
          strokeWidth={2}
          color={liked ? HEART_COLOR : TEXT_PRIMARY}
          fill={liked ? HEART_COLOR : "none"}
        />
      </motion.span>
      <motion.span
        className={
          fullscreen
            ? "min-w-0 truncate text-[13.5px] font-extrabold tracking-[-0.1px] tabular-nums text-[#15291C]"
            : "text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]"
        }
        animate={
          shouldAnimate
            ? LIKE_COUNT_ACTIVE_ANIMATION
            : LIKE_COUNT_IDLE_ANIMATION
        }
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        {likeCount.toLocaleString("ru-RU")}
      </motion.span>
    </>
  );
}

type SaveActionIconProps = {
  brand: string;
  pulse: number;
  saved: boolean;
  shouldReduceMotion: boolean | null;
  fullscreen?: boolean;
};

function SaveActionIcon({
  brand,
  pulse,
  saved,
  shouldReduceMotion,
  fullscreen = false,
}: SaveActionIconProps) {
  const shouldAnimate = saved && canAnimate(shouldReduceMotion);
  const keyPrefix = fullscreen ? "fullscreen-save" : "save";

  return (
    <>
      <motion.span
        key={`${keyPrefix}-glow-${pulse}`}
        aria-hidden="true"
        className={cn(
          "absolute inset-0",
          fullscreen ? "rounded-full" : "rounded-[10px]"
        )}
        animate={
          shouldAnimate
            ? fullscreen
              ? FULLSCREEN_SAVE_GLOW_ACTIVE_ANIMATION
              : COLLAPSED_SAVE_GLOW_ACTIVE_ANIMATION
            : SAVE_GLOW_IDLE_ANIMATION
        }
        transition={{ duration: 0.46, ease: "easeOut" }}
        style={{
          background: fullscreen
            ? "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95) 0%, transparent 66%)"
            : `radial-gradient(circle at 50% 45%, ${brand} 0%, transparent 66%)`,
        }}
      />
      <motion.span
        key={`${keyPrefix}-${pulse}`}
        className={cn(
          "relative grid place-items-center",
          fullscreen ? "size-5" : "size-[18px]"
        )}
        animate={
          shouldAnimate
            ? SAVE_ICON_ACTIVE_ANIMATION
            : SAVE_ICON_IDLE_ANIMATION
        }
        transition={{ duration: 0.38, ease: "easeOut" }}
      >
        <Bookmark
          className={fullscreen ? "size-5" : "size-[18px]"}
          strokeWidth={2}
          color={
            fullscreen
              ? saved
                ? "#FFFFFF"
                : "#06301A"
              : saved
                ? brand
                : TEXT_PRIMARY
          }
          fill={
            fullscreen
              ? saved
                ? "#FFFFFF"
                : brand
              : saved
                ? brand
                : "none"
          }
        />
      </motion.span>
    </>
  );
}
