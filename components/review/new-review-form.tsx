"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, ImageUp, Star, X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import {
  FULLSCREEN_SUBSCRIBE_BUTTON,
  SubscribeStyleButton,
} from "@/components/feed/subscribe-style-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Palette } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const MAX_REVIEW_LENGTH = 2500;
const STAR_YELLOW = "#FFB400";
const PRESS_CLASSES =
  "origin-center transition-transform duration-150 ease-out active:scale-[0.94] [-webkit-tap-highlight-color:transparent]";
const FIELD_SURFACE_CLASSES = cn(
  "h-[50px] rounded-[18px] border border-transparent bg-white",
  "shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)]",
  "transition-shadow duration-150",
  "focus-within:ring-2 focus-within:ring-[#15291C]/12 focus-within:shadow-[0_10px_24px_rgba(20,40,28,0.1),inset_1px_1px_0_rgba(255,255,255,0.78)]"
);
const FIELD_INPUT_CLASSES =
  "h-full border-0 bg-transparent px-3.5 py-0 text-[15.5px] leading-[50px] font-semibold text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15.5px]";
const FIELD_TINT_CLASSES = "before:bg-white before:backdrop-blur-0 before:backdrop-saturate-100";

type NewReviewFormProps = {
  brand: string;
  palette: Palette;
};

type ReviewBlob = {
  color: string;
  opacity: number;
  left: string;
  top: string;
  size: string;
};

const REVIEW_BACKGROUNDS: Record<Palette, { base: string; blobs: ReviewBlob[] }> = {
  fresh: {
    base: "#F3F6F2",
    blobs: [
      { color: "#46DA8F", opacity: 0.35, left: "76%", top: "18%", size: "19rem" },
      { color: "#8DE0B0", opacity: 0.55, left: "18%", top: "39%", size: "17rem" },
      { color: "#F5D08C", opacity: 0.70, left: "88%", top: "72%", size: "18rem" },
      { color: "#B8E6CC", opacity: 0.50, left: "16%", top: "88%", size: "20rem" },
    ],
  },
  citrus: {
    base: "#F8F5ED",
    blobs: [
      { color: "#FFC25C", opacity: 0.2, left: "78%", top: "17%", size: "18rem" },
      { color: "#2ECC71", opacity: 0.18, left: "17%", top: "41%", size: "17rem" },
      { color: "#FF9A6B", opacity: 0.15, left: "86%", top: "74%", size: "18rem" },
      { color: "#CDEBA8", opacity: 0.19, left: "18%", top: "88%", size: "20rem" },
    ],
  },
  dusk: {
    base: "#EEF4EF",
    blobs: [
      { color: "#2ECC71", opacity: 0.2, left: "78%", top: "18%", size: "19rem" },
      { color: "#1FA85C", opacity: 0.18, left: "18%", top: "42%", size: "17rem" },
      { color: "#254A38", opacity: 0.13, left: "88%", top: "73%", size: "18rem" },
      { color: "#8DE0B0", opacity: 0.18, left: "16%", top: "88%", size: "20rem" },
    ],
  },
};

type ReviewFieldProps = {
  brand: string;
  label: string;
  placeholder: string;
  value: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
};

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function getReviewChromeStyle(
  brand: string,
  fill = "#FFFFFF"
): CSSProperties {
  return {
    background: `linear-gradient(${fill}, ${fill}) padding-box, linear-gradient(140deg, color-mix(in srgb, ${brand} 52%, transparent), rgba(122,236,164,0.50), rgba(100,218,189,0.38), color-mix(in srgb, ${brand} 68%, transparent)) border-box`,
    boxShadow:
      "0 8px 18px rgba(46,204,113,0.08), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(11,47,29,0.05)",
  };
}

function ReviewBackgroundBlobs({ palette }: { palette: Palette }) {
  const { base, blobs } = REVIEW_BACKGROUNDS[palette];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: base }}
    >
      {blobs.map((blob, index) => (
        <div
          key={index}
          className="absolute rounded-full blur-[72px]"
          style={{
            background: blob.color,
            height: blob.size,
            left: `calc(${blob.left} - (${blob.size} / 2))`,
            opacity: blob.opacity,
            top: `calc(${blob.top} - (${blob.size} / 2))`,
            width: blob.size,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(110%_70%_at_50%_0%,rgba(255,255,255,0.46),transparent_62%)]" />
      <div className="absolute inset-0 bg-white/22" />
    </div>
  );
}

function ReviewField({
  brand,
  label,
  placeholder,
  value,
  inputMode,
  onChange,
}: ReviewFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
        {label}
      </span>
      <GlassSurface
        className={FIELD_SURFACE_CLASSES}
        contentClassName="h-full"
        tintClassName={FIELD_TINT_CLASSES}
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
        style={getReviewChromeStyle(brand)}
      >
        <Input
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={FIELD_INPUT_CLASSES}
        />
      </GlassSurface>
    </label>
  );
}

function RatingStar({
  index,
  rating,
  shouldReduceMotion,
  onRate,
}: {
  index: number;
  rating: number;
  shouldReduceMotion: boolean | null;
  onRate: (rating: number) => void;
}) {
  const fill = Math.max(0, Math.min(1, rating - index));

  function updateRating(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const nextHalf = pointerX <= rect.width / 2 ? 0.5 : 1;

    onRate(index + nextHalf);
  }

  return (
    <motion.button
      type="button"
      aria-label={`Оценка ${index + 1}`}
      className="relative grid size-12 cursor-pointer place-items-center rounded-[15px] border border-white/62 bg-white/42 text-[#AAB4AE] shadow-[0_8px_18px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.78)] outline-none backdrop-blur-[14px] focus-visible:ring-2 focus-visible:ring-[#15291C]/18 max-[380px]:size-10"
      onPointerDown={updateRating}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.86, rotate: -3 } : undefined}
    >
      <Star
        className="size-7 max-[380px]:size-6"
        strokeWidth={2.1}
        color={fill > 0 ? STAR_YELLOW : "#AAB4AE"}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center overflow-hidden rounded-[15px]"
        style={{ clipPath: `inset(0 ${100 - fill * 100}% 0 0)` }}
      >
        <Star
          className="size-7 max-[380px]:size-6"
          strokeWidth={2.1}
          color={STAR_YELLOW}
          fill={STAR_YELLOW}
        />
      </span>
    </motion.button>
  );
}

function RatingControl({
  rating,
  shouldReduceMotion,
  onRate,
}: {
  rating: number;
  shouldReduceMotion: boolean | null;
  onRate: (rating: number) => void;
}) {
  return (
    <section className="pt-1">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="flex-1 text-center text-[22px] leading-tight font-semibold text-[#15291C]">
          Оцените блюдо
        </h2>
        <span className="flex min-w-14 items-center justify-end gap-1 text-[22px] leading-none font-extrabold text-[#15291C]">
          <Star
            className="size-5"
            strokeWidth={2.1}
            color={STAR_YELLOW}
            fill={STAR_YELLOW}
            aria-hidden="true"
          />
          <span>{rating.toFixed(1)}</span>
        </span>
      </div>
      <div className="flex items-center justify-center gap-3 max-[380px]:gap-2.5">
        {[0, 1, 2, 3, 4].map((index) => (
          <RatingStar
            key={index}
            index={index}
            rating={rating}
            shouldReduceMotion={shouldReduceMotion}
            onRate={onRate}
          />
        ))}
      </div>
    </section>
  );
}

function PhotoUpload({
  brand,
  files,
  onFilesChange,
}: {
  brand: string;
  files: File[];
  onFilesChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesChange(Array.from(event.target.files ?? []));
  }

  return (
    <section>
      <h2 className="mb-2 text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
        Загрузите фотографию блюда
        <span className="ml-1 text-[13px] font-semibold text-[#15291C]">
          (мин. 1 шт.)
        </span>
      </h2>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex min-h-[122px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[26px] border border-transparent px-5 text-center text-[#15291C]",
          "backdrop-blur-[18px] backdrop-saturate-[170%]",
          "outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
          PRESS_CLASSES
        )}
        style={getReviewChromeStyle(brand, "rgba(232,236,233,0.46)")}
      >
        <ImageUp className="size-9" strokeWidth={2.15} />
        <span className="font-[family-name:var(--font-roboto)] text-[14px] font-medium text-[#5C6B62]">
          Выберите фотографии нажав сюда
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="sr-only"
      />
      {previews.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {previews.map((preview) => (
            <div
              key={preview.url}
              className="relative size-16 shrink-0 overflow-hidden rounded-[14px] border border-transparent"
              style={getReviewChromeStyle(brand, "rgba(255,255,255,0.72)")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.url}
                alt={preview.name}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryButton({ brand }: { brand: string }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[52px] w-full cursor-pointer items-center gap-3 rounded-[18px] border border-transparent px-4 text-left text-[#15291C]",
        PRESS_CLASSES
      )}
      style={getReviewChromeStyle(brand)}
    >
      <span className="text-[15.5px] leading-snug font-bold tracking-[0px] text-[#15291C]">
        Выберите категорию
      </span>
      <span className="ml-auto grid size-[26px] place-items-center rounded-full bg-[rgba(20,40,28,0.06)]">
        <ChevronRight size={14} strokeWidth={2.4} color={brand} />
      </span>
    </button>
  );
}

function TagsInput({
  brand,
  tags,
  tagDraft,
  onTagDraftChange,
  onAddTag,
  onRemoveTag,
}: {
  brand: string;
  tags: string[];
  tagDraft: string;
  onTagDraftChange: (tag: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    onAddTag();
  }

  return (
    <section>
      <h2 className="text-[22px] leading-tight font-semibold text-[#15291C] max-[380px]:text-[20px]">
        Напишите тэги
      </h2>
      <p className="mt-1 mb-2 font-[family-name:var(--font-roboto)] text-[13px] leading-snug font-medium text-[#5C6B62]">
        Напишите тэг и добавьте его через ввод
      </p>
      <GlassSurface
        className={cn(FIELD_SURFACE_CLASSES, "min-h-[52px] h-auto")}
        tintClassName={FIELD_TINT_CLASSES}
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
        style={getReviewChromeStyle(brand)}
      >
        <div className="flex min-h-[50px] flex-wrap items-center gap-1.5 px-2.5 py-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="inline-flex h-[28px] items-center gap-1 rounded-full border border-transparent px-2.5 text-[12px] font-bold text-[#0E8A4F]"
              style={getReviewChromeStyle(brand, "rgba(46,204,113,0.14)")}
            >
              <span>#{tag}</span>
              <X className="size-3" strokeWidth={2.2} />
            </button>
          ))}
          <Input
            value={tagDraft}
            onChange={(event) => onTagDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите тэг"
            className={cn(FIELD_INPUT_CLASSES, "h-8 min-w-[120px] flex-1 px-1.5")}
          />
        </div>
      </GlassSurface>
    </section>
  );
}

export function NewReviewForm({ brand, palette }: NewReviewFormProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [dish, setDish] = useState("");
  const [price, setPrice] = useState("");
  const [place, setPlace] = useState("");
  const [address, setAddress] = useState("");
  const [rating, setRating] = useState(4.5);
  const [photos, setPhotos] = useState<File[]>([]);
  const [review, setReview] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  function handleBackClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  function addTag() {
    const normalizedTag = tagDraft.trim().replace(/^#/, "");

    if (!normalizedTag || tags.includes(normalizedTag)) {
      setTagDraft("");
      return;
    }

    setTags((currentTags) => [...currentTags, normalizedTag]);
    setTagDraft("");
  }

  return (
    <main className="absolute inset-0 overflow-hidden">
      <ReviewBackgroundBlobs palette={palette} />
      <div className="absolute inset-0 z-[1] flex flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(239,245,240,0.88))] pt-12.5">
        <section
          aria-label="Новый отзыв"
          className="hide-scroll flex-1 overflow-y-auto px-[18px] pb-25"
        >
          <header className="mb-5 flex items-center gap-4 pt-2">
            <motion.button
              type="button"
              aria-label="Назад"
              title="Назад"
              onClick={handleBackClick}
              className={cn(
                "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#15291C] outline-none",
                "border border-transparent",
                "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
              )}
              style={getReviewChromeStyle(brand, "rgba(255,255,255,0.58)")}
              whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
            >
              <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
            </motion.button>
            <h1 className="text-[24px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
              Новый отзыв
            </h1>
          </header>

          <div className="space-y-6">
            <ReviewField
              brand={brand}
              label="Что вы ели?"
              placeholder="Введите название блюда"
              value={dish}
              onChange={setDish}
            />

            <ReviewField
              brand={brand}
              label="Сколько стоило блюдо?"
              placeholder="Например: 450"
              value={price}
              inputMode="decimal"
              onChange={setPrice}
            />

            <section>
              <h2 className="mb-2 text-[22px] leading-tight font-semibold tracking-[0px] text-[#15291C] max-[380px]:text-[20px]">
                В каком заведении?
              </h2>
              <div className="space-y-1.5">
                <GlassSurface
                  className={FIELD_SURFACE_CLASSES}
                  contentClassName="h-full"
                  tintClassName={FIELD_TINT_CLASSES}
                  highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                  style={getReviewChromeStyle(brand)}
                >
                  <Input
                    aria-label="Название заведения"
                    value={place}
                    onChange={(event) => setPlace(event.target.value)}
                    placeholder="Название заведения"
                    className={FIELD_INPUT_CLASSES}
                  />
                </GlassSurface>
                <GlassSurface
                  className={FIELD_SURFACE_CLASSES}
                  contentClassName="h-full"
                  tintClassName={FIELD_TINT_CLASSES}
                  highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                  style={getReviewChromeStyle(brand)}
                >
                  <Input
                    aria-label="Адрес заведения"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="Адрес заведения"
                    className={FIELD_INPUT_CLASSES}
                  />
                </GlassSurface>
              </div>
            </section>

            <RatingControl
              rating={rating}
              shouldReduceMotion={shouldReduceMotion}
              onRate={setRating}
            />

            <PhotoUpload brand={brand} files={photos} onFilesChange={setPhotos} />

            <section>
              <div className="mb-2 flex items-end justify-between gap-3">
                <h2 className="text-[22px] leading-tight font-semibold text-[#15291C] max-[380px]:text-[20px]">
                  Напишите отзыв
                </h2>
                <span className="pb-0.5 text-[12px] font-bold text-[#5C6B62]">
                  {review.length}/{MAX_REVIEW_LENGTH}
                </span>
              </div>
              <GlassSurface
                className="min-h-[124px] rounded-[22px] border border-transparent bg-white transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[#15291C]/12"
                tintClassName={FIELD_TINT_CLASSES}
                highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                style={getReviewChromeStyle(brand)}
              >
                <Textarea
                  value={review}
                  maxLength={MAX_REVIEW_LENGTH}
                  onChange={(event) => setReview(event.target.value)}
                  placeholder="Что понравилось, что можно улучшить?"
                  className="min-h-[124px] resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] font-medium text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15px]"
                />
              </GlassSurface>
            </section>

            <CategoryButton brand={brand} />

            <TagsInput
              brand={brand}
              tags={tags}
              tagDraft={tagDraft}
              onTagDraftChange={setTagDraft}
              onAddTag={addTag}
              onRemoveTag={(tag) =>
                setTags((currentTags) =>
                  currentTags.filter((currentTag) => currentTag !== tag)
                )
              }
            />

            <div className="flex justify-center pt-5">
              <SubscribeStyleButton
                ariaLabel="Опубликовать"
                brand={brand}
                shouldReduceMotion={shouldReduceMotion}
                className={cn(
                  FULLSCREEN_SUBSCRIBE_BUTTON.regular,
                  "h-12 min-w-[256px] px-7 text-[18px] font-semibold"
                )}
              >
                <span>Опубликовать</span>
              </SubscribeStyleButton>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
