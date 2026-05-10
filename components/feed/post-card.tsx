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
import { useState } from "react";

import { DishPhoto } from "@/components/feed/dish-photo";
import { UserAvatar } from "@/components/feed/user-avatar";
import { cn } from "@/lib/utils";
import type { Density, Post } from "@/lib/mock-data";

type PostCardProps = {
  post: Post;
  brand: string;
  density: Density;
};

export function PostCard({ post, brand, density }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);

  const photoHeight = density === "cozy" ? 360 : 320;
  const [mainTag, ...restTags] = post.tags;
  const likeCount = post.likes + (liked ? 1 : 0);

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
              <span
                aria-label="Подтверждённый аккаунт"
                className="grid size-3.5 shrink-0 place-items-center rounded-full text-[8px] font-black text-[#06301A]"
                style={{ backgroundColor: brand }}
              >
                ✓
              </span>
            </div>
            <div className="mt-px text-[11.5px] font-medium text-[#5C6B62]">
              {post.realName} · {post.when}
            </div>
          </div>
          <button
            type="button"
            title="Поделиться"
            aria-label="Поделиться"
            className="grid size-8 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
          >
            <Share2 className="size-[17px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            title="Ещё"
            aria-label="Ещё"
            className="grid size-8 cursor-pointer place-items-center rounded-[9px] bg-[rgba(20,40,28,0.06)] text-[#15291C]"
          >
            <MoreHorizontal className="size-4" strokeWidth={2} />
          </button>
        </div>

        <div className="relative mx-3 overflow-hidden rounded-[18px]">
          <DishPhoto
            seed={post.seed + photoIdx}
            height={photoHeight}
            label={`dish photo ${photoIdx + 1} / ${post.photos} · ${post.dish.toLowerCase()}`}
          />
          {post.photos > 1 && (
            <div className="absolute right-0 bottom-2.5 left-0 flex justify-center gap-1.5">
              {Array.from({ length: post.photos }).map((_, i) => {
                const isActive = i === photoIdx;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Фото ${i + 1}`}
                    aria-current={isActive}
                    onClick={() => setPhotoIdx(i)}
                    className={cn(
                      "h-1.5 cursor-pointer rounded-full border-0 p-0 transition-[width] duration-200",
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
          <button
            type="button"
            aria-pressed={liked}
            onClick={() => setLiked((l) => !l)}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
          >
            <Heart
              className="size-[22px]"
              strokeWidth={2}
              color={liked ? "#E5443B" : "#15291C"}
              fill={liked ? "#E5443B" : "none"}
            />
            <span className="text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]">
              {likeCount.toLocaleString("ru-RU")}
            </span>
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0"
          >
            <MessageCircle
              className="size-5"
              strokeWidth={2}
              color="#15291C"
            />
            <span className="text-[13.5px] font-bold tracking-[-0.1px] text-[#15291C]">
              {post.comments}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={saved}
            title="В избранное"
            aria-label="В избранное"
            onClick={() => setSaved((s) => !s)}
            className="ml-auto grid size-9 cursor-pointer place-items-center rounded-[10px] transition-colors"
            style={{
              backgroundColor: saved ? `${brand}22` : "rgba(20,40,28,0.06)",
              color: saved ? brand : "#15291C",
            }}
          >
            <Bookmark
              className="size-[18px]"
              strokeWidth={2}
              color={saved ? brand : "#15291C"}
              fill={saved ? brand : "none"}
            />
          </button>
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
        </div>

        <p className="mx-3 mb-3 rounded-[14px] bg-[rgba(20,40,28,0.04)] px-3 py-2.5 text-[13.5px] leading-[1.45] text-pretty text-[#15291C]">
          {post.text}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 px-3.5 pb-3.5">
          {mainTag && (
            <span
              className="inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-extrabold tracking-[-0.1px] text-[#06301A]"
              style={{
                background: `linear-gradient(135deg, ${brand}, #1FA85C)`,
                boxShadow: `0 4px 12px ${brand}55, inset 1px 1px 0 rgba(255,255,255,0.5)`,
              }}
            >
              <span className="text-[11px] opacity-75">★</span>
              {mainTag}
            </span>
          )}
          {restTags.map((t) => (
            <span
              key={t}
              className="inline-flex h-[26px] items-center rounded-full bg-[rgba(46,204,113,0.14)] px-2.5 text-[11.5px] font-bold tracking-[-0.1px] text-[#0E8A4F]"
            >
              {t}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
}
