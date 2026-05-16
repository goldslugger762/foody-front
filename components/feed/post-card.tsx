"use client";

import {
  AnimatePresence,
  animate,
  type PanInfo,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";

import {
  CollapsedPostCardView,
  ExpandedPostCardView,
} from "@/components/feed/post-card-sections";
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
const POST_CARD_EXPANDED_EVENT = "foody:post-card-expanded";

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

type ViewportSize = {
  height: number;
  width: number;
};

function getViewportSize(): ViewportSize {
  if (typeof window === "undefined") {
    return { height: 0, width: 0 };
  }

  return {
    height: window.visualViewport?.height ?? window.innerHeight,
    width: window.visualViewport?.width ?? window.innerWidth,
  };
}

function usePulse() {
  const [pulse, setPulse] = useState(0);

  function triggerPulse() {
    setPulse((currentPulse) => currentPulse + 1);
  }

  return [pulse, triggerPulse] as const;
}

function useViewportSize() {
  const [viewportSize, setViewportSize] = useState<ViewportSize>({
    height: 0,
    width: 0,
  });

  useEffect(() => {
    const viewport = window.visualViewport;

    function syncViewportSize() {
      setViewportSize(getViewportSize());
    }

    syncViewportSize();
    window.addEventListener("resize", syncViewportSize);
    viewport?.addEventListener("resize", syncViewportSize);

    return () => {
      window.removeEventListener("resize", syncViewportSize);
      viewport?.removeEventListener("resize", syncViewportSize);
    };
  }, []);

  return viewportSize;
}

function getPhotoRatio(density: Density, viewportSize: ViewportSize) {
  const regularRatio = density === "cozy" ? 0.98 : 1.12;

  if (viewportSize.width === 0 || viewportSize.width > 430) {
    return regularRatio;
  }

  if (viewportSize.height <= 860) {
    return density === "cozy" ? 1.28 : 1.22;
  }

  if (viewportSize.height <= 900) {
    return density === "cozy" ? 1.3 : 1.3;
  }

  if (viewportSize.height <= 940) {
    return density === "cozy" ? 1.16 : 1.2;
  }

  return density === "cozy" ? 1.12 : 1.26;
}

export function PostCard({ post, brand, density }: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const viewportSize = useViewportSize();
  const photoRatio = getPhotoRatio(density, viewportSize);
  const [mainTag, ...restTags] = post.tags;
  const likeCount = post.likes + (liked ? 1 : 0);
  const hasPhotoSlider = post.photos > 1;
  const lastPhotoIdx = post.photos - 1;
  const canDragToPreviousPhoto = photoIdx > 0;
  const canDragToNextPhoto = photoIdx < lastPhotoIdx;
  const feedPhotoViewportRef = useRef<HTMLDivElement>(null);
  const expandedPhotoViewportRef = useRef<HTMLDivElement>(null);
  const photoTrackX = useMotionValue(0);
  const photoAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const photoDragBaseXRef = useRef(0);
  const suppressOpenAfterPhotoDragRef = useRef(false);
  const trackPhotoIndexes = [
    canDragToPreviousPhoto ? photoIdx - 1 : photoIdx,
    photoIdx,
    canDragToNextPhoto ? photoIdx + 1 : photoIdx,
  ];

  useEffect(() => {
    const viewport = isExpanded
      ? expandedPhotoViewportRef.current
      : feedPhotoViewportRef.current;

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
  }, [isExpanded, photoTrackX]);

  useEffect(() => {
    return () => {
      photoAnimationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isExpanded]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(POST_CARD_EXPANDED_EVENT, {
        detail: { expanded: isExpanded },
      })
    );

    return () => {
      if (isExpanded) {
        window.dispatchEvent(
          new CustomEvent(POST_CARD_EXPANDED_EVENT, {
            detail: { expanded: false },
          })
        );
      }
    };
  }, [isExpanded]);

  async function copyPostLink() {
    if (typeof window === "undefined") {
      return;
    }

    const postUrl = new URL("/", window.location.origin);
    postUrl.searchParams.set("post", String(post.id));
    const postLink = postUrl.toString();

    try {
      await navigator.clipboard.writeText(postLink);
      return;
    } catch {
      const fallbackField = document.createElement("textarea");
      fallbackField.value = postLink;
      fallbackField.setAttribute("readonly", "");
      fallbackField.style.position = "fixed";
      fallbackField.style.top = "-999px";
      fallbackField.style.left = "-999px";
      document.body.appendChild(fallbackField);
      fallbackField.select();
      document.execCommand("copy");
      fallbackField.remove();
    }
  }

  function handleCardClick(event: ReactMouseEvent<HTMLElement>) {
    if (isExpanded || suppressOpenAfterPhotoDragRef.current) {
      return;
    }

    const target = event.target;

    if (
      target instanceof Element &&
      target.closest("a,button,input,textarea,select,[data-card-interactive]")
    ) {
      return;
    }

    setIsExpanded(true);
  }

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
    void copyPostLink();
  }

  function handleMoreClick() {
    triggerMorePulse();
  }

  function handleTagClick() {
    // Future search navigation will attach here.
  }

  function handlePhotoDragStart() {
    suppressOpenAfterPhotoDragRef.current = true;
    photoAnimationRef.current?.stop();
    photoDragBaseXRef.current = photoTrackX.get();
    photoTrackX.stop();
    setPhotoIndicatorIdx(photoIdx);
  }

  function releasePhotoDragSuppression() {
    window.setTimeout(() => {
      suppressOpenAfterPhotoDragRef.current = false;
    }, 80);
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
    releasePhotoDragSuppression();

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

  const headerActions = {
    morePulse,
    onMoreClick: handleMoreClick,
    onShareClick: handleShareClick,
    sharePulse,
  };
  const photoCarousel = {
    canDragToNextPhoto,
    canDragToPreviousPhoto,
    hasPhotoSlider,
    onPhotoDrag: handlePhotoDrag,
    onPhotoDragEnd: handlePhotoDragEnd,
    onPhotoDragStart: handlePhotoDragStart,
    photoIndicatorIdx,
    photoRatio,
    photoTrackX,
    photoWidth,
    trackPhotoIndexes,
  };
  const engagement = {
    commentPulse,
    likeCount,
    likePulse,
    liked,
    onCommentClick: handleCommentClick,
    onLikeClick: handleLikeClick,
    onSaveClick: handleSaveClick,
    savePulse,
    saved,
  };

  return (
    <div className="flex h-[calc(100%+5.125rem)] min-h-0 snap-start snap-always flex-col px-3.5 pt-2 pb-[5.75rem] [scroll-snap-stop:always] [@media(max-width:430px)_and_(max-height:860px)]:h-[calc(100%+4.25rem)] [@media(max-width:430px)_and_(max-height:860px)]:px-3 [@media(max-width:430px)_and_(max-height:860px)]:pb-[5rem]">
      <CollapsedPostCardView
        brand={brand}
        engagement={engagement}
        headerActions={headerActions}
        mainTag={mainTag}
        onCardClick={handleCardClick}
        onTagClick={handleTagClick}
        photoCarousel={{
          ...photoCarousel,
          photoViewportRef: feedPhotoViewportRef,
        }}
        post={post}
        restTags={restTags}
        shouldReduceMotion={shouldReduceMotion}
      />
      <AnimatePresence>
        {isExpanded && (
          <ExpandedPostCardView
            brand={brand}
            engagement={engagement}
            headerActions={headerActions}
            mainTag={mainTag}
            onBackClick={() => setIsExpanded(false)}
            onTagClick={handleTagClick}
            photoCarousel={{
              ...photoCarousel,
              photoViewportRef: expandedPhotoViewportRef,
            }}
            post={post}
            restTags={restTags}
            shouldReduceMotion={shouldReduceMotion}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
