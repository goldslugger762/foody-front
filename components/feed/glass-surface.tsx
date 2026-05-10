import * as React from "react";

import { cn } from "@/lib/utils";

type GlassSurfaceProps = React.ComponentProps<"div"> & {
  highlight?: boolean;
};

export function GlassSurface({
  className,
  highlight = true,
  children,
  ...props
}: GlassSurfaceProps) {
  return (
    <div
      data-slot="glass-surface"
      className={cn(
        "relative overflow-hidden rounded-[22px]",
        "before:absolute before:inset-0 before:rounded-[inherit]",
        "before:bg-white/60 before:backdrop-blur-[22px] before:backdrop-saturate-[180%]",
        highlight &&
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-[0.5px] after:border-white/60 after:shadow-[inset_1px_1px_0_rgba(255,255,255,0.85),inset_-1px_-1px_0_rgba(255,255,255,0.35)]",
        className
      )}
      {...props}
    >
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
