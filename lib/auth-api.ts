import { readApiJson } from "@/lib/feed-api";

export type AuthActionResponse = {
  ok: true;
};

export const AUTH_REDIRECT_HREF = "/login";

const AUTH_STORAGE_KEYS = [
  "foody:auth-token",
  "foody:auth-user",
  "foody:session",
  "auth-token",
  "accessToken",
  "refreshToken",
] as const;

function clearLocalAuthState() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }

  window.dispatchEvent(new Event("foody:auth-state-cleared"));
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

export async function deleteAccount() {
  // TODO: connect this to the real account deletion endpoint.
  const response = await fetch("/api/account", {
    method: "DELETE",
  });

  const payload = await readApiJson<AuthActionResponse>(response);
  clearLocalAuthState();

  return payload;
}
