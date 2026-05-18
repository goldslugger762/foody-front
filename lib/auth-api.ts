import { readApiJson } from "@/lib/feed-api";
import { CURRENT_USER } from "@/lib/current-user";

export type AuthActionResponse = {
  ok: true;
};

export type AuthUser = {
  email: string;
  handle: string;
  realName: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type LoginUserInput = {
  email: string;
  password: string;
};

export type LoginUserResponse = AuthActionResponse & AuthSession;

export const AUTH_REDIRECT_HREF = "/login";
export const AUTH_SUCCESS_HREF = "/";

const AUTH_STATE_CHANGED_EVENT = "foody:auth-state-changed";

const AUTH_STORAGE_KEYS = [
  "foody:auth-token",
  "foody:auth-user",
  "foody:session",
  "auth-token",
  "accessToken",
  "refreshToken",
] as const;

function notifyAuthStateChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
}

function clearLocalAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }

  window.dispatchEvent(new Event("foody:auth-state-cleared"));
  notifyAuthStateChanged();
}

function saveLocalAuthSession(session: AuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("foody:auth-token", session.accessToken);
  window.localStorage.setItem("foody:auth-user", JSON.stringify(session.user));
  window.localStorage.setItem("foody:session", JSON.stringify(session));
  notifyAuthStateChanged();
}

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem("foody:session");

  if (rawSession) {
    try {
      const session = JSON.parse(rawSession) as Partial<AuthSession>;

      if (
        typeof session.accessToken === "string" &&
        session.accessToken.length > 0 &&
        session.user &&
        typeof session.user.email === "string" &&
        typeof session.user.handle === "string" &&
        typeof session.user.realName === "string"
      ) {
        return {
          accessToken: session.accessToken,
          user: session.user,
        };
      }
    } catch {
      clearLocalAuthState();
      return null;
    }
  }

  const accessToken = window.localStorage.getItem("foody:auth-token");
  const rawUser = window.localStorage.getItem("foody:auth-user");

  if (!accessToken || !rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser) as Partial<AuthUser>;

    if (
      typeof user.email !== "string" ||
      typeof user.handle !== "string" ||
      typeof user.realName !== "string"
    ) {
      clearLocalAuthState();
      return null;
    }

    return {
      accessToken,
      user: {
        email: user.email,
        handle: user.handle,
        realName: user.realName,
      },
    };
  } catch {
    clearLocalAuthState();
    return null;
  }
}

export function subscribeToAuthState(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", listener);
  window.addEventListener(AUTH_STATE_CHANGED_EVENT, listener);
  window.addEventListener("foody:auth-state-cleared", listener);

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(AUTH_STATE_CHANGED_EVENT, listener);
    window.removeEventListener("foody:auth-state-cleared", listener);
  };
}

export function getStoredAuthUser() {
  return readStoredSession()?.user ?? null;
}

export async function loginUser(credentials: LoginUserInput) {
  // TODO: replace this mock route with the production auth provider endpoint.
  const response = await fetch("/api/auth/login", {
    body: JSON.stringify(credentials),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  const payload = await readApiJson<LoginUserResponse>(response);
  saveLocalAuthSession({
    accessToken: payload.accessToken,
    user: payload.user,
  });

  return payload;
}

export async function getCurrentUser() {
  // TODO: when backend sessions are available, verify the stored token server-side.
  return getStoredAuthUser();
}

export async function logout() {
  // TODO: connect this to the real auth backend when sessions are added.
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  const payload = await readApiJson<AuthActionResponse>(response);
  clearLocalAuthState();

  return payload;
}

export function getMockAuthUser(email: string): AuthUser {
  return {
    email,
    handle: CURRENT_USER.handle,
    realName: CURRENT_USER.realName,
  };
}

export async function deleteAccount() {
  // TODO: connect this to the real account deletion endpoint.
  const response = await fetch("/api/account", {
    method: "DELETE",
  });

  const payload = await readApiJson<AuthActionResponse>(response);
  clearLocalAuthState();

  return payload;
}
