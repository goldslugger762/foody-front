import * as React from "react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserProfileHref } from "@/lib/profile-data";
import { cn } from "@/lib/utils";

const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ["#FFD6A5", "#FF8FAB"],
  ["#A7C957", "#386641"],
  ["#FFC25C", "#E76F51"],
  ["#90DBF4", "#A78BFA"],
  ["#F2CC8F", "#81B29A"],
  ["#CDB4DB", "#FFAFCC"],
];

type UserAvatarProps = {
  name: string;
  size?: number;
  src?: string | null;
  className?: string;
};

type UserAvatarProfileLinkProps = UserAvatarProps & {
  ariaLabel?: string;
  href?: string;
  linkClassName?: string;
};

export function UserAvatar({
  name,
  size = 36,
  src,
  className,
}: UserAvatarProps) {
  const seed = name.charCodeAt(1) || 7;
  const [from, to] = PALETTES[seed % PALETTES.length];
  const initial = (name || "?").replace("@", "").slice(0, 1).toUpperCase();

  return (
    <Avatar
      className={cn(
        "shrink-0 shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.55)] after:hidden",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? <AvatarImage src={src} alt="" /> : null}
      <AvatarFallback
        className="font-extrabold tracking-tight text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, ${from}, ${to})`,
          fontSize: size * 0.42,
        }}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}

export function UserAvatarProfileLink({
  ariaLabel,
  className,
  href,
  linkClassName,
  name,
  size = 36,
  src,
}: UserAvatarProfileLinkProps) {
  return (
    <Link
      href={href ?? getUserProfileHref(name)}
      aria-label={ariaLabel ?? `Открыть профиль ${name}`}
      title={name}
      className={cn(
        "grid shrink-0 cursor-pointer place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#15291C]/18",
        linkClassName
      )}
    >
      <UserAvatar className={className} name={name} size={size} src={src} />
    </Link>
  );
}
