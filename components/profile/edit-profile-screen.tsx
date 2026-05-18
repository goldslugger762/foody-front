"use client";

import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, CircleAlert, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
import {
  FULLSCREEN_SUBSCRIBE_BUTTON,
  SubscribeStyleButton,
} from "@/components/feed/subscribe-style-button";
import { UserAvatar } from "@/components/feed/user-avatar";
import {
  FIELD_INPUT_CLASSES,
  FIELD_SURFACE_CLASSES,
  FIELD_TINT_CLASSES,
  PRESS_CLASSES,
  ReviewContentLayer,
  ReviewScreen,
  ReviewScrollArea,
  getReviewChromeStyle,
} from "@/components/review/review-screen-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { Palette } from "@/lib/mock-data";
import {
  getCurrentUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  type UserProfileResponse,
} from "@/lib/profile-api";
import { cn } from "@/lib/utils";

const MAX_NAME_LENGTH = 64;
const MAX_USERNAME_LENGTH = 32;
const MAX_CITY_LENGTH = 64;
const MAX_ABOUT_LENGTH = 250;
const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const USERNAME_PATTERN = /^[A-Za-z0-9_.]+$/;

type EditProfileScreenProps = {
  brand: string;
  palette: Palette;
};

type FormState = {
  about: string;
  city: string;
  displayName: string;
  username: string;
};

type FormErrors = Partial<Record<keyof FormState | "avatar" | "form", string>>;

type LoadState = "loading" | "ready" | "error";

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function getInitialForm(profile: UserProfileResponse["profile"]): FormState {
  return {
    about: profile.about ?? "",
    city: profile.city ?? "",
    displayName: profile.displayName,
    username: profile.username.replace(/^@+/, ""),
  };
}

function normalizeUsername(username: string) {
  return `@${username.trim().replace(/^@+/, "")}`;
}

function nullableText(value: string) {
  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}

function validateForm(form: FormState, avatarFile: File | null): FormErrors {
  const errors: FormErrors = {};
  const displayName = form.displayName.trim();
  const username = form.username.trim().replace(/^@+/, "");
  const city = form.city.trim();

  if (!displayName) {
    errors.displayName = "Укажите имя.";
  } else if (displayName.length > MAX_NAME_LENGTH) {
    errors.displayName = `До ${MAX_NAME_LENGTH} символов.`;
  }

  if (!username) {
    errors.username = "Укажите никнейм.";
  } else if (username.includes(" ")) {
    errors.username = "Без пробелов.";
  } else if (username.length > MAX_USERNAME_LENGTH) {
    errors.username = `До ${MAX_USERNAME_LENGTH} символов.`;
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = "Только буквы, цифры, точка и underscore.";
  }

  if (city.length > MAX_CITY_LENGTH) {
    errors.city = `До ${MAX_CITY_LENGTH} символов.`;
  }

  if (form.about.length > MAX_ABOUT_LENGTH) {
    errors.about = `До ${MAX_ABOUT_LENGTH} символов.`;
  }

  if (avatarFile && !avatarFile.type.startsWith("image/")) {
    errors.avatar = "Выберите изображение.";
  } else if (avatarFile && avatarFile.size > MAX_AVATAR_SIZE_BYTES) {
    errors.avatar = "Фото должно быть не больше 5 МБ.";
  }

  return errors;
}

function FieldShell({
  children,
  error,
  hint,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-end justify-between gap-3 px-1">
        <span className="text-[12px] leading-tight font-black tracking-[0.08em] text-[#7B8780] uppercase">
          {label}
        </span>
        {hint ? (
          <span className="font-[family-name:var(--font-roboto)] text-[12px] leading-tight font-bold text-[#6A766F]">
            {hint}
          </span>
        ) : null}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 block px-1 font-[family-name:var(--font-roboto)] text-[12px] leading-tight font-medium text-[#B42318]">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function ProfileInput({
  brand,
  error,
  inputMode,
  label,
  maxLength,
  onChange,
  placeholder,
  prefix,
  value,
}: {
  brand: string;
  error?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  prefix?: string;
  value: string;
}) {
  return (
    <FieldShell error={error} label={label}>
      <GlassSurface
        className={FIELD_SURFACE_CLASSES}
        contentClassName="h-full"
        tintClassName={FIELD_TINT_CLASSES}
        highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
        style={getReviewChromeStyle(brand)}
      >
        <div className="flex h-full items-center">
          {prefix ? (
            <span className="pl-3.5 text-[15.5px] leading-none font-semibold text-[#15291C]">
              {prefix}
            </span>
          ) : null}
          <Input
            aria-invalid={!!error}
            inputMode={inputMode}
            maxLength={maxLength}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            value={value}
            className={cn(
              FIELD_INPUT_CLASSES,
              "min-w-0 flex-1",
              prefix ? "pl-0" : ""
            )}
          />
        </div>
      </GlassSurface>
    </FieldShell>
  );
}

function EditProfileHeader({
  brand,
  canSave,
  isSaving,
  onBack,
  onSave,
}: {
  brand: string;
  canSave: boolean;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => Promise<void>;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-2 px-[18px] pt-2 pb-4">
      <motion.button
        type="button"
        aria-label="Назад"
        title="Назад"
        onClick={onBack}
        className={cn(
          "grid size-10 cursor-pointer place-items-center rounded-full border border-transparent text-[#15291C] outline-none",
          "backdrop-blur-[18px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
        )}
        style={getReviewChromeStyle(brand, "rgba(255,255,255,0.80)")}
        whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
      >
        <ArrowLeft className="size-[19px]" strokeWidth={2.35} />
      </motion.button>

      <h1 className="min-w-0 text-center text-[19px] leading-tight font-extrabold tracking-[0px] text-[#15291C]">
        Редактировать
      </h1>

      <SubscribeStyleButton
        active={false}
        ariaBusy={isSaving}
        ariaLabel="Сохранить профиль"
        brand={brand}
        disabled={!canSave || isSaving}
        shouldReduceMotion={shouldReduceMotion}
        title="Сохранить"
        className={cn(
          FULLSCREEN_SUBSCRIBE_BUTTON.regular,
          FULLSCREEN_SUBSCRIBE_BUTTON.smallRegular
        )}
        onClick={onSave}
      >
        <span className="flex h-full items-center justify-center gap-1.5">
          {isSaving ? <Spinner className="size-3.5" /> : null}
          Сохранить
        </span>
      </SubscribeStyleButton>
    </header>
  );
}

export function EditProfileScreen({ brand, palette }: EditProfileScreenProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [initialForm, setInitialForm] = useState<FormState | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    about: "",
    city: "",
    displayName: "",
    username: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoadState("loading");
    setErrors({});

    try {
      const response = await getCurrentUserProfile();
      const nextForm = getInitialForm(response.profile);

      setInitialForm(nextForm);
      setInitialAvatarUrl(response.profile.avatarUrl);
      setForm(nextForm);
      setAvatarFile(null);
      setAvatarPreviewUrl(null);
      setLoadState("ready");
    } catch {
      setLoadState("error");
      setErrors({ form: "Не удалось загрузить профиль." });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const isDirty = useMemo(() => {
    if (!initialForm) {
      return false;
    }

    return (
      form.displayName !== initialForm.displayName ||
      form.username !== initialForm.username ||
      form.city !== initialForm.city ||
      form.about !== initialForm.about ||
      avatarFile !== null
    );
  }, [avatarFile, form, initialForm]);

  const avatarSrc = avatarPreviewUrl ?? initialAvatarUrl;
  const canSave = loadState === "ready" && isDirty && !isSaving;

  function leaveProfileEditor() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/me");
  }

  function handleBackClick() {
    if (isDirty) {
      setShowExitDialog(true);
      return;
    }

    leaveProfileEditor();
  }

  function handleDiscardChanges() {
    setShowExitDialog(false);
    leaveProfileEditor();
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
    }));
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        avatar: "Выберите изображение.",
        form: undefined,
      }));
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        avatar: "Фото должно быть не больше 5 МБ.",
        form: undefined,
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setAvatarFile(file);
    setAvatarPreviewUrl(previewUrl);
    setErrors((currentErrors) => ({
      ...currentErrors,
      avatar: undefined,
      form: undefined,
    }));
  }

  async function handleSave() {
    const nextErrors = validateForm(form, avatarFile);

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      const uploadedAvatar = avatarFile
        ? await uploadUserAvatar(avatarFile)
        : null;

      await updateUserProfile({
        about: nullableText(form.about),
        avatarUrl: uploadedAvatar?.avatarUrl,
        city: nullableText(form.city),
        displayName: form.displayName.trim(),
        username: normalizeUsername(form.username),
      });

      router.push("/me?profileSaved=1");
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Не удалось сохранить профиль.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const retryButton = (
    <motion.button
      type="button"
      onClick={() => void loadProfile()}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
      className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/62 px-4 text-[12px] font-extrabold whitespace-nowrap text-[#15291C] shadow-[inset_1px_1px_0_rgba(255,255,255,0.75)] outline-none transition-colors hover:bg-white/78 focus-visible:ring-2 focus-visible:ring-[#15291C]/18 [&_svg]:shrink-0"
    >
      <RefreshCw className="size-3.5" />
      Повторить
    </motion.button>
  );

  return (
    <ReviewScreen palette={palette}>
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-[24px] border-0 bg-white/88 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
              Выйти без сохранения?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
              Изменения профиля не будут сохранены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
            <AlertDialogCancel
              className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
              style={getReviewChromeStyle(brand)}
              onClick={() => setShowExitDialog(false)}
            >
              Остаться
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#8F1D1D] shadow-[0_8px_20px_rgba(60,20,20,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-red-900/15"
              style={{
                background:
                  "linear-gradient(#FFFFFF,#FFFFFF) padding-box, linear-gradient(140deg, rgba(127,29,29,0.76), rgba(185,28,28,0.44), rgba(239,68,68,0.24), rgba(127,29,29,0.68)) border-box",
                boxShadow:
                  "0 6px 14px rgba(60,20,20,0.07), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(47,11,11,0.05)",
              }}
              onClick={handleDiscardChanges}
            >
              Выйти
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReviewContentLayer>
        <EditProfileHeader
          brand={brand}
          canSave={canSave}
          isSaving={isSaving}
          onBack={handleBackClick}
          onSave={handleSave}
        />

        <ReviewScrollArea
          aria-label="Редактирование профиля"
          className="px-[18px] pb-12"
        >
          {loadState === "loading" ? (
            <div className="grid min-h-[420px] place-items-center">
              <Spinner className="size-7 text-[#1B7F45]" />
            </div>
          ) : loadState === "error" ? (
            <GlassSurface
              className="mt-8 rounded-[26px] border border-green-50/92 bg-white/45"
              contentClassName="flex min-h-[320px] flex-col items-center justify-center px-6 text-center"
            >
              <p className="text-[20px] leading-tight font-extrabold text-[#15291C]">
                Профиль не загрузился
              </p>
              <p className="mt-2 mb-4 font-[family-name:var(--font-roboto)] text-[14px] leading-[1.45] font-medium text-[#5C6B62]">
                Попробуйте ещё раз перед редактированием.
              </p>
              {retryButton}
            </GlassSurface>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {errors.form ? (
                  <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={
                      canAnimate(shouldReduceMotion)
                        ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                        : { duration: 0 }
                    }
                  >
                    <Alert className="rounded-[18px] border-red-400/70 bg-white/86 px-4 py-3 text-[#15291C] shadow-[0_12px_28px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[18px]">
                      <CircleAlert
                        className="size-4"
                        color="#EF4444"
                        strokeWidth={2.3}
                        aria-hidden="true"
                      />
                      <AlertDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#15291C]">
                        {errors.form}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <section className="flex flex-col items-center pt-1 text-center">
                <button
                  type="button"
                  aria-label="Изменить фото профиля"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative grid size-[126px] cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
                    PRESS_CLASSES
                  )}
                >
                  <span className="absolute inset-0 rounded-full bg-white/58 shadow-[0_16px_36px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.76)] backdrop-blur-[18px]" />
                  <UserAvatar
                    name={normalizeUsername(form.username || "you")}
                    size={112}
                    src={avatarSrc}
                    className="relative z-[1] shadow-[0_10px_24px_rgba(20,40,28,0.16),inset_0_0_0_2px_rgba(255,255,255,0.82)]"
                  />
                  <span
                    className="absolute right-1 bottom-2 z-[2] grid size-9 place-items-center rounded-full border-2 border-white text-white shadow-[0_8px_18px_rgba(20,40,28,0.18)]"
                    style={{ backgroundColor: brand }}
                  >
                    <Camera className="size-4.5" strokeWidth={2.35} />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "mt-3 cursor-pointer text-[15px] leading-tight font-extrabold text-[#159447] outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
                    PRESS_CLASSES
                  )}
                >
                  Изменить фото
                </button>
                {errors.avatar ? (
                  <p className="mt-2 font-[family-name:var(--font-roboto)] text-[12px] leading-tight font-medium text-[#B42318]">
                    {errors.avatar}
                  </p>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </section>

              <div className="space-y-5">
                <ProfileInput
                  brand={brand}
                  error={errors.displayName}
                  label="Имя"
                  maxLength={MAX_NAME_LENGTH}
                  placeholder="Как вас зовут"
                  value={form.displayName}
                  onChange={(value) => updateField("displayName", value)}
                />

                <ProfileInput
                  brand={brand}
                  error={errors.username}
                  label="Никнейм"
                  maxLength={MAX_USERNAME_LENGTH}
                  placeholder="foody_user"
                  prefix="@"
                  value={form.username}
                  onChange={(value) =>
                    updateField("username", value.replace(/^@+/, ""))
                  }
                />

                <ProfileInput
                  brand={brand}
                  error={errors.city}
                  inputMode="text"
                  label="Город"
                  maxLength={MAX_CITY_LENGTH}
                  placeholder="Город"
                  value={form.city}
                  onChange={(value) => updateField("city", value)}
                />

                <FieldShell
                  error={errors.about}
                  hint={`${form.about.length} / ${MAX_ABOUT_LENGTH} символов`}
                  label="О себе"
                >
                  <GlassSurface
                    className="min-h-[136px] rounded-[22px] border border-transparent bg-white transition-shadow duration-150 focus-within:ring-2 focus-within:ring-[#15291C]/12"
                    tintClassName={FIELD_TINT_CLASSES}
                    highlightClassName="after:border-[0.5px] after:border-white/58 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.74),inset_-1px_-1px_0_rgba(255,255,255,0.26)]"
                    style={getReviewChromeStyle(brand)}
                  >
                    <Textarea
                      aria-invalid={!!errors.about}
                      maxLength={MAX_ABOUT_LENGTH}
                      onChange={(event) =>
                        updateField("about", event.target.value)
                      }
                      placeholder="Расскажите, какие места и вкусы вы ищете"
                      value={form.about}
                      className="min-h-[136px] resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] leading-[1.45] font-medium text-[#15291C] shadow-none outline-none placeholder:text-[#8A958E] focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-transparent md:text-[15px]"
                    />
                  </GlassSurface>
                </FieldShell>
              </div>
            </div>
          )}
        </ReviewScrollArea>
      </ReviewContentLayer>
    </ReviewScreen>
  );
}
