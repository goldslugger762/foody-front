"use client";

import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

import { DishPhoto } from "@/components/feed/dish-photo";
import type { Post } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

import { canAnimate } from "./post-card-shared";

type PhotoViewerModalProps = {
  open: boolean;
  post: Post;
  activeIndex: number;
  photoRatio: number;
  shouldReduceMotion: boolean | null;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
};

type ViewerArrowButtonProps = {
  ariaLabel: string;
  className: string;
  enabled: boolean;
  icon: LucideIcon;
  onClick: () => void;
  shouldReduceMotion: boolean | null;
};

const VIEWER_TRANSITION = { duration: 0.18, ease: [0.22, 1, 0.36, 1] } as const;
const PHOTO_TRANSITION = { duration: 0.2, ease: [0.22, 1, 0.36, 1] } as const;

export function PhotoViewerModal({
  open,
  post,
  activeIndex,
  photoRatio,
  shouldReduceMotion,
  onClose,
  onChangeIndex,
}: PhotoViewerModalProps) {
  const lastIndex = post.photos - 1;
  const safeActiveIndex = Math.min(Math.max(activeIndex, 0), lastIndex);
  const hasMultiplePhotos = post.photos > 1;
  const canGoPrevious = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < lastIndex;
  const shouldAnimate = canAnimate(shouldReduceMotion);

  useEffect(() => {
    if (!open) {
      return;
    }

    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (!hasMultiplePhotos) {
        return;
      }

      if (event.key === "ArrowLeft" && canGoPrevious) {
        event.preventDefault();
        onChangeIndex(safeActiveIndex - 1);
      }

      if (event.key === "ArrowRight" && canGoNext) {
        event.preventDefault();
        onChangeIndex(safeActiveIndex + 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canGoNext,
    canGoPrevious,
    hasMultiplePhotos,
    onChangeIndex,
    onClose,
    open,
    safeActiveIndex,
  ]);

  function goToPreviousPhoto() {
    if (canGoPrevious) {
      onChangeIndex(safeActiveIndex - 1);
    }
  }

  function goToNextPhoto() {
    if (canGoNext) {
      onChangeIndex(safeActiveIndex + 1);
    }
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`Фото: ${post.dish}`}
          className={cn(
            "fixed inset-0 z-[80] flex h-[100dvh] w-screen items-center justify-center overflow-hidden",
            "bg-black/85 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]",
            "[-webkit-tap-highlight-color:transparent]"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={VIEWER_TRANSITION}
          onClick={onClose}
        >
          {hasMultiplePhotos && (
            <ViewerArrowButton
              ariaLabel="Предыдущее фото"
              className="left-3 sm:left-6"
              enabled={canGoPrevious}
              icon={ChevronLeft}
              onClick={goToPreviousPhoto}
              shouldReduceMotion={shouldReduceMotion}
            />
          )}

          <motion.div
            className={cn(
              "relative z-10 w-[min(92vw,42rem)] overflow-hidden rounded-[28px]",
              "bg-white/5 shadow-[0_22px_70px_rgba(0,0,0,0.45)] ring-1 ring-white/15",
              "max-[430px]:w-[min(92vw,28rem)] max-[430px]:rounded-[24px]"
            )}
            style={{ aspectRatio: `${photoRatio} / 1` }}
            initial={shouldAnimate ? { opacity: 0, scale: 0.96 } : { opacity: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldAnimate ? { opacity: 0, scale: 0.98 } : { opacity: 0 }}
            transition={PHOTO_TRANSITION}
            onClick={(event) => event.stopPropagation()}
          >
            <DishPhoto
              seed={post.seed + safeActiveIndex}
              height="100%"
              label={`${post.dish.toLowerCase()} · ${safeActiveIndex + 1} / ${post.photos}`}
              labelClassName="right-4 bottom-4 left-auto max-w-[calc(100%-2rem)] overflow-hidden rounded-full bg-black/18 px-2.5 py-1 text-right text-ellipsis whitespace-nowrap backdrop-blur-[8px]"
            />
          </motion.div>

          {hasMultiplePhotos && (
            <ViewerArrowButton
              ariaLabel="Следующее фото"
              className="right-3 sm:right-6"
              enabled={canGoNext}
              icon={ChevronRight}
              onClick={goToNextPhoto}
              shouldReduceMotion={shouldReduceMotion}
            />
          )}

          {hasMultiplePhotos && (
            <div className="pointer-events-none absolute bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full border border-white/15 bg-white/14 p-1.5 shadow-md backdrop-blur-md">
              {Array.from({ length: post.photos }).map((_, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color] duration-200",
                    index === safeActiveIndex ? "w-[22px] bg-white" : "w-1.5 bg-white/45"
                  )}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ViewerArrowButton({
  ariaLabel,
  className,
  enabled,
  icon: Icon,
  onClick,
  shouldReduceMotion,
}: ViewerArrowButtonProps) {
  const shouldAnimate = enabled && canAnimate(shouldReduceMotion);

  function handleClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (enabled) {
      onClick();
    }
  }

  return (
    <motion.button
      type="button"
      aria-disabled={!enabled}
      aria-label={ariaLabel}
      tabIndex={enabled ? 0 : -1}
      className={cn(
        "absolute top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full",
        "border border-white/20 bg-white/20 text-black shadow-md backdrop-blur-md",
        "outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-white/50",
        enabled ? "cursor-pointer opacity-100" : "cursor-default opacity-35",
        "max-[430px]:size-10",
        className
      )}
      whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
      whileTap={shouldAnimate ? { scale: 0.92 } : undefined}
      onClick={handleClick}
    >
      <Icon className="size-6 max-[430px]:size-5.5" strokeWidth={2.4} />
    </motion.button>
  );
}
