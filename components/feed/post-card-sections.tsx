import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { motion, type MotionValue, type PanInfo } from "motion/react";
import { type KeyboardEvent, type RefObject } from "react";

import { DishPhoto } from "@/components/feed/dish-photo";
import { UserAvatar } from "@/components/feed/user-avatar";
import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TEXT_PRIMARY = "#15291C";
const HEART_COLOR = "#E5443B";
const STAR_COLOR = "#FFB400";
const ICON_PULSE_ANIMATION = { scale: [1, 0.86, 1.08, 1] };
const ICON_PULSE_TRANSITION = { duration: 0.28, ease: "easeOut" } as const;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

type PostCardHeaderProps = {
  post: Post;
  sharePulse: number;
  morePulse: number;
  shouldReduceMotion: boolean | null;
  onShareClick: () => void;
  onMoreClick: () => void;
};

export function PostCardHeader({
  post,
  sharePulse,
  morePulse,
  shouldReduceMotion,
  onShareClick,
  onMoreClick,
}: PostCardHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-3 pt-3 pr-3 pb-2.5 pl-3.5">
      <UserAvatar name={post.user} size={34} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 overflow-hidden text-sm font-bold tracking-[-0.2px] text-ellipsis whitespace-nowrap text-[#15291C]">
          <span>{post.user}</span>
        </div>
        <div className="mt-px text-[11.5px] font-medium text-[#5C6B62]">
          {post.realName} · {post.when}
        </div>
      </div>
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
      <IconPulseButton
        ariaLabel="Ещё"
        icon={MoreHorizontal}
        iconClassName="size-4"
        onClick={onMoreClick}
        pulse={morePulse}
        shouldReduceMotion={shouldReduceMotion}
        title="Ещё"
        wrapperClassName="size-4"
      />
    </div>
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
      className="grid size-8 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
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

type PhotoCarouselProps = {
  post: Post;
  photoHeight: number;
  hasPhotoSlider: boolean;
  canDragToNextPhoto: boolean;
  canDragToPreviousPhoto: boolean;
  photoWidth: number;
  photoIndicatorIdx: number;
  photoTrackX: MotionValue<number>;
  photoViewportRef: RefObject<HTMLDivElement | null>;
  trackPhotoIndexes: number[];
  onPhotoDragStart: () => void;
  onPhotoDrag: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onPhotoDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
};

export function PhotoCarousel({
  post,
  photoHeight,
  hasPhotoSlider,
  canDragToNextPhoto,
  canDragToPreviousPhoto,
  photoWidth,
  photoIndicatorIdx,
  photoTrackX,
  photoViewportRef,
  trackPhotoIndexes,
  onPhotoDragStart,
  onPhotoDrag,
  onPhotoDragEnd,
}: PhotoCarouselProps) {
  return (
    <div className="relative mx-3 overflow-hidden rounded-[18px]">
      <div
        ref={photoViewportRef}
        className={cn(
          "relative select-none overflow-hidden",
          hasPhotoSlider && "cursor-grab active:cursor-grabbing"
        )}
        style={{ height: photoHeight }}
      >
        <motion.div
          drag={hasPhotoSlider ? "x" : false}
          dragConstraints={{
            left: canDragToNextPhoto ? -photoWidth * 2 : -photoWidth,
            right: canDragToPreviousPhoto ? 0 : -photoWidth,
          }}
          dragElastic={0}
          dragMomentum={false}
          dragDirectionLock
          onDragStart={onPhotoDragStart}
          onDrag={onPhotoDrag}
          onDragEnd={onPhotoDragEnd}
          className="absolute inset-y-0 left-0 flex h-full w-[300%] [touch-action:pan-y]"
          style={{ x: photoTrackX }}
        >
          {trackPhotoIndexes.map((trackPhotoIdx, trackPosition) => (
            <div
              key={`${trackPosition}-${trackPhotoIdx}`}
              aria-hidden={trackPosition !== 1}
              className="-mr-px h-full w-[calc(100%/3+1px)] shrink-0 overflow-hidden"
            >
              <DishPhoto
                seed={post.seed + trackPhotoIdx}
                height={photoHeight}
                label={`dish photo ${trackPhotoIdx + 1} / ${post.photos} · ${post.dish.toLowerCase()}`}
                labelClassName={
                  hasPhotoSlider
                    ? "right-3 left-auto max-w-[calc(100%-6.75rem)] overflow-hidden text-right text-ellipsis whitespace-nowrap"
                    : undefined
                }
              />
            </div>
          ))}
        </motion.div>
      </div>
      {hasPhotoSlider && (
        <PhotoIndicator count={post.photos} photoIndicatorIdx={photoIndicatorIdx} />
      )}
    </div>
  );
}

type PhotoIndicatorProps = {
  count: number;
  photoIndicatorIdx: number;
};

function PhotoIndicator({ count, photoIndicatorIdx }: PhotoIndicatorProps) {
  return (
    <div className="pointer-events-none absolute bottom-2.5 left-3 flex justify-start gap-1.5 rounded-full bg-black/15 p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.16)] backdrop-blur-[10px]">
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === photoIndicatorIdx;

        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-full transition-[width] duration-200",
              isActive
                ? "w-[22px] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
                : "w-1.5 bg-white/55"
            )}
          />
        );
      })}
    </div>
  );
}

type EngagementBarProps = {
  post: Post;
  brand: string;
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
  return (
    <div className="flex items-center gap-4 px-4 pt-3 pb-2">
      <motion.button
        type="button"
        aria-pressed={liked}
        onClick={onLikeClick}
        className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
        whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
      >
        <motion.span
          key={`like-${likePulse}`}
          className="relative grid size-[22px] place-items-center"
          animate={
            liked && canAnimate(shouldReduceMotion)
              ? { scale: [1, 1.24, 0.96, 1], rotate: [0, -7, 4, 0] }
              : { scale: 1, rotate: 0 }
          }
          transition={{ duration: 0.42, ease: "easeOut" }}
        >
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#E5443B]/45"
            animate={
              liked && canAnimate(shouldReduceMotion)
                ? { scale: [0.55, 1.85], opacity: [0.45, 0] }
                : { scale: 0.55, opacity: 0 }
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
          className="text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]"
          animate={
            liked && canAnimate(shouldReduceMotion)
              ? { y: [0, -1, 0], opacity: [0.82, 1] }
              : { y: 0, opacity: 1 }
          }
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          {likeCount.toLocaleString("ru-RU")}
        </motion.span>
      </motion.button>

      <motion.button
        type="button"
        onClick={onCommentClick}
        className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
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
        className="relative ml-auto grid size-9 cursor-pointer place-items-center overflow-hidden rounded-[10px] transition-colors"
        style={{
          backgroundColor: saved ? `${brand}22` : "rgba(20,40,28,0.06)",
          color: saved ? brand : TEXT_PRIMARY,
        }}
      >
        <motion.span
          key={`save-glow-${savePulse}`}
          aria-hidden="true"
          className="absolute inset-0 rounded-[10px]"
          animate={
            saved && canAnimate(shouldReduceMotion)
              ? { opacity: [0, 0.28, 0], scale: [0.72, 1.15, 1.26] }
              : { opacity: 0, scale: 0.72 }
          }
          transition={{ duration: 0.46, ease: "easeOut" }}
          style={{
            background: `radial-gradient(circle at 50% 45%, ${brand} 0%, transparent 66%)`,
          }}
        />
        <motion.span
          key={`save-${savePulse}`}
          className="relative grid size-[18px] place-items-center"
          animate={
            saved && canAnimate(shouldReduceMotion)
              ? { y: [0, -2, 0], scale: [1, 1.2, 0.98, 1] }
              : { y: 0, scale: 1 }
          }
          transition={{ duration: 0.38, ease: "easeOut" }}
        >
          <Bookmark
            className="size-[18px]"
            strokeWidth={2}
            color={saved ? brand : TEXT_PRIMARY}
            fill={saved ? brand : "none"}
          />
        </motion.span>
      </motion.button>
    </div>
  );
}

type PostDetailsProps = {
  post: Post;
  brand: string;
};

export function PostDetails({ post, brand }: PostDetailsProps) {
  return (
    <>
      <div className="px-4 pb-1">
        <h3 className="text-[19px] leading-[1.2] font-extrabold tracking-[-0.4px] text-[#15291C]">
          {post.dish}
        </h3>
      </div>

      <div className="px-4 pt-1 pb-2.5">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-[9px] bg-[rgba(20,40,28,0.05)] px-2.5 py-[5px] text-[12.5px] font-semibold text-[#13251a]">
          <MapPin className="size-[11px] shrink-0" strokeWidth={2.2} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {post.place}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-2.5">
        <div
          className={cn(
            "relative isolate inline-flex rounded-[9px] p-px",
            "bg-[rgba(83,145,105,0.10)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,1),0_10px_28px_rgba(20,40,28,0.012)]"
          )}
          style={{
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0), 0 10px 28px rgba(20,40,28,0.012), -4px 6px 24px ${brand}05`,
          }}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5",
              "border-0",
              "bg-[linear-gradient(130deg,rgba(220,255,232,0.3),rgba(232,255,240,0.95))]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0),inset_0_-1px_0_rgba(20,40,28,0)]",
              "backdrop-blur-[14px] backdrop-saturate-[190%]"
            )}
          >
            <span className="text-[10.5px] font-bold tracking-[0.38px] text-[#647268] uppercase">
              Цена
            </span>
            <span className="text-[16.5px] leading-none font-extrabold tracking-[-0.18px] text-[#203829] tabular-nums">
              {post.price}
            </span>
          </span>
        </div>
        <div className="inline-flex items-baseline gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.4px] text-[#5C6B62] uppercase">
            Оценка
          </span>
          <span className="inline-flex items-center gap-1 text-[18px] font-extrabold tracking-[-0.3px] text-[#15291C]">
            <Star
              className="size-3.5"
              color={STAR_COLOR}
              fill={STAR_COLOR}
              strokeWidth={0}
            />{" "}
            {post.rating}
          </span>
        </div>
      </div>

      <p className="mx-3 mb-3 rounded-[14px] bg-[rgba(20,40,28,0.04)] px-3 py-2.5 font-[family-name:var(--font-roboto)] text-[15px] leading-[1.62] font-medium text-pretty text-[#15291C]">
        {post.text}
      </p>
    </>
  );
}

type PostTagsProps = {
  mainTag?: string;
  restTags: string[];
  brand: string;
  shouldReduceMotion: boolean | null;
  onTagClick: () => void;
};

export function PostTags({
  mainTag,
  restTags,
  brand,
  shouldReduceMotion,
  onTagClick,
}: PostTagsProps) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-1.5 px-3.5 pb-3.5">
      {mainTag && (
        <TagButton
          isMain
          brand={brand}
          onClick={onTagClick}
          shouldReduceMotion={shouldReduceMotion}
        >
          {mainTag}
        </TagButton>
      )}
      {restTags.map((tag) => (
        <TagButton
          key={tag}
          brand={brand}
          onClick={onTagClick}
          shouldReduceMotion={shouldReduceMotion}
        >
          {tag}
        </TagButton>
      ))}
    </div>
  );
}

type TagButtonProps = {
  children: string;
  brand: string;
  isMain?: boolean;
  shouldReduceMotion: boolean | null;
  onClick: () => void;
};

function TagButton({
  children,
  brand,
  isMain = false,
  shouldReduceMotion,
  onClick,
}: TagButtonProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "origin-center translate-z-0 cursor-pointer select-none border-0 outline-none will-change-transform",
        "inline-flex items-center justify-center rounded-full",
        "transition-transform duration-150 ease-out [backface-visibility:hidden] [-webkit-tap-highlight-color:transparent]",
        canAnimate(shouldReduceMotion) && "active:scale-[0.94]",
        isMain
          ? "h-7 bg-[linear-gradient(135deg,#BDF7D0,#73E89F)] px-3 text-[12.5px] font-extrabold tracking-[-0.1px] text-[#06301A]"
          : "h-[26px] bg-[rgba(46,204,113,0.14)] px-2.5 text-[11.5px] font-bold tracking-[-0.1px] text-[#0E8A4F]"
      )}
      style={
        isMain
          ? {
              boxShadow: `0 4px 12px ${brand}33, inset 1px 1px 0 rgba(255,255,255,0.65)`,
            }
          : undefined
      }
    >
      <span
        className={cn(
          "flex h-full items-center justify-center",
          isMain ? "leading-[28px]" : "leading-[26px]"
        )}
      >
        {children}
      </span>
    </button>
  );
}
