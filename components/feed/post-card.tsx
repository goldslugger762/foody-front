"use client";

import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Star,
} from "lucide-react";
import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { DishPhoto } from "@/components/feed/dish-photo";
import { UserAvatar } from "@/components/feed/user-avatar";
import { cn } from "@/lib/utils";
import type { Density, Post } from "@/lib/mock-data";

type PostCardProps = {
  post: Post;
  brand: string;
  density: Density;
};

const PHOTO_SWIPE_DISTANCE_RATIO = 0.22;
const PHOTO_SWIPE_VELOCITY = 520;
const PHOTO_DRAG_PREVIEW_RATIO = 0.5;
const PHOTO_RUBBER_BAND_CONSTANT = 0.55;

function rubberBandDistance(offset: number, dimension: number) {
  if (dimension <= 0) {
    return 0;
  }

  const distance = Math.abs(offset);
  const band =
    (distance * dimension * PHOTO_RUBBER_BAND_CONSTANT) /
    (dimension + PHOTO_RUBBER_BAND_CONSTANT * distance);

  return Math.sign(offset) * band;
}

export function PostCard({ post, brand, density }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoIndicatorIdx, setPhotoIndicatorIdx] = useState(0);
  const [photoWidth, setPhotoWidth] = useState(0);
  const [sharePulse, setSharePulse] = useState(0);
  const [morePulse, setMorePulse] = useState(0);
  const [likePulse, setLikePulse] = useState(0);
  const [commentPulse, setCommentPulse] = useState(0);
  const [savePulse, setSavePulse] = useState(0);
  const [tagPulses, setTagPulses] = useState<Record<string, number>>({});
  const shouldReduceMotion = useReducedMotion();

  const photoHeight = density === "cozy" ? 360 : 320;
  const [mainTag, ...restTags] = post.tags;
  const likeCount = post.likes + (liked ? 1 : 0);
  const hasPhotoSlider = post.photos > 1;
  const lastPhotoIdx = post.photos - 1;
  const canDragToPreviousPhoto = photoIdx > 0;
  const canDragToNextPhoto = photoIdx < lastPhotoIdx;
  const photoViewportRef = useRef<HTMLDivElement>(null);
  const photoTrackX = useMotionValue(0);
  const photoAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const trackPhotoIndexes = [
    canDragToPreviousPhoto ? photoIdx - 1 : photoIdx,
    photoIdx,
    canDragToNextPhoto ? photoIdx + 1 : photoIdx,
  ];

  useEffect(() => {
    const viewport = photoViewportRef.current;

    if (!viewport) {
      return;
    }

    const viewportElement = viewport;

    function syncPhotoWidth() {
      const nextWidth = viewportElement.getBoundingClientRect().width;
      setPhotoWidth(nextWidth);
      photoTrackX.jump(-nextWidth);
    }

    syncPhotoWidth();

    const resizeObserver = new ResizeObserver(syncPhotoWidth);
    resizeObserver.observe(viewportElement);

    return () => {
      resizeObserver.disconnect();
    };
  }, [photoTrackX]);

  useEffect(() => {
    return () => {
      photoAnimationRef.current?.stop();
    };
  }, []);

  function handleLikeClick() {
    const nextLiked = !liked;
    setLiked(nextLiked);
    if (nextLiked) {
      setLikePulse((pulse) => pulse + 1);
    }
  }

  function handleSaveClick() {
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (nextSaved) {
      setSavePulse((pulse) => pulse + 1);
    }
  }

  function handleCommentClick() {
    setCommentPulse((pulse) => pulse + 1);
  }

  function handleShareClick() {
    setSharePulse((pulse) => pulse + 1);
  }

  function handleMoreClick() {
    setMorePulse((pulse) => pulse + 1);
  }

  function handleTagClick(tag: string) {
    setTagPulses((pulses) => ({
      ...pulses,
      [tag]: (pulses[tag] ?? 0) + 1,
    }));
  }

  function handlePhotoDragStart() {
    photoAnimationRef.current?.stop();
    photoTrackX.stop();
    setPhotoIndicatorIdx(photoIdx);
  }

  function handlePhotoDrag(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (!hasPhotoSlider || photoWidth <= 0) {
      return;
    }

    const centerX = -photoWidth;
    const rawOffset = info.offset.x;
    const canMove =
      (rawOffset < 0 && canDragToNextPhoto) ||
      (rawOffset > 0 && canDragToPreviousPhoto);

    if (!canMove) {
      photoTrackX.set(centerX);
      return;
    }

    const constrainedOffset = rubberBandDistance(
      rawOffset,
      photoWidth * PHOTO_DRAG_PREVIEW_RATIO
    );

    photoTrackX.set(centerX + constrainedOffset);
  }

  function handlePhotoDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) {
    if (!hasPhotoSlider || photoWidth <= 0) {
      return;
    }

    const visualOffset = photoTrackX.get() + photoWidth;
    const swipeVelocity = info.velocity.x;
    const shouldGoNext =
      canDragToNextPhoto &&
      (visualOffset < -photoWidth * PHOTO_SWIPE_DISTANCE_RATIO ||
        (visualOffset < -photoWidth * 0.1 &&
          swipeVelocity < -PHOTO_SWIPE_VELOCITY));
    const shouldGoPrevious =
      canDragToPreviousPhoto &&
      (visualOffset > photoWidth * PHOTO_SWIPE_DISTANCE_RATIO ||
        (visualOffset > photoWidth * 0.1 &&
          swipeVelocity > PHOTO_SWIPE_VELOCITY));
    const targetPhotoIdx = shouldGoNext
      ? photoIdx + 1
      : shouldGoPrevious
        ? photoIdx - 1
        : photoIdx;
    const targetX = shouldGoNext
      ? -photoWidth * 2
      : shouldGoPrevious
        ? 0
        : -photoWidth;

    photoAnimationRef.current?.stop();
    setPhotoIndicatorIdx(targetPhotoIdx);
    photoAnimationRef.current = animate(photoTrackX, targetX, {
      duration: shouldReduceMotion ? 0.01 : 0.32,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        if (targetPhotoIdx !== photoIdx) {
          flushSync(() => {
            setPhotoIdx(targetPhotoIdx);
          });
        }

        photoTrackX.jump(-photoWidth);
      },
    });
  }

  return (
    <div
      className="flex min-h-full snap-start snap-always flex-col px-3.5 pb-3.5"
      style={{ scrollSnapStop: "always" }}
    >
      <article
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-[26px]",
          "border-[0.5px] border-white/85 bg-white/95",
          "shadow-[0_14px_36px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.85)]"
        )}
      >
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
          <button
            type="button"
            title="Поделиться"
            aria-label="Поделиться"
            onClick={handleShareClick}
            className="grid size-8 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
          >
            <motion.span
              key={`share-${sharePulse}`}
              className="grid size-[17px] place-items-center"
              animate={
                sharePulse > 0 && !shouldReduceMotion
                  ? { scale: [1, 0.86, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <Share2 className="size-[17px]" strokeWidth={2} />
            </motion.span>
          </button>
          <button
            type="button"
            title="Ещё"
            aria-label="Ещё"
            onClick={handleMoreClick}
            className="grid size-8 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
          >
            <motion.span
              key={`more-${morePulse}`}
              className="grid size-4 place-items-center"
              animate={
                morePulse > 0 && !shouldReduceMotion
                  ? { scale: [1, 0.86, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <MoreHorizontal className="size-4" strokeWidth={2} />
            </motion.span>
          </button>
        </div>

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
                left: canDragToNextPhoto
                  ? -photoWidth * 2
                  : -photoWidth,
                right: canDragToPreviousPhoto
                  ? 0
                  : -photoWidth,
              }}
              dragElastic={0}
              dragMomentum={false}
              dragDirectionLock
              onDragStart={handlePhotoDragStart}
              onDrag={handlePhotoDrag}
              onDragEnd={handlePhotoDragEnd}
              className="absolute inset-y-0 left-0 flex h-full w-[300%] [touch-action:pan-y]"
              style={{ x: photoTrackX }}
            >
              {trackPhotoIndexes.map((trackPhotoIdx, trackPosition) => (
                <div
                  key={`${trackPosition}-${trackPhotoIdx}`}
                  aria-hidden={trackPosition !== 1}
                  className="h-full w-1/3 shrink-0"
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
            <div className="pointer-events-none absolute bottom-2.5 left-3 flex justify-start gap-1.5 rounded-full bg-black/15 p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.16)] backdrop-blur-[10px]">
              {Array.from({ length: post.photos }).map((_, i) => {
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
          )}
        </div>

        <div className="flex items-center gap-4 px-4 pt-3 pb-2">
          <motion.button
            type="button"
            aria-pressed={liked}
            onClick={handleLikeClick}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
            whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
          >
            <motion.span
              key={`like-${likePulse}`}
              className="relative grid size-[22px] place-items-center"
              animate={
                liked && !shouldReduceMotion
                  ? { scale: [1, 1.24, 0.96, 1], rotate: [0, -7, 4, 0] }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.42, ease: "easeOut" }}
            >
              <motion.span
                aria-hidden="true"
                className="absolute inset-0 rounded-full border border-[#E5443B]/45"
                animate={
                  liked && !shouldReduceMotion
                    ? { scale: [0.55, 1.85], opacity: [0.45, 0] }
                    : { scale: 0.55, opacity: 0 }
                }
                transition={{ duration: 0.42, ease: "easeOut" }}
              />
              <Heart
                className="relative size-[22px]"
                strokeWidth={2}
                color={liked ? "#E5443B" : "#15291C"}
                fill={liked ? "#E5443B" : "none"}
              />
            </motion.span>
            <motion.span
              className="text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]"
              animate={
                liked && !shouldReduceMotion
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
            onClick={handleCommentClick}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
          >
            <motion.span
              key={`comment-${commentPulse}`}
              className="grid size-5 place-items-center"
              animate={
                commentPulse > 0 && !shouldReduceMotion
                  ? { scale: [1, 0.86, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.28, ease: "easeOut" }}
            >
              <MessageCircle
                className="size-5"
                strokeWidth={2}
                color="#15291C"
              />
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
            onClick={handleSaveClick}
            className="relative ml-auto grid size-9 cursor-pointer place-items-center overflow-hidden rounded-[10px] transition-colors"
            style={{
              backgroundColor: saved ? `${brand}22` : "rgba(20,40,28,0.06)",
              color: saved ? brand : "#15291C",
            }}
          >
            <motion.span
              key={`save-glow-${savePulse}`}
              aria-hidden="true"
              className="absolute inset-0 rounded-[10px]"
              animate={
                saved && !shouldReduceMotion
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
                saved && !shouldReduceMotion
                  ? { y: [0, -2, 0], scale: [1, 1.2, 0.98, 1] }
                  : { y: 0, scale: 1 }
              }
              transition={{ duration: 0.38, ease: "easeOut" }}
            >
              <Bookmark
                className="size-[18px]"
                strokeWidth={2}
                color={saved ? brand : "#15291C"}
                fill={saved ? brand : "none"}
              />
            </motion.span>
          </motion.button>
        </div>

        <div className="px-4 pb-1">
          <h3 className="text-[19px] leading-[1.2] font-extrabold tracking-[-0.4px] text-[#15291C]">
            {post.dish}
          </h3>
        </div>

        <div className="px-4 pt-1 pb-2.5">
          <div className="inline-flex max-w-full items-center gap-1.5 rounded-[9px] bg-[rgba(20,40,28,0.05)] px-2.5 py-[5px] text-[12.5px] font-semibold text-[#3A4A40]">
            <MapPin className="size-[11px] shrink-0" strokeWidth={2.2} />
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {post.place}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-2.5">
          <div
            className={cn(
              "relative inline-flex items-center gap-1.5 rounded-[14px] px-3.5 py-1.5",
              "border-[0.5px] border-white/85",
              "bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,255,255,0.55))]",
              "backdrop-blur-[14px] backdrop-saturate-[200%]"
            )}
            style={{
              boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.95), inset -1px -1px 0 rgba(255,255,255,0.45), 0 6px 16px ${brand}33`,
            }}
          >
            <span className="text-[10.5px] font-bold tracking-[0.4px] text-[#5C6B62] uppercase">
              Цена
            </span>
            <span className="text-[18px] font-extrabold tracking-[-0.3px] text-[#15291C]">
              {post.price}
            </span>
          </div>
          <div className="inline-flex items-baseline gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.4px] text-[#5C6B62] uppercase">
              Оценка
            </span>
            <span className="inline-flex items-center gap-1 text-[18px] font-extrabold tracking-[-0.3px] text-[#15291C]">
              <Star
                className="size-3.5"
                color="#FFB400"
                fill="#FFB400"
                strokeWidth={0}
              />{" "}
              {post.rating}
            </span>
          </div>
        </div>

        <p className="mx-3 mb-3 rounded-[14px] bg-[rgba(20,40,28,0.04)] px-3 py-2.5 text-[13.5px] leading-[1.45] text-pretty text-[#15291C]">
          {post.text}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 px-3.5 pb-3.5">
          {mainTag && (
            <motion.button
              key={`${mainTag}-${tagPulses[mainTag] ?? 0}`}
              type="button"
              onClick={() => handleTagClick(mainTag)}
              className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 text-[12.5px] font-extrabold tracking-[-0.1px] text-[#06301A]"
              animate={
                tagPulses[mainTag] && !shouldReduceMotion
                  ? { scale: [1, 0.94, 1.04, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                background: `linear-gradient(135deg, #BDF7D0, #73E89F)`,
                boxShadow: `0 4px 12px ${brand}33, inset 1px 1px 0 rgba(255,255,255,0.65)`,
              }}
            >
              {mainTag}
            </motion.button>
          )}
          {restTags.map((t) => (
            <motion.button
              key={`${t}-${tagPulses[t] ?? 0}`}
              type="button"
              onClick={() => handleTagClick(t)}
              className="inline-flex h-[26px] cursor-pointer items-center rounded-full border-0 bg-[rgba(46,204,113,0.14)] px-2.5 text-[11.5px] font-bold tracking-[-0.1px] text-[#0E8A4F]"
              animate={
                tagPulses[t] && !shouldReduceMotion
                  ? { scale: [1, 0.94, 1.04, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {t}
            </motion.button>
          ))}
        </div>
      </article>
    </div>
  );
}
