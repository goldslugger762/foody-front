"use client";

import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const COPY_LINK_ALERT_DURATION_MS = 1800;

type CopyLinkAlertProps = {
  showKey: number;
  className?: string;
};

export function CopyLinkAlert({ showKey, className }: CopyLinkAlertProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (showKey <= 0) {
      return;
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, COPY_LINK_ALERT_DURATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [showKey]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className={cn(
            "pointer-events-none fixed right-4 bottom-[6.25rem] left-4 z-[100]",
            className
          )}
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Alert className="mx-auto max-w-[23rem] rounded-[18px] border border-white/70 bg-white/86 px-4 py-3 text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
            <CheckCircle2
              className="size-4.5 text-[#1B7F45]"
              strokeWidth={2.35}
            />
            <p className="text-[13px] leading-tight font-extrabold tracking-[0px]">
              Ссылка скопирована успешно
            </p>
          </Alert>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
