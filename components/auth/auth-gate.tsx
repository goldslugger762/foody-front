"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  AUTH_REDIRECT_HREF,
  getCurrentUser,
  subscribeToAuthState,
} from "@/lib/auth-api";

const PUBLIC_AUTH_PATHS = [AUTH_REDIRECT_HREF, "/register"] as const;

function isPublicPath(pathname: string) {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function syncAuthState() {
      const user = await getCurrentUser();

      if (!isActive) {
        return;
      }

      setIsAuthenticated(!!user);
      setAuthChecked(true);
    }

    void syncAuthState();

    const unsubscribe = subscribeToAuthState(() => {
      void syncAuthState();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authChecked || isAuthenticated || isPublicPath(pathname)) {
      return;
    }

    router.replace(AUTH_REDIRECT_HREF);
  }, [authChecked, isAuthenticated, pathname, router]);

  if (!authChecked && !isPublicPath(pathname)) {
    return null;
  }

  if (!isAuthenticated && !isPublicPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
