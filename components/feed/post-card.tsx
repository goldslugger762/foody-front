"use client";

import {
  animate,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  EngagementBar,
  PhotoCarousel,
  PostCardHeader,
  PostDetails,
  PostTags,
} from "@/components/feed/post-card-sections";
import { cn } from "@/lib/utils";
import type { Density, Post } from "@/lib/mock-data";

type PostCardProps = {
  post: Post;
  brand: string;
  density: Density;
};

const PHOTO_SWIPE_DISTANCE_RATIO = 0.04;
const PHOTO_SWIPE_VELOCITY = 220;
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

function getPhotoHeight(density: Density) {
  return density === "cozy" ? 360 : 320;
}

function usePulse() {
  const [pulse, setPulse] = useState(0);

  function triggerPulse() {
    setPulse((currentPulse) => currentPulse + 1);
  }

  return [pulse, triggerPulse] as const;
}

export function PostCard({ post, brand, density }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [photoIndicatorIdx, setPhotoIndicatorIdx] = useState(0);
  const [photoWidth, setPhotoWidth] = useState(0);
  const [sharePulse, triggerSharePulse] = usePulse();
  const [morePulse, triggerMorePulse] = usePulse();
  const [likePulse, triggerLikePulse] = usePulse();
  const [commentPulse, triggerCommentPulse] = usePulse();
  const [savePulse, triggerSavePulse] = usePulse();
  const shouldReduceMotion = useReducedMotion();

  const photoHeight = getPhotoHeight(density);
  const [mainTag, ...restTags] = post.tags;
  const likeCount = post.likes + (liked ? 1 : 0);
  const hasPhotoSlider = post.photos > 1;
  const lastPhotoIdx = post.photos - 1;
  const canDragToPreviousPhoto = photoIdx > 0;
  const canDragToNextPhoto = photoIdx < lastPhotoIdx;
  const photoViewportRef = useRef<HTMLDivElement>(null);
  const photoTrackX = useMotionValue(0);
  const photoAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const photoDragBaseXRef = useRef(0);
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
      triggerLikePulse();
    }
  }

  function handleSaveClick() {
    const nextSaved = !saved;
    setSaved(nextSaved);
    if (nextSaved) {
      triggerSavePulse();
    }
  }

  function handleCommentClick() {
    triggerCommentPulse();
  }

  function handleShareClick() {
    triggerSharePulse();
  }

  function handleMoreClick() {
    triggerMorePulse();
  }

  function handleTagClick() {
    // Future search navigation will attach here.
  }

  function handlePhotoDragStart() {
    photoAnimationRef.current?.stop();
    photoDragBaseXRef.current = photoTrackX.get();
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
    const rawOffset = photoDragBaseXRef.current - centerX + info.offset.x;
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
        (visualOffset < -photoWidth * 0.015 &&
          swipeVelocity < -PHOTO_SWIPE_VELOCITY));
    const shouldGoPrevious =
      canDragToPreviousPhoto &&
      (visualOffset > photoWidth * PHOTO_SWIPE_DISTANCE_RATIO ||
        (visualOffset > photoWidth * 0.015 &&
          swipeVelocity > PHOTO_SWIPE_VELOCITY));
    const targetPhotoIdx = shouldGoNext
      ? photoIdx + 1
      : shouldGoPrevious
        ? photoIdx - 1
        : photoIdx;
    const currentX = photoTrackX.get();
    const nextTrackX = shouldGoNext
      ? currentX + photoWidth
      : shouldGoPrevious
        ? currentX - photoWidth
        : currentX;

    photoAnimationRef.current?.stop();
    setPhotoIndicatorIdx(targetPhotoIdx);

    if (targetPhotoIdx !== photoIdx) {
      flushSync(() => {
        setPhotoIdx(targetPhotoIdx);
      });
      photoTrackX.jump(nextTrackX);
    }

    photoAnimationRef.current = animate(photoTrackX, -photoWidth, {
      duration: shouldReduceMotion ? 0.01 : 0.32,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        photoTrackX.jump(-photoWidth);
      },
    });
  }

  return (
    <div className="flex min-h-full snap-start snap-always flex-col px-3.5 pb-3.5 [scroll-snap-stop:always]">
      <article
        className={cn(
          "flex flex-1 flex-col overflow-hidden rounded-[26px]",
          "border border-green-50/92 bg-white/75",
          "shadow-[0_8px_20px_rgba(20,40,28,0.12),0_1px_3px_rgba(20,40,28,0.08),inset_0_1px_0_rgba(255,255,255,0.92),inset_0_0_0_1px_rgba(255,255,255,0.34)]",
          "backdrop-blur-[28px] backdrop-saturate-[190%]"
        )}
      >
        <PostCardHeader
          morePulse={morePulse}
          onMoreClick={handleMoreClick}
          onShareClick={handleShareClick}
          post={post}
          sharePulse={sharePulse}
          shouldReduceMotion={shouldReduceMotion}
        />

        <PhotoCarousel
          canDragToNextPhoto={canDragToNextPhoto}
          canDragToPreviousPhoto={canDragToPreviousPhoto}
          hasPhotoSlider={hasPhotoSlider}
          onPhotoDrag={handlePhotoDrag}
          onPhotoDragEnd={handlePhotoDragEnd}
          onPhotoDragStart={handlePhotoDragStart}
          photoHeight={photoHeight}
          photoIndicatorIdx={photoIndicatorIdx}
          photoTrackX={photoTrackX}
          photoViewportRef={photoViewportRef}
          photoWidth={photoWidth}
          post={post}
          trackPhotoIndexes={trackPhotoIndexes}
        />

        <EngagementBar
          brand={brand}
          commentPulse={commentPulse}
          likeCount={likeCount}
          likePulse={likePulse}
          liked={liked}
          onCommentClick={handleCommentClick}
          onLikeClick={handleLikeClick}
          onSaveClick={handleSaveClick}
          post={post}
          savePulse={savePulse}
          saved={saved}
          shouldReduceMotion={shouldReduceMotion}
        />

        <PostDetails brand={brand} post={post} />

        <PostTags
          brand={brand}
          mainTag={mainTag}
          onTagClick={handleTagClick}
          restTags={restTags}
          shouldReduceMotion={shouldReduceMotion}
        />
      </article>
    </div>
  );
}
