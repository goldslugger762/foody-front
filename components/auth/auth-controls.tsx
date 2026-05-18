"use client";

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import {
  FIELD_INPUT_CLASSES,
  FIELD_SURFACE_CLASSES,
  FIELD_TINT_CLASSES,
  PRESS_CLASSES,
  getReviewChromeStyle,
} from "@/components/review/review-screen-shell";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const AUTH_BUTTON_PRESS_TRANSITION = { duration: 0.08, ease: "easeOut" } as const;
const AUTH_BUTTON_RETURN_TRANSITION = {
  damping: 28,
  mass: 0.55,
  stiffness: 520,
  type: "spring",
} as const;
const AUTH_BUTTON_STATE_TRANSITION = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1],
} as const;

export function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

export function AuthButton({
  active,
  children,
  className,
  disabled,
  fill,
  type,
  brand,
  onClick,
}: {
  active: boolean;
  brand: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  fill: string;
  type: "button" | "submit";
  onClick?: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();
  const scaleControls = useAnimationControls();
  const shouldAnimate = canAnimate(shouldReduceMotion);

  function pressButton() {
    if (!shouldAnimate || disabled) {
      return;
    }

    void scaleControls.start({
      scale: 0.94,
      transition: AUTH_BUTTON_PRESS_TRANSITION,
    });
  }

  function releaseButton() {
    if (!shouldAnimate) {
      return;
    }

    void scaleControls.start({
      scale: 1,
      transition: AUTH_BUTTON_RETURN_TRANSITION,
    });
  }

  function handleClick() {
    if (disabled) {
      return;
    }

    void scaleControls.start({
      scale: 1,
      transition: AUTH_BUTTON_RETURN_TRANSITION,
    });
    onClick?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    pressButton();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    releaseButton();
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      animate={scaleControls}
      initial={{ scale: 1 }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={releaseButton}
      onPointerDown={pressButton}
      onPointerLeave={releaseButton}
      onPointerUp={releaseButton}
      className={cn(
        "relative block h-12 w-full cursor-pointer overflow-hidden rounded-[20px] border-0 bg-transparent text-center text-[16px] leading-none font-extrabold tracking-[0px] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] transition-[color,opacity] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18 disabled:cursor-not-allowed disabled:text-[#5C6B62]/82 [-webkit-tap-highlight-color:transparent]",
        active ? "text-[#06301A]" : "text-[#5C6B62]",
        className
      )}
      style={{
        boxShadow: active
          ? `0 12px 28px ${brand}26, inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)`
          : "0 8px 18px rgba(20,40,28,0.07), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.04)",
      }}
    >
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit]"
        animate={{ opacity: active ? 1 : 0 }}
        transition={shouldAnimate ? AUTH_BUTTON_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(120deg, ${brand}E6, rgba(122,236,164,0.78), rgba(100,218,189,0.66), ${brand}A8)`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit]"
        animate={{ opacity: active ? 0 : 1 }}
        transition={shouldAnimate ? AUTH_BUTTON_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: `linear-gradient(140deg, color-mix(in srgb, ${brand} 50%, transparent), rgba(122,236,164,0.42), rgba(100,218,189,0.38), color-mix(in srgb, ${brand} 35%, transparent))`,
        }}
      />
      <motion.span
        aria-hidden="true"
        className="absolute inset-px rounded-[inherit]"
        animate={{ opacity: 1 }}
        transition={shouldAnimate ? AUTH_BUTTON_STATE_TRANSITION : { duration: 0 }}
        style={{
          background: active
            ? `linear-gradient(135deg, ${fill}, rgba(226,255,235,0.78))`
            : `linear-gradient(${fill}, ${fill})`,
        }}
      />
      <span className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center px-5 text-center">
        {children}
      </span>
    </motion.button>
  );
}

export function AuthField({
  autoComplete,
  brand,
  error,
  idPrefix = "auth",
  inputMode,
  label,
  onChange,
  placeholder,
  rightControl,
  type,
  value,
}: {
  autoComplete: string;
  brand: string;
  error?: string;
  idPrefix?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rightControl?: ReactNode;
  type: string;
  value: string;
}) {
  const errorId = error
    ? `${idPrefix}-${label.toLowerCase().replace(/\s+/g, "-")}-error`
    : undefined;

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <GlassSurface
        className={cn(
          FIELD_SURFACE_CLASSES,
          "bg-white/84",
          error &&
            "ring-2 ring-destructive/38 focus-within:ring-destructive/42 focus-within:shadow-[0_10px_24px_rgba(20,40,28,0.1),0_0_0_1px_rgba(239,68,68,0.28),inset_1px_1px_0_rgba(255,255,255,0.78)]"
        )}
        contentClassName="h-full"
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
        tintClassName={FIELD_TINT_CLASSES}
        style={getReviewChromeStyle(brand, "rgba(255,255,255,0.86)")}
      >
        <div className="flex h-full items-center">
          <Input
            aria-describedby={errorId}
            aria-invalid={!!error}
            autoComplete={autoComplete}
            inputMode={inputMode}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onChange(event.target.value)
            }
            placeholder={placeholder}
            type={type}
            value={value}
            className={cn(
              FIELD_INPUT_CLASSES,
              "min-w-0 flex-1 aria-invalid:text-destructive aria-invalid:placeholder:text-destructive/58",
              rightControl ? "pr-1.5" : ""
            )}
          />
          {rightControl}
        </div>
      </GlassSurface>
      {error ? (
        <span
          id={errorId}
          className="mt-1.5 block px-1 font-[family-name:var(--font-roboto)] text-[12px] leading-tight font-medium text-[#B42318]"
        >
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function PasswordVisibilityButton({
  passwordVisible,
  onClick,
}: {
  passwordVisible: boolean;
  onClick: () => void;
}) {
  const Icon = passwordVisible ? EyeOff : Eye;

  return (
    <button
      type="button"
      aria-label={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
      title={passwordVisible ? "Скрыть пароль" : "Показать пароль"}
      onClick={onClick}
      className={cn(
        "mr-2.5 grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-[#15291C]/6 text-[#5C6B62] outline-none transition-colors hover:bg-[#15291C]/9 focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
        PRESS_CLASSES
      )}
    >
      <Icon className="size-4" strokeWidth={2.3} />
    </button>
  );
}
