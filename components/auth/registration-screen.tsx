"use client";

import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  AuthButton,
  AuthField,
  PasswordVisibilityButton,
  canAnimate,
} from "@/components/auth/auth-controls";
import { RegistrationSuccessAlert } from "@/components/auth/registration-success-alert";
import {
  PRESS_CLASSES,
  ReviewScreen,
  ReviewScrollArea,
  getReviewChromeStyle,
} from "@/components/review/review-screen-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  AUTH_SUCCESS_HREF,
  AuthApiError,
  checkEmailAvailability,
  checkUsernameAvailability,
  normalizeUsername,
  registerUser,
} from "@/lib/auth-api";
import type { Palette } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type RegistrationScreenProps = {
  brand: string;
  palette: Palette;
};

type RegistrationStep = 1 | 2 | 3;

type RegistrationForm = {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  username: string;
};

type RegistrationErrors = Partial<Record<keyof RegistrationForm | "form", string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^[\p{L}\d]+$/u;
const USERNAME_PATTERN = /^[A-Za-z\d_]+$/;
const STEP_PROGRESS: Record<RegistrationStep, number> = {
  1: 33,
  2: 66,
  3: 100,
};

function validateEmail(emailValue: string) {
  const email = emailValue.trim();

  if (!email || !EMAIL_PATTERN.test(email)) {
    return "Введите корректную электронную почту";
  }

  return undefined;
}

function validatePassword(password: string) {
  if (password.length < 8) {
    return "Пароль должен быть минимум 8 символов";
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "Пароль не должен содержать специальные символы";
  }

  return undefined;
}

function validateConfirmPassword(password: string, confirmPassword: string) {
  if (!confirmPassword) {
    return "Повторите пароль";
  }

  if (password !== confirmPassword) {
    return "Пароли не совпадают";
  }

  return undefined;
}

function validateName(nameValue: string) {
  const name = nameValue.trim();

  if (!name) {
    return "Введите имя";
  }

  if (name.length > 12) {
    return "Имя может быть максимум 12 символов";
  }

  return undefined;
}

function validateUsername(usernameValue: string) {
  const username = normalizeUsername(usernameValue);

  if (!username) {
    return "Введите имя пользователя";
  }

  if (username.length > 12) {
    return "Имя пользователя может быть максимум 12 символов";
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Имя пользователя может содержать только английские буквы, цифры и _";
  }

  return undefined;
}

function formatUsernameInput(value: string) {
  const username = normalizeUsername(value).replace(/[^A-Za-z\d_]/g, "").slice(0, 12);

  return username ? `@${username}` : "@";
}

function RegistrationLayout({
  brand,
  children,
  description,
  footer,
  onBack,
  progress,
  title,
}: {
  brand: string;
  children: ReactNode;
  description: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  progress: number;
  title: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="absolute inset-0 z-[1] flex flex-col pt-12.5">
      <ReviewScrollArea
        aria-label="Регистрация"
        className="px-[18px] pt-2 pb-10"
      >
        <div className="mx-auto flex min-h-[calc(100svh-7.5rem)] w-full max-w-[390px] flex-col py-6">
          <div className="pt-8 max-[380px]:pt-4">
            <div className="mb-5 flex items-center gap-3">
              {onBack ? (
                <motion.button
                  type="button"
                  aria-label="Назад"
                  title="Назад"
                  onClick={onBack}
                  className={cn(
                    "grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-[#15291C] outline-none border border-transparent backdrop-blur-[18px] backdrop-saturate-[180%] focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
                    PRESS_CLASSES
                  )}
                  style={getReviewChromeStyle(brand, "rgba(255,255,255,0.80)")}
                  whileTap={
                    canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined
                  }
                >
                  <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
                </motion.button>
              ) : null}
              <h1 className="min-w-0 flex-1 text-[24px] leading-tight font-black tracking-[0px] text-[#15291C]">
                {title}
              </h1>
            </div>

            <div className="px-1">
              <div className="mt-2 font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#425146]">
                {description}
              </div>
              <Progress
                value={progress}
                className="mt-4 h-1.5 bg-[#15291C]/12 [&_[data-slot=progress-indicator]]:bg-[var(--registration-progress)] [&_[data-slot=progress-indicator]]:transition-transform [&_[data-slot=progress-indicator]]:duration-500 [&_[data-slot=progress-indicator]]:ease-out"
                style={
                  {
                    "--registration-progress": brand,
                  } as CSSProperties
                }
              />
            </div>

            <div className="mt-14 max-[380px]:mt-9">{children}</div>
          </div>

          {footer ? (
            <div className="mt-auto pt-10 max-[380px]:pt-5">{footer}</div>
          ) : null}
        </div>
      </ReviewScrollArea>
    </div>
  );
}

export function RegistrationScreen({ brand, palette }: RegistrationScreenProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [step, setStep] = useState<RegistrationStep>(1);
  const [form, setForm] = useState<RegistrationForm>({
    confirmPassword: "",
    email: "",
    name: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1);
  const [successOpen, setSuccessOpen] = useState(false);

  const stepCanSubmit = useMemo(() => {
    if (step === 1) {
      return !!form.email.trim();
    }

    if (step === 2) {
      return !!form.password && !!form.confirmPassword;
    }

    return !!form.name.trim() && normalizeUsername(form.username).length > 0;
  }, [form, step]);

  function updateField(field: keyof RegistrationForm, value: string) {
    const nextValue =
      field === "name"
        ? value.slice(0, 12)
        : field === "username"
          ? formatUsernameInput(value)
          : value;

    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      form: undefined,
      ...(field === "password" ? { confirmPassword: undefined } : {}),
    }));
  }

  function setBackendError(error: unknown) {
    if (error instanceof AuthApiError && error.field && error.field !== "form") {
      setErrors({
        [error.field]: error.message,
      });
      return;
    }

    setErrors({
      form:
        error instanceof Error
          ? error.message
          : "Не удалось выполнить запрос. Попробуйте ещё раз.",
    });
  }

  function goBack() {
    setErrors({});
    setSlideDirection(-1);
    setStep((currentStep) =>
      currentStep === 3 ? 2 : currentStep === 2 ? 1 : currentStep
    );
  }

  function handleHeaderBack() {
    if (step === 1) {
      router.replace("/login");
      return;
    }

    goBack();
  }

  function closeSuccess() {
    setSuccessOpen(false);
    router.replace(AUTH_SUCCESS_HREF);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (step === 1) {
      const nextEmailError = validateEmail(form.email);

      if (nextEmailError) {
        setErrors({ email: nextEmailError });
        return;
      }

      setIsLoading(true);

      try {
        await checkEmailAvailability(form.email);
        setSlideDirection(1);
        setStep(2);
      } catch (error) {
        setBackendError(error);
      } finally {
        setIsLoading(false);
      }

      return;
    }

    if (step === 2) {
      const nextPasswordError = validatePassword(form.password);
      const nextConfirmPasswordError = validateConfirmPassword(
        form.password,
        form.confirmPassword
      );

      if (nextPasswordError || nextConfirmPasswordError) {
        setErrors({
          confirmPassword: nextConfirmPasswordError,
          password: nextPasswordError,
        });
        return;
      }

      setSlideDirection(1);
      setStep(3);
      return;
    }

    const nextNameError = validateName(form.name);
    const nextUsernameError = validateUsername(form.username);

    if (nextNameError || nextUsernameError) {
      setErrors({
        name: nextNameError,
        username: nextUsernameError,
      });
      return;
    }

    setIsLoading(true);

    try {
      const username = normalizeUsername(form.username);

      await checkUsernameAvailability(username);
      await registerUser({
        email: form.email,
        name: form.name,
        password: form.password,
        username,
      });
      setSuccessOpen(true);
    } catch (error) {
      setBackendError(error);
    } finally {
      setIsLoading(false);
    }
  }

  const submitLabel = step === 3 ? "Завершить регистрацию" : "Продолжить";
  const loadingLabel =
    step === 1 ? "Проверяем..." : step === 3 ? "Создаём..." : "Продолжаем...";

  return (
    <ReviewScreen palette={palette}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[0] bg-[radial-gradient(34rem_26rem_at_88%_72%,rgba(243,246,242,0.72),rgba(243,246,242,0.34)_36%,transparent_64%)]"
      />
      <RegistrationLayout
        brand={brand}
        progress={STEP_PROGRESS[step]}
        title={
          step === 1
            ? "Укажите вашу электронную почту"
            : step === 2
              ? "Укажите ваш пароль"
              : "Укажите ваши данные"
        }
        description={
          step === 1 ? (
            "Укажите электронную почту, по которой с вами можно связаться. Данная электронная почта не будет показана в профиле."
          ) : step === 2 ? (
            "Пароль должен состоять из 8 символов и не содержать в себе специальных символов"
          ) : (
            <>
              Укажите ваше имя и имя пользователя. По имени пользователя вас
              смогут найти ваши друзья.
              <span className="mt-1 block">
                Имя и имя пользователя могут быть максимум 12 символов.
              </span>
            </>
          )
        }
        onBack={step > 1 ? handleHeaderBack : undefined}
        footer={
          step === 1 ? (
            <motion.button
              type="button"
              onClick={() => router.replace("/login")}
              className={cn(
                "mx-auto block cursor-pointer rounded-full px-3 py-2 text-[14px] leading-tight font-extrabold tracking-[0px] text-[#15291C] outline-none transition-colors hover:bg-[#15291C]/6 focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
                PRESS_CLASSES
              )}
              whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.94 } : undefined}
            >
              У меня уже есть аккаунт
            </motion.button>
          ) : undefined
        }
      >
        <motion.form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-4"
          initial={canAnimate(shouldReduceMotion) ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              className="space-y-4"
              initial={
                canAnimate(shouldReduceMotion)
                  ? { opacity: 0, x: slideDirection * 42 }
                  : false
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                canAnimate(shouldReduceMotion)
                  ? { opacity: 0, x: slideDirection * -42 }
                  : undefined
              }
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            >
              {step === 1 ? (
                <AuthField
                  autoComplete="email"
                  brand={brand}
                  error={errors.email}
                  idPrefix="registration"
                  inputMode="email"
                  label="Email"
                  placeholder="example@mail.com"
                  type="text"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />
              ) : null}

              {step === 2 ? (
                <>
                  <AuthField
                    autoComplete="new-password"
                    brand={brand}
                    error={errors.password}
                    idPrefix="registration"
                    label="Пароль"
                    placeholder="Введите Ваш пароль..."
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
                  <AuthField
                    autoComplete="new-password"
                    brand={brand}
                    error={errors.confirmPassword}
                    idPrefix="registration"
                    label="Повторите пароль"
                    placeholder="Повторите пароль..."
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(value) => updateField("confirmPassword", value)}
                    rightControl={
                      <PasswordVisibilityButton
                        passwordVisible={confirmPasswordVisible}
                        onClick={() =>
                          setConfirmPasswordVisible(
                            (currentVisible) => !currentVisible
                          )
                        }
                      />
                    }
                  />
                </>
              ) : null}

              {step === 3 ? (
                <>
                  <AuthField
                    autoComplete="given-name"
                    brand={brand}
                    error={errors.name}
                    idPrefix="registration"
                    label="Имя"
                    placeholder="Иван..."
                    type="text"
                    value={form.name}
                    maxLength={12}
                    onChange={(value) => updateField("name", value)}
                  />
                  <AuthField
                    autoComplete="username"
                    brand={brand}
                    error={errors.username}
                    idPrefix="registration"
                    label="Имя пользователя"
                    placeholder="@ivan_ivanov..."
                    type="text"
                    inputMode="text"
                    value={form.username}
                    maxLength={13}
                    onFocus={() => {
                      if (!form.username) {
                        updateField("username", "@");
                      }
                    }}
                    onChange={(value) => updateField("username", value)}
                  />
                </>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {errors.form ? (
            <motion.div
              initial={
                canAnimate(shouldReduceMotion) ? { opacity: 0, y: -8 } : false
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

          <div className="pt-1">
            <AuthButton
              active={stepCanSubmit}
              brand={brand}
              disabled={!stepCanSubmit || isLoading}
              fill={stepCanSubmit ? "rgba(189,247,208,0.30)" : "rgba(255,255,255,0.40)"}
              type="submit"
            >
              <span className="flex items-center justify-center gap-2">
                {isLoading ? <Spinner className="size-4" /> : null}
                {isLoading ? loadingLabel : submitLabel}
              </span>
            </AuthButton>
          </div>
        </motion.form>
      </RegistrationLayout>

      <RegistrationSuccessAlert
        brand={brand}
        onClose={closeSuccess}
        open={successOpen}
      />
    </ReviewScreen>
  );
}
