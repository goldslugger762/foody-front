import type { Post } from "@/lib/mock-data";

export type FeedScope = "new" | "subs";

export type ApiErrorResponse = {
  code: string;
  error: string;
};

export type FeedResponse = {
  currentUser: string | null;
  followingUsers: string[];
  posts: Post[];
  scope: FeedScope;
};

export type FollowListResponse = {
  currentUser: string | null;
  followingUsers: string[];
};

export type FollowCheckResponse = FollowListResponse & {
  following: boolean;
  targetUser: string;
};

export type FollowMutationResponse = FollowCheckResponse & {
  changed: boolean;
};

export function isFeedScope(value: string | null): value is FeedScope {
  return value === "new" || value === "subs";
}

export function getFollowUserApiPath(user: string) {
  return `/api/follows/${encodeURIComponent(user)}`;
}

export async function readApiJson<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  try {
    const payload = (await response.json()) as Partial<ApiErrorResponse>;

    if (typeof payload.error === "string" && payload.error.length > 0) {
      throw new Error(payload.error);
    }
  } catch (error) {
    if (error instanceof Error && error.message.length > 0) {
      throw error;
    }
  }

  throw new Error("Не удалось выполнить запрос.");
}

export async function requestFeed(scope: FeedScope) {
  const response = await fetch(`/api/feed?scope=${scope}`, {
    cache: "no-store",
  });

  return readApiJson<FeedResponse>(response);
}

export async function requestFollowMutation(
  targetUser: string,
  nextFollowing: boolean
) {
  const response = await fetch(getFollowUserApiPath(targetUser), {
    method: nextFollowing ? "POST" : "DELETE",
  });

  return readApiJson<FollowMutationResponse>(response);
}
