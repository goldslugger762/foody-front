import {
  ArrowLeft,
  Bookmark,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Share2,
  Star,
  type LucideIcon,
} from "lucide-react";
import { motion, type MotionValue, type PanInfo } from "motion/react";
import {
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";

import { DishPhoto } from "@/components/feed/dish-photo";
import { UserAvatar } from "@/components/feed/user-avatar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const TEXT_PRIMARY = "#15291C";
const HEART_COLOR = "#E5443B";
const STAR_COLOR = "#FFB400";
const ICON_PULSE_ANIMATION = { scale: [1, 0.86, 1.08, 1] };
const ICON_PULSE_TRANSITION = { duration: 0.28, ease: "easeOut" } as const;
const FULLSCREEN_COMPACT_AUTHOR_LENGTH = 11;
const FULLSCREEN_SMALL_COMPACT_AUTHOR_LENGTH = 10;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function formatFullscreenAuthorMeta(when: string) {
  const normalizedWhen = when.trim();

  if (normalizedWhen.toLowerCase().includes("назад")) {
    return normalizedWhen;
  }

  if (/^\d+\s*(?:с|сек|м|мин|ч|д|дн|нед|мес|г|год)(?:\s|$)/i.test(normalizedWhen)) {
    return `${normalizedWhen} · назад`;
  }

  return normalizedWhen;
}

type SharedPostCardViewProps = {
  post: Post;
  brand: string;
  mainTag?: string;
  restTags: string[];
  shouldReduceMotion: boolean | null;
  headerActions: Pick<
    PostCardHeaderProps,
    "morePulse" | "onMoreClick" | "onShareClick" | "sharePulse"
  >;
  photoCarousel: Omit<PhotoCarouselProps, "post">;
  engagement: Omit<
    EngagementBarProps,
    "brand" | "fullscreen" | "post" | "shouldReduceMotion"
  >;
  onTagClick: () => void;
};

type CollapsedPostCardViewProps = SharedPostCardViewProps & {
  onCardClick: (event: ReactMouseEvent<HTMLElement>) => void;
};

export function CollapsedPostCardView({
  post,
  brand,
  mainTag,
  restTags,
  shouldReduceMotion,
  headerActions,
  photoCarousel,
  engagement,
  onCardClick,
  onTagClick,
}: CollapsedPostCardViewProps) {
  return (
    <article
      onClick={onCardClick}
      className={cn(
        "flex flex-1 cursor-pointer flex-col overflow-hidden rounded-[26px]",
        "border border-green-50/92 bg-white/75",
        "shadow-[0_8px_20px_rgba(20,40,28,0.12),0_1px_3px_rgba(20,40,28,0.08),inset_0_1px_0_rgba(255,255,255,0.92),inset_0_0_0_1px_rgba(255,255,255,0.34)]",
        "backdrop-blur-[28px] backdrop-saturate-[190%]"
      )}
    >
      <PostCardHeader
        {...headerActions}
        post={post}
        brand={brand}
        shouldReduceMotion={shouldReduceMotion}
      />

      <PhotoCarousel {...photoCarousel} post={post} />

      <EngagementBar
        {...engagement}
        brand={brand}
        post={post}
        shouldReduceMotion={shouldReduceMotion}
      />

      <PostDetails brand={brand} post={post} />

      <PostTags
        brand={brand}
        mainTag={mainTag}
        onTagClick={onTagClick}
        restTags={restTags}
        shouldReduceMotion={shouldReduceMotion}
      />
    </article>
  );
}

type ExpandedPostCardViewProps = SharedPostCardViewProps & {
  onBackClick: () => void;
};

export function ExpandedPostCardView({
  post,
  brand,
  mainTag,
  restTags,
  shouldReduceMotion,
  headerActions,
  photoCarousel,
  engagement,
  onBackClick,
  onTagClick,
}: ExpandedPostCardViewProps) {
  return (
    <motion.article
      role="dialog"
      aria-modal="true"
      aria-label={post.dish}
      className={cn(
        "fixed inset-0 z-50 flex h-[100dvh] flex-col overflow-hidden",
        "border-0 bg-white/82 text-[#15291C]",
        "shadow-[0_18px_42px_rgba(20,40,28,0.22),inset_0_1px_0_rgba(255,255,255,0.88)]",
        "backdrop-blur-[30px] backdrop-saturate-[190%]"
      )}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      <PostCardHeader
        {...headerActions}
        expanded
        brand={brand}
        onBackClick={onBackClick}
        post={post}
        shouldReduceMotion={shouldReduceMotion}
      />

      <div className="hide-scroll min-h-0 flex-1 overflow-y-auto px-3.5 pb-3 [@media(max-width:430px)_and_(max-height:860px)]:px-3">
        <PhotoCarousel {...photoCarousel} post={post} />

        <div className="pt-2.5 [@media(max-width:430px)_and_(max-height:860px)]:pt-1.5">
          <PostDetails expanded brand={brand} post={post} />
        </div>

        <PostTags
          brand={brand}
          mainTag={mainTag}
          onTagClick={onTagClick}
          restTags={restTags}
          shouldReduceMotion={shouldReduceMotion}
        />
      </div>

      <EngagementBar
        {...engagement}
        fullscreen
        brand={brand}
        post={post}
        shouldReduceMotion={shouldReduceMotion}
      />
    </motion.article>
  );
}

type PostCardHeaderProps = {
  post: Post;
  brand?: string;
  expanded?: boolean;
  sharePulse: number;
  morePulse: number;
  shouldReduceMotion: boolean | null;
  onShareClick: () => void;
  onMoreClick: () => void;
  onBackClick?: () => void;
};

export function PostCardHeader({
  post,
  brand = "#2ECC71",
  expanded = false,
  sharePulse,
  morePulse,
  shouldReduceMotion,
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

  return (
    <div
      className={cn(
        "flex items-center gap-2.5",
        expanded
          ? "shrink-0 px-3.5 pt-[calc(env(safe-area-inset-top)+3.625rem)] pb-3 backdrop-blur-[22px] backdrop-saturate-[180%] max-[409px]:px-3"
          : "px-3 pt-3 pr-3 pb-2.5 pl-3.5"
      )}
    >
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
            "block max-w-full font-bold tracking-[-0.2px] whitespace-nowrap text-[#15291C]",
            shouldCompactAuthor ? "text-[13px]" : "text-sm",
            shouldCompactAuthorOnSmallScreen && "max-[360px]:text-[12.5px]"
          )}
        >
          <span>{post.user}</span>
        </div>
        <div
          className={cn(
            "mt-px block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[#5C6B62]",
            shouldCompactAuthor ? "text-[10.75px]" : "text-[11.5px]",
            shouldCompactAuthorOnSmallScreen && "max-[360px]:text-[10.25px]"
          )}
        >
          {authorMeta}
        </div>
      </div>
      {expanded && (
        <motion.button
          type="button"
          className={cn(
            "h-7 shrink-0 cursor-pointer rounded-full border border-transparent pt-px leading-none font-extrabold tracking-[0px] text-[#0B2F1D] outline-none",
            "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
            shouldCompactAuthor ? "px-2 text-[9.75px]" : "px-2.5 text-[10.5px]",
            "max-[376px]:h-7 max-[376px]:px-2 max-[376px]:text-[8.75px]",
            shouldCompactAuthorOnSmallScreen &&
              "max-[380px]:h-4.5 max-[380px]:px-0.5 max-[380px]:text-[7.75px]"
          )}
          style={{
            background: `linear-gradient(rgba(255,255,255,0.44), rgba(255,255,255,0.24)) padding-box, linear-gradient(135deg, ${brand}B3, rgba(255,255,255,0.72)) border-box`,
            boxShadow: `0 8px 18px ${brand}1F, inset 1px 1px 0 rgba(255,255,255,0.7), inset -1px -1px 0 rgba(255,255,255,0.22)`,
          }}
          whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
        >
          Подписаться
        </motion.button>
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

type PhotoCarouselProps = {
  post: Post;
  photoRatio: number;
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
  photoRatio,
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
    <div className="relative mx-3 overflow-hidden rounded-[18px] [@media(max-width:430px)_and_(max-height:860px)]:mx-2.5">
      <AspectRatio
        ref={photoViewportRef}
        ratio={photoRatio}
        className={cn(
          "select-none overflow-hidden",
          hasPhotoSlider && "cursor-grab active:cursor-grabbing"
        )}
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
          className="absolute inset-y-0 left-0 h-full w-[300%] [touch-action:pan-y]"
          style={{ x: photoTrackX }}
        >
          {trackPhotoIndexes.map((trackPhotoIdx, trackPosition) => (
            <div
              key={`${trackPosition}-${trackPhotoIdx}`}
              aria-hidden={trackPosition !== 1}
              className={cn(
                "absolute inset-y-0 overflow-hidden",
                trackPosition === 0 && "left-0 z-0 w-1/3",
                trackPosition === 1 &&
                  "left-[calc(100%/3-4px)] z-10 w-[calc(100%/3+8px)]",
                trackPosition === 2 && "left-[calc(200%/3)] z-0 w-1/3"
              )}
            >
              <DishPhoto
                seed={post.seed + trackPhotoIdx}
                height="100%"
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
      </AspectRatio>
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
            className="inline-flex h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-3 text-[#15291C] outline-none backdrop-blur-[20px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [@media(max-width:430px)_and_(max-height:860px)]:h-11"
            style={actionPillStyle}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
          >
            <motion.span
              key={`fullscreen-like-${likePulse}`}
              className="relative grid size-[22px] shrink-0 place-items-center"
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
              className="min-w-0 truncate text-[13.5px] font-extrabold tracking-[-0.1px] tabular-nums text-[#15291C]"
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
            className="inline-flex h-12 min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-3 text-[#15291C] outline-none backdrop-blur-[20px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [@media(max-width:430px)_and_(max-height:860px)]:h-11"
            style={actionPillStyle}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
          >
            <motion.span
              key={`fullscreen-comment-${commentPulse}`}
              className="grid size-5 shrink-0 place-items-center"
              animate={
                commentPulse > 0 && canAnimate(shouldReduceMotion)
                  ? ICON_PULSE_ANIMATION
                  : { scale: 1 }
              }
              transition={ICON_PULSE_TRANSITION}
            >
              <MessageCircle
                className="size-5"
                strokeWidth={2}
                color={TEXT_PRIMARY}
              />
            </motion.span>
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
            className="relative grid h-12 min-w-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/65 px-4 text-[#06301A] outline-none backdrop-blur-[20px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [@media(max-width:430px)_and_(max-height:860px)]:h-11"
            style={{
              background: saved
                ? `linear-gradient(135deg, ${brand}, #1FA85C)`
                : `linear-gradient(135deg, ${brand}4D, rgba(255,255,255,0.66))`,
              boxShadow: `0 12px 28px ${brand}30, inset 1px 1px 0 rgba(255,255,255,0.7), inset -1px -1px 0 rgba(11,47,29,0.08)`,
            }}
            whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
          >
            <motion.span
              key={`fullscreen-save-glow-${savePulse}`}
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              animate={
                saved && canAnimate(shouldReduceMotion)
                  ? { opacity: [0, 0.36, 0], scale: [0.72, 1.18, 1.32] }
                  : { opacity: 0, scale: 0.72 }
              }
              transition={{ duration: 0.46, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.95) 0%, transparent 66%)",
              }}
            />
            <motion.span
              key={`fullscreen-save-${savePulse}`}
              className="relative grid size-5 place-items-center"
              animate={
                saved && canAnimate(shouldReduceMotion)
                  ? { y: [0, -2, 0], scale: [1, 1.2, 0.98, 1] }
                  : { y: 0, scale: 1 }
              }
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              <Bookmark
                className="size-5"
                strokeWidth={2}
                color={saved ? "#FFFFFF" : "#06301A"}
                fill={saved ? "#FFFFFF" : brand}
              />
            </motion.span>
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
        className="relative ml-auto grid size-9 cursor-pointer place-items-center overflow-hidden rounded-[10px] transition-colors [@media(max-width:430px)_and_(max-height:860px)]:size-8"
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
  expanded?: boolean;
};

export function PostDetails({ post, brand, expanded = false }: PostDetailsProps) {
  return (
    <>
      <div className="px-4 pb-1 max-[390px]:pb-0.5 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5">
        <h3 className="text-[19px] leading-[1.2] font-extrabold tracking-[-0.4px] text-[#15291C] max-[390px]:text-[18px] [@media(max-width:430px)_and_(max-height:860px)]:text-[17px]">
          {post.dish}
        </h3>
      </div>

      <div className="px-4 pt-1 pb-2.5 max-[390px]:pb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-1.5">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-[9px] bg-[rgba(20,40,28,0.05)] px-2.5 py-[5px] text-[12.5px] font-semibold text-[#13251a]">
          <MapPin className="size-[11px] shrink-0" strokeWidth={2.2} />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {post.place}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-2.5 max-[390px]:pb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-3.5 [@media(max-width:430px)_and_(max-height:860px)]:pb-1.5">
        <div
          className={cn(
            "relative isolate inline-flex rounded-[9px] p-px",
            "bg-[rgba(83,145,105,0.07)]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,1),0_10px_28px_rgba(20,40,28,0.012)]"
          )}
          style={{
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0), 0 10px 28px rgba(20,40,28,0.012), -4px 6px 24px ${brand}05`,
          }}
        >
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:py-1",
              "border-0",
              "bg-[linear-gradient(135deg,rgba(220,255,232,1),rgba(232,255,240,0.60))]",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0),inset_0_-1px_0_rgba(20,40,28,0)]",
              "backdrop-blur-[14px] backdrop-saturate-[100%]"
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

      <p
        className="mx-3 mb-3 rounded-[14px] bg-[rgba(20,40,28,0.04)] px-3 py-2.5 font-[family-name:var(--font-roboto)] text-[15px] leading-[1.62] font-medium text-pretty text-[#15291C] max-[390px]:mb-2 max-[390px]:py-2 max-[390px]:text-[14.5px] max-[390px]:leading-[1.5] [@media(max-width:430px)_and_(max-height:860px)]:mx-2.5 [@media(max-width:430px)_and_(max-height:860px)]:mb-2 [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:py-1.5 [@media(max-width:430px)_and_(max-height:860px)]:text-[14px] [@media(max-width:430px)_and_(max-height:860px)]:leading-[1.42]"
      >
        <span
          className={
            expanded
              ? "block whitespace-pre-wrap"
              : "overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3]"
          }
        >
          {post.text}
        </span>
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
    <div className="mt-auto px-3.5 pb-3.5 max-[430px]:mt-0 max-[430px]:pb-3 [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pb-2.5">
      <span
        aria-hidden="true"
        className="mb-2 block h-px w-full rounded-full bg-[rgba(20,40,28,0.1)] max-[390px]:mb-1.5 [@media(max-width:430px)_and_(max-height:860px)]:mb-1.5"
      />
      <div className="flex flex-wrap items-center gap-1.5">
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
        "origin-center cursor-pointer select-none border-0 outline-none",
        "inline-flex items-center justify-center rounded-full",
        "transition-transform duration-150 ease-out [-webkit-tap-highlight-color:transparent]",
        canAnimate(shouldReduceMotion) && "active:scale-[0.94]",
        isMain
          ? "h-7 bg-[linear-gradient(135deg,#BDF7D0,#73E89F)] px-3 text-[12.5px] font-extrabold tracking-[0px] text-[#06301A] [@media(max-width:430px)_and_(max-height:860px)]:h-[26px] [@media(max-width:430px)_and_(max-height:860px)]:px-2.5 [@media(max-width:430px)_and_(max-height:860px)]:text-[12px]"
          : "h-[26px] bg-[rgba(46,204,113,0.14)] px-2.5 text-[11.5px] font-bold tracking-[0px] text-[#0E8A4F] [@media(max-width:430px)_and_(max-height:860px)]:h-6 [@media(max-width:430px)_and_(max-height:860px)]:px-2 [@media(max-width:430px)_and_(max-height:860px)]:text-[11px]"
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
