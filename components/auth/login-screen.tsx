"use client";

import Link from "next/link";

import { GlassSurface } from "@/components/feed/glass-surface";
import {
  ReviewContentLayer,
  ReviewScreen,
  ReviewScrollArea,
  getReviewChromeStyle,
} from "@/components/review/review-screen-shell";
import type { Palette } from "@/lib/mock-data";

type LoginScreenProps = {
  brand: string;
  palette: Palette;
};

export function LoginScreen({ brand, palette }: LoginScreenProps) {
  return (
    <ReviewScreen palette={palette}>
      <ReviewContentLayer>
        <ReviewScrollArea
          aria-label="Авторизация"
          className="grid place-items-center pb-10"
        >
          <GlassSurface
            className="w-full max-w-[356px] rounded-[26px] border border-transparent bg-white/58"
            contentClassName="px-5 py-6 text-center"
            tintClassName="before:bg-white/52"
            style={getReviewChromeStyle(brand, "rgba(255,255,255,0.70)")}
          >
            <h1 className="text-[24px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
              Вход в Foody
            </h1>
            <p className="mt-2 font-[family-name:var(--font-roboto)] text-[14.5px] leading-snug font-medium text-[#5C6B62]">
              Экран авторизации будет подключен вместе с backend auth.
            </p>
            <Link
              href="/me"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-[18px] border border-transparent px-5 text-[14px] font-extrabold text-[#06301A] outline-none transition-transform duration-150 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
              style={getReviewChromeStyle(brand, "rgba(189,247,208,0.78)")}
            >
              Продолжить демо
            </Link>
          </GlassSurface>
        </ReviewScrollArea>
      </ReviewContentLayer>
    </ReviewScreen>
  );
}
