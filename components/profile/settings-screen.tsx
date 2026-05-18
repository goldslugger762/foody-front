"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CircleAlert,
  LogOut,
  LockKeyhole,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import {
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
import { Spinner } from "@/components/ui/spinner";
import { AUTH_REDIRECT_HREF, deleteAccount, logout } from "@/lib/auth-api";
import type { Palette } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type SettingsScreenProps = {
  brand: string;
  palette: Palette;
};

type PendingAction = "logout" | "delete" | null;

const DANGER_CHROME_STYLE = {
  background:
    "linear-gradient(rgba(255,255,255,0.82),rgba(255,255,255,0.82)) padding-box, linear-gradient(140deg, rgba(185,28,28,0.56), rgba(239,68,68,0.30), rgba(255,255,255,0.74), rgba(185,28,28,0.38)) border-box",
  boxShadow:
    "0 6px 14px rgba(60,20,20,0.07), inset 1px 1px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(47,11,11,0.05)",
} as const;

function canAnimate(shouldReduceMotion: boolean | null) {
  return !shouldReduceMotion;
}

function SettingsHeader({
  brand,
  onBack,
}: {
  brand: string;
  onBack: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <header className="mb-5 flex items-center gap-4 pt-2">
      <motion.button
        type="button"
        aria-label="Назад"
        title="Назад"
        onClick={onBack}
        className={cn(
          "grid size-9 cursor-pointer place-items-center rounded-full border border-transparent text-[#15291C] outline-none",
          "backdrop-blur-[18px] backdrop-saturate-[180%] transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#15291C]/18"
        )}
        style={getReviewChromeStyle(brand, "rgba(255,255,255,0.80)")}
        whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.92 } : undefined}
      >
        <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
      </motion.button>

      <h1 className="text-[24px] leading-tight font-semibold tracking-[0px] text-[#15291C]">
        Настройки
      </h1>
    </header>
  );
}

function SettingsSection({
  children,
  title,
  titleClassName,
}: {
  children: React.ReactNode;
  title: string;
  titleClassName?: string;
}) {
  return (
    <section>
      <h2
        className={cn(
          "mb-3 px-1 text-[12px] leading-tight font-black tracking-[0.72px] text-[#5C6B62]/72 uppercase",
          titleClassName
        )}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function AccountItem({
  brand,
  description,
  icon: Icon,
  onClick,
  title,
}: {
  brand: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  title: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-[68px] w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left text-[#15291C] outline-none transition-colors first:rounded-t-[22px] last:rounded-b-[22px] hover:bg-white/34 focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
        PRESS_CLASSES
      )}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.985 } : undefined}
    >
      <span
        className="grid size-10 shrink-0 place-items-center rounded-[14px]"
        style={{
          background: `${brand}1F`,
          boxShadow: "0 5px 12px rgba(20,40,28,0.06)",
        }}
      >
        <Icon className="size-5" color="#5C6B62" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] leading-tight font-bold tracking-[0px]">
          {title}
        </span>
        <span className="mt-1 block font-[family-name:var(--font-roboto)] text-[13.5px] leading-tight font-medium text-[#5C6B62]">
          {description}
        </span>
      </span>
      <ChevronRight
        className="size-4 shrink-0 text-[#5C6B62]/72 transition-transform group-hover:translate-x-0.5"
        strokeWidth={2.35}
      />
    </motion.button>
  );
}

function DangerButton({
  disabled,
  icon: Icon,
  isPending,
  onClick,
  title,
}: {
  disabled: boolean;
  icon: LucideIcon;
  isPending: boolean;
  onClick: () => void;
  title: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex min-h-[58px] w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-[#B42318] outline-none transition-colors first:rounded-t-[22px] last:rounded-b-[22px] hover:bg-red-50/42 disabled:pointer-events-none disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-900/15",
        PRESS_CLASSES
      )}
      whileTap={canAnimate(shouldReduceMotion) ? { scale: 0.985 } : undefined}
    >
      <span className="min-w-0 flex-1 text-[15.5px] leading-tight font-extrabold tracking-[0px]">
        {title}
      </span>
      {isPending ? (
        <Spinner className="size-4 shrink-0" />
      ) : (
        <Icon className="size-5 shrink-0" strokeWidth={2.35} />
      )}
    </motion.button>
  );
}

function ConfirmationDialog({
  actionLabel,
  brand,
  description,
  error,
  loadingLabel,
  onConfirm,
  onOpenChange,
  open,
  pending,
  title,
}: {
  actionLabel: string;
  brand: string;
  description: string;
  error: string | null;
  loadingLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  title: string;
}) {
  function handleOpenChange(nextOpen: boolean) {
    if (pending) {
      return;
    }

    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="rounded-[24px] border-0 bg-white/88 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error ? (
          <Alert
            variant="destructive"
            className="rounded-[18px] border-red-200/72 bg-red-50/74 px-3 py-2.5"
          >
            <CircleAlert className="size-4" />
            <AlertDescription className="font-[family-name:var(--font-roboto)] text-[13px] leading-snug font-semibold">
              {error}
            </AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
          <AlertDialogCancel
            disabled={pending}
            className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
            style={getReviewChromeStyle(brand)}
          >
            Отмена
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            className="h-10 w-full rounded-[18px] border border-transparent bg-white px-4 text-[14px] font-bold text-[#8F1D1D] shadow-[0_8px_20px_rgba(60,20,20,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-red-900/15"
            style={DANGER_CHROME_STYLE}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <Spinner className="size-4" />
                {loadingLabel}
              </span>
            ) : (
              actionLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SettingsScreen({ brand, palette }: SettingsScreenProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isLogoutPending = pendingAction === "logout";
  const isDeletePending = pendingAction === "delete";
  const isAnyActionPending = pendingAction !== null;

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/me");
  }

  function handlePlaceholderClick(section: string) {
    setNotice(`${section} появятся позже.`);
  }

  async function handleLogout() {
    setPendingAction("logout");
    setLogoutError(null);

    try {
      await logout();
      setLogoutDialogOpen(false);
      router.replace(AUTH_REDIRECT_HREF);
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "Не удалось выйти из аккаунта."
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteAccount() {
    setPendingAction("delete");
    setDeleteError(null);

    try {
      await deleteAccount();
      setDeleteDialogOpen(false);
      router.replace(AUTH_REDIRECT_HREF);
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Не удалось удалить аккаунт."
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <ReviewScreen palette={palette}>
      <ReviewContentLayer>
        <ReviewScrollArea aria-label="Настройки" className="pb-10">
          <SettingsHeader brand={brand} onBack={handleBack} />

          <div className="space-y-8">
            <SettingsSection title="Аккаунт">
              <div
                className="overflow-hidden rounded-[22px] border border-transparent"
                style={getReviewChromeStyle(brand, "rgba(255,255,255,0.72)")}
              >
                <AccountItem
                  brand={brand}
                  description="Ваш email"
                  icon={UserRound}
                  title="Личные данные"
                  onClick={() => handlePlaceholderClick("Личные данные")}
                />
                <div className="mx-4 h-px bg-[#15291C]/7" />
                <AccountItem
                  brand={brand}
                  description="Пароль"
                  icon={LockKeyhole}
                  title="Безопасность"
                  onClick={() => handlePlaceholderClick("Безопасность")}
                />
              </div>
            </SettingsSection>

            {/* TODO: add the "Приложение" section after the MVP settings scope. */}

            <SettingsSection
              title="Выход и удаление"
              titleClassName="text-[#B42318]"
            >
              <div
                className="overflow-hidden rounded-[22px] border border-transparent"
                style={DANGER_CHROME_STYLE}
              >
                <DangerButton
                  disabled={isAnyActionPending}
                  icon={LogOut}
                  isPending={isLogoutPending}
                  title="Выйти из аккаунта"
                  onClick={() => {
                    setLogoutError(null);
                    setLogoutDialogOpen(true);
                  }}
                />
                <div className="mx-4 h-px bg-red-900/8" />
                <DangerButton
                  disabled={isAnyActionPending}
                  icon={Trash2}
                  isPending={isDeletePending}
                  title="Удалить аккаунт"
                  onClick={() => {
                    setDeleteError(null);
                    setDeleteDialogOpen(true);
                  }}
                />
              </div>
            </SettingsSection>

            {notice ? (
              <Alert className="rounded-[20px] border-transparent bg-white/62 px-4 py-3 text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.08)]">
                <AlertDescription className="font-[family-name:var(--font-roboto)] text-[13.5px] leading-snug font-semibold text-[#5C6B62]">
                  {notice}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </ReviewScrollArea>
      </ReviewContentLayer>

      <ConfirmationDialog
        actionLabel="Выйти"
        brand={brand}
        description="Вы сможете снова войти в аккаунт в любой момент."
        error={logoutError}
        loadingLabel="Выходим"
        open={logoutDialogOpen}
        pending={isLogoutPending}
        title="Выйти из аккаунта?"
        onConfirm={() => void handleLogout()}
        onOpenChange={setLogoutDialogOpen}
      />

      <ConfirmationDialog
        actionLabel="Удалить"
        brand={brand}
        description="Это действие нельзя отменить. Ваш профиль и данные будут удалены."
        error={deleteError}
        loadingLabel="Удаляем"
        open={deleteDialogOpen}
        pending={isDeletePending}
        title="Удалить аккаунт?"
        onConfirm={() => void handleDeleteAccount()}
        onOpenChange={setDeleteDialogOpen}
      />
    </ReviewScreen>
  );
}
