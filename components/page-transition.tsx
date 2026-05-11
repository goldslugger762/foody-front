"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";

const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/search": 1,
  "/saved": 3,
  "/me": 4,
};

const variants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : `${direction * 100}%`,
    opacity: direction === 0 ? 0 : 1,
  }),
  center: { x: "0%", opacity: 1 },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : `${direction * -100}%`,
    opacity: direction === 0 ? 0 : 1,
  }),
};

function getDirection(prev: string | null, current: string): number {
  if (prev === null || prev === current) return 0;
  const a = TAB_ORDER[prev];
  const b = TAB_ORDER[current];
  if (a === undefined || b === undefined) return 0;
  return Math.sign(b - a);
}

export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [tracked, setTracked] = useState<{
    current: string;
    prev: string | null;
  }>({ current: pathname, prev: null });

  if (tracked.current !== pathname) {
    setTracked({ current: pathname, prev: tracked.current });
  }

  const direction = getDirection(tracked.prev, tracked.current);

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="sync" initial={false} custom={direction}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.38, ease: [0.32, 0.72, 0, 1] }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
