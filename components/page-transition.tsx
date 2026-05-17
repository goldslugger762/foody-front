"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "motion/react";

const TAB_ORDER: Record<string, number> = {
  "/": 0,
  "/search": 1,
  "/search/results": 2,
  "/saved": 3,
  "/me": 4,
};

function getDirection(prev: string | null, current: string): number {
  if (prev === null || prev === current) return 0;
  const a = TAB_ORDER[prev];
  const b = TAB_ORDER[current];
  if (a === undefined || b === undefined) return 0;
  return Math.sign(b - a);
}

const exitVariants: Variants = {
  exit: (d: number) => ({
    x: d === 0 ? 0 : `${d * -100}%`,
    opacity: 1,
  }),
};

type Snap = {
  pathname: string;
  children: React.ReactNode;
  direction: number;
};

function isPathnameSettling(pathname: string) {
  return (
    typeof window !== "undefined" &&
    window.location.pathname !== pathname
  );
}

export function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [snap, setSnap] = useState<Snap>({
    pathname,
    children,
    direction: 0,
  });

  if (snap.pathname !== pathname) {
    setSnap({
      pathname,
      children,
      direction: getDirection(snap.pathname, pathname),
    });
  } else if (snap.children !== children && !isPathnameSettling(pathname)) {
    setSnap({
      pathname,
      children,
      direction: 0,
    });
  }

  const initialX =
    snap.direction === 0 ? 0 : `${snap.direction * 100}%`;
  const initialOpacity = 1;

  return (
    <div className="relative h-screen overflow-hidden">
      <AnimatePresence mode="sync" custom={snap.direction}>
        <motion.div
          key={snap.pathname}
          custom={snap.direction}
          variants={exitVariants}
          initial={{ x: initialX, opacity: initialOpacity }}
          animate={{ x: 0, opacity: 1 }}
          exit="exit"
          transition={{
            duration: snap.direction === 0 ? 0 : 0.32,
            ease: [0.32, 0.72, 0, 1],
          }}
          className="absolute inset-0"
          style={{ willChange: "transform" }}
        >
          {snap.children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
