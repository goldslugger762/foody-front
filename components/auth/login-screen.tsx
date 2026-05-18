"use client";

import {
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { GlassSurface } from "@/components/feed/glass-surface";
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AUTH_SUCCESS_HREF, loginUser } from "@/lib/auth-api";
import type { Palette } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type LoginScreenProps = {
  brand: string;
  palette: Palette;
};

type LoginForm = {
  email: string;
  password: string;
};

type LoginErrors = Partial<Record<keyof LoginForm | "form", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function validateLoginForm(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = "Введите почту.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Почта выглядит некорректно.";
  }

  if (!form.password.trim()) {
    errors.password = "Введите пароль.";
  }

  return errors;
}

function getAuthButtonStyle({
  active,
  brand,
  fill,
}: {
  active: boolean;
  brand: string;
  fill: string;
}): CSSProperties {
  return {
    background: active
      ? `linear-gradient(135deg, ${fill}, rgba(226,255,235,0.78)) padding-box, linear-gradient(120deg, ${brand}E6, rgba(122,236,164,0.78), rgba(100,218,189,0.66), ${brand}A8) border-box`
      : `linear-gradient(${fill}, ${fill}) padding-box, linear-gradient(140deg, color-mix(in srgb, ${brand} 50%, transparent), rgba(122,236,164,0.42), rgba(100,218,189,0.38), color-mix(in srgb, ${brand} 35%, transparent)) border-box`,
    boxShadow: active
      ? `0 12px 28px ${brand}26, inset 1px 1px 0 rgba(255,255,255,0.62), inset -1px -1px 0 rgba(11,47,29,0.05)`
      : "0 8px 18px rgba(20,40,28,0.07), inset 1px 1px 0 rgba(255,255,255,0.34), inset -1px -1px 0 rgba(11,47,29,0.04)",
  };
}

function AuthButton({
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

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative flex h-12 w-full cursor-pointer items-center justify-center overflow-hidden rounded-[20px] border border-transparent px-5 text-[16px] leading-none font-extrabold tracking-[0px] outline-none backdrop-blur-[18px] backdrop-saturate-[180%] transition-[color,box-shadow,opacity] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18 disabled:cursor-not-allowed disabled:text-[#5C6B62]/82",
        PRESS_CLASSES,
        active ? "text-[#06301A]" : "text-[#5C6B62]",
        className
      )}
      style={getAuthButtonStyle({ active, brand, fill })}
      whileTap={
        canAnimate(shouldReduceMotion) && !disabled ? { scale: 0.965 } : undefined
      }
    >
      {children}
    </motion.button>
  );
}

function AuthField({
  autoComplete,
  brand,
  error,
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
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  rightControl?: ReactNode;
  type: string;
  value: string;
}) {
  const errorId = error ? `login-${label}-error` : undefined;

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <GlassSurface
        className={cn(
          FIELD_SURFACE_CLASSES,
          "bg-white/84",
          error &&
            "focus-within:ring-red-500/20 focus-within:shadow-[0_10px_24px_rgba(20,40,28,0.1),0_0_0_1px_rgba(239,68,68,0.24),inset_1px_1px_0_rgba(255,255,255,0.78)]"
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
              "min-w-0 flex-1 aria-invalid:border-transparent aria-invalid:ring-0 aria-invalid:ring-transparent",
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

function PasswordVisibilityButton({
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

export function LoginScreen({ brand, palette }: LoginScreenProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [registerNoticeOpen, setRegisterNoticeOpen] = useState(false);

  const fieldsFilled = useMemo(
    () => form.email.trim().length > 0 && form.password.trim().length > 0,
    [form]
  );
  function updateField(field: keyof LoginForm, value: string) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateLoginForm(form);

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      router.replace(AUTH_SUCCESS_HREF);
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : "Не удалось войти. Попробуйте ещё раз.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ReviewScreen palette={palette}>
      <ReviewContentLayer>
        <ReviewScrollArea
          aria-label="Авторизация"
          className="px-[18px] pt-2 pb-10"
        >
          <div className="mx-auto flex min-h-[calc(100svh-7.5rem)] w-full max-w-[356px] flex-col justify-center py-6">
            <motion.section
              className="relative mb-8 flex justify-center pt-2 text-center"
              initial={canAnimate(shouldReduceMotion) ? { opacity: 0, y: 14 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                aria-hidden="true"
                className="absolute top-1/2 left-1/2 h-18 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[24px]"
                animate={
                  canAnimate(shouldReduceMotion)
                    ? { opacity: [0.16, 0.32, 0.16], scale: [0.94, 1.05, 0.94] }
                    : { opacity: 0.2, scale: 1 }
                }
                transition={{
                  duration: 4.8,
                  ease: "easeInOut",
                  repeat: Infinity,
                }}
                style={{ background: brand }}
              />
              <div className="relative z-[1] flex items-center justify-center gap-3">
                <Image
                  src="/Foody_LOGO.webp"
                  alt=""
                  aria-hidden="true"
                  width={58}
                  height={58}
                  priority
                  className="size-14 shrink-0 object-contain drop-shadow-[0_10px_20px_rgba(20,40,28,0.13)]"
                />
                <h1 className="text-[34px] leading-none font-black tracking-[0px] text-[#15291C]">
                  Foody
                </h1>
              </div>
            </motion.section>

            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={canAnimate(shouldReduceMotion) ? { opacity: 0, y: 18 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.42, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="px-1">
                <p className="text-[18px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
                  Авторизоваться
                </p>
              </div>

              <div className="space-y-4">
                <AuthField
                  autoComplete="email"
                  brand={brand}
                  error={errors.email}
                  inputMode="email"
                  label="Email"
                  placeholder="Введите вашу почту"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />

                <AuthField
                  autoComplete="current-password"
                  brand={brand}
                  error={errors.password}
                  label="Пароль"
                  placeholder="Введите пароль"
                  type={passwordVisible ? "text" : "password"}
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                  rightControl={
                    <PasswordVisibilityButton
                      passwordVisible={passwordVisible}
                      onClick={() =>
                        setPasswordVisible((currentVisible) => !currentVisible)
                      }
                    />
                  }
                />
              </div>

              {errors.form ? (
                <motion.div
                  initial={
                    canAnimate(shouldReduceMotion)
                      ? { opacity: 0, y: -8 }
                      : false
                  }
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-1"
                >
                  <Alert className="rounded-[18px] border-red-400/60 bg-white/82 px-4 py-3 text-[#15291C] shadow-[0_12px_28px_rgba(20,40,28,0.1)] backdrop-blur-[18px]">
                    <CircleAlert
                      className="size-4"
                      color="#EF4444"
                      strokeWidth={2.3}
                      aria-hidden="true"
                    />
                    <AlertDescription className="font-[family-name:var(--font-roboto)] text-[13.5px] leading-snug font-medium text-[#15291C]">
                      {errors.form}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              ) : null}

              <div className="space-y-3 pt-1">
                <AuthButton
                  active={fieldsFilled}
                  brand={brand}
                  disabled={!fieldsFilled || isLoading}
                  fill={fieldsFilled ? "rgba(189,247,208,0.78)" : "rgba(255,255,255,0.20)"}
                  type="submit"
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? <Spinner className="size-4" /> : null}
                    {isLoading ? "Входим..." : "Войти"}
                  </span>
                </AuthButton>

                <motion.button
                  type="button"
                  onClick={() => setForgotDialogOpen(true)}
                  className={cn(
                    "mx-auto block cursor-pointer rounded-full px-4 py-2 text-[14px] leading-tight font-extrabold tracking-[0px] text-[#1B7F45] outline-none transition-colors hover:bg-white/36 focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
                    PRESS_CLASSES
                  )}
                  whileTap={
                    canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined
                  }
                >
                  Забыли пароль?
                </motion.button>
              </div>

              <div className="pt-18 max-[380px]:pt-10">
                <AuthButton
                  active
                  brand={brand}
                  fill="rgba(255,255,255,0.16)"
                  type="button"
                  className="text-[#0B2F1D]"
                  // TODO: route to the registration screen when it is added.
                  onClick={() => setRegisterNoticeOpen(true)}
                >
                  Зарегистрироваться
                </AuthButton>
              </div>
            </motion.form>
          </div>
        </ReviewScrollArea>
      </ReviewContentLayer>

      <AlertDialog open={forgotDialogOpen} onOpenChange={setForgotDialogOpen}>
        <AlertDialogContent className="rounded-[24px] border-0 bg-white/88 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
              Восстановление пароля
            </AlertDialogTitle>
            <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
              Эта функция будет доступна позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
            <AlertDialogAction
              className="h-10 w-full rounded-[18px] border border-transparent px-4 text-[14px] font-bold text-[#06301A] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
              style={getReviewChromeStyle(brand, "rgba(189,247,208,0.78)")}
            >
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={registerNoticeOpen} onOpenChange={setRegisterNoticeOpen}>
        <AlertDialogContent className="rounded-[24px] border-0 bg-white/88 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
              Регистрация
            </AlertDialogTitle>
            <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
              Экран регистрации будет доступен позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
            <AlertDialogAction
              className="h-10 w-full rounded-[18px] border border-transparent px-4 text-[14px] font-bold text-[#06301A] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
              style={getReviewChromeStyle(brand, "rgba(189,247,208,0.78)")}
            >
              Понятно
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ReviewScreen>
  );
}
