"use client";

import { PartyPopper, Sparkles } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getReviewChromeStyle } from "@/components/review/review-screen-shell";

export function RegistrationSuccessAlert({
  brand,
  onClose,
  open,
}: {
  brand: string;
  onClose: () => void;
  open: boolean;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="rounded-[24px] border-0 bg-white/90 p-5 text-[#15291C] shadow-[0_22px_54px_rgba(20,40,28,0.34),0_8px_18px_rgba(20,40,28,0.12),inset_1px_1px_0_rgba(255,255,255,0.74)] ring-0 backdrop-blur-[22px]">
        <div
          aria-hidden="true"
          className="mb-1 flex items-center gap-2 text-[#1B7F45]"
        >
          <span className="grid size-10 place-items-center rounded-full bg-[#2ECC71]/14">
            <PartyPopper className="size-5" strokeWidth={2.25} />
          </span>
          <Sparkles className="size-5" strokeWidth={2.25} />
          <span className="text-[20px] leading-none">🥳</span>
        </div>
        <AlertDialogHeader className="place-items-start text-left">
          <AlertDialogTitle className="text-[20px] leading-tight font-semibold text-[#15291C]">
            Аккаунт создан 🎉
          </AlertDialogTitle>
          <AlertDialogDescription className="font-[family-name:var(--font-roboto)] text-[14px] leading-snug font-medium text-[#5C6B62]">
            Добро пожаловать в Foody! Теперь можно искать вкусные блюда и
            делиться своими находками ✨
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="-mx-5 -mb-5 flex-col gap-2 rounded-b-[24px] border-t border-white/58 bg-white/45 p-5 sm:flex-col">
          <AlertDialogAction
            onClick={onClose}
            className="h-10 w-full rounded-[18px] border border-transparent px-4 text-[14px] font-bold text-[#06301A] shadow-[0_8px_20px_rgba(20,40,28,0.08),inset_1px_1px_0_rgba(255,255,255,0.72),inset_-1px_-1px_0_rgba(255,255,255,0.28)] hover:bg-white focus-visible:ring-[#15291C]/12"
            style={getReviewChromeStyle(brand, "rgba(189,247,208,0.78)")}
          >
            Класс!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
