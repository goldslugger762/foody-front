import type { Post } from "@/lib/mock-data";
import type { PostComment } from "@/lib/mock-data";

export type FeedScope = "new" | "subs";

export type ApiErrorResponse = {
  code: string;
  error: string;
};

export type FeedResponse = {
  currentUser: string | null;
  followingUsers: string[];
  likedPostIds: number[];
  posts: Post[];
  savedPostIds: number[];
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

export type LikeListResponse = {
  currentUser: string | null;
  likedPostIds: number[];
};

export type LikeCheckResponse = LikeListResponse & {
  liked: boolean;
  postId: number;
};

export type LikeMutationResponse = LikeCheckResponse & {
  changed: boolean;
};

export type BookmarkListResponse = {
  currentUser: string | null;
  savedPostIds: number[];
};

export type BookmarkCheckResponse = BookmarkListResponse & {
  postId: number;
  saved: boolean;
};

export type BookmarkMutationResponse = BookmarkCheckResponse & {
  changed: boolean;
  savedPostsCount: number;
};

export type FavoritePostsResponse = {
  currentUser: string | null;
  followingUsers: string[];
  likedPostIds: number[];
  posts: Post[];
  recentFavoriteTags: string[];
  savedPostIds: number[];
  savedPostsCount: number;
};

export type CommentLikeListResponse = {
  currentUser: string | null;
  likedCommentIds: string[];
};

export type CommentLikeCheckResponse = CommentLikeListResponse & {
  commentId: string;
  liked: boolean;
};

export type CommentLikeMutationResponse = CommentLikeCheckResponse & {
  changed: boolean;
};

export type DeletedCommentsResponse = {
  currentUser: string | null;
  deletedCommentIds: string[];
};

export type DeleteCommentResponse = DeletedCommentsResponse & {
  changed: boolean;
  commentId: string;
};

export function isFeedScope(value: string | null): value is FeedScope {
  return value === "new" || value === "subs";
}

export function getFollowUserApiPath(user: string) {
  return `/api/follows/${encodeURIComponent(user)}`;
}

export function getLikePostApiPath(postId: number) {
  return `/api/likes/${postId}`;
}

export function getBookmarkPostApiPath(postId: number) {
  return `/api/bookmarks/${postId}`;
}

export function getCommentLikeApiPath(commentId: PostComment["id"]) {
  return `/api/comment-likes/${encodeURIComponent(String(commentId))}`;
}

export function getCommentApiPath(commentId: PostComment["id"]) {
  return `/api/comments/${encodeURIComponent(String(commentId))}`;
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

export function getNextPostIdMembership(
  postIds: number[],
  postId: number,
  included: boolean
) {
  const hasPostId = postIds.includes(postId);

  if (included) {
    return hasPostId ? postIds : [...postIds, postId];
  }

  return hasPostId ? postIds.filter((id) => id !== postId) : postIds;
}

export async function requestFeed(scope: FeedScope) {
  const response = await fetch(`/api/feed?scope=${scope}`, {
    cache: "no-store",
  });

  return readApiJson<FeedResponse>(response);
}

export async function getFavoritePosts(tagsLimit = 20) {
  const params = new URLSearchParams({
    tagsLimit: String(tagsLimit),
  });
  const response = await fetch(`/api/favorites?${params.toString()}`, {
    cache: "no-store",
  });

  return readApiJson<FavoritePostsResponse>(response);
}

export async function getFavoritePostsCount() {
  return (await getFavoritePosts()).savedPostsCount;
}

export async function getRecentFavoriteTags(limit = 20) {
  return (await getFavoritePosts(limit)).recentFavoriteTags;
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

export async function requestLikeMutation(postId: number, nextLiked: boolean) {
  const response = await fetch(getLikePostApiPath(postId), {
    method: nextLiked ? "POST" : "DELETE",
  });

  return readApiJson<LikeMutationResponse>(response);
}

export async function requestBookmarkMutation(
  postId: number,
  nextSaved: boolean
) {
  const response = await fetch(getBookmarkPostApiPath(postId), {
    method: nextSaved ? "POST" : "DELETE",
  });

  return readApiJson<BookmarkMutationResponse>(response);
}

export async function togglePostBookmark(postId: number, nextSaved: boolean) {
  return requestBookmarkMutation(postId, nextSaved);
}

export async function requestCommentLikes(commentIds: PostComment["id"][]) {
  const params = new URLSearchParams();

  for (const commentId of commentIds) {
    params.append("commentId", String(commentId));
  }

  const response = await fetch(`/api/comment-likes?${params.toString()}`, {
    cache: "no-store",
  });

  return readApiJson<CommentLikeListResponse>(response);
}

export async function requestDeletedComments(commentIds: PostComment["id"][]) {
  const params = new URLSearchParams();

  for (const commentId of commentIds) {
    params.append("commentId", String(commentId));
  }

  const response = await fetch(`/api/comments?${params.toString()}`, {
    cache: "no-store",
  });

  return readApiJson<DeletedCommentsResponse>(response);
}

export async function requestCommentLikeMutation(
  commentId: PostComment["id"],
  nextLiked: boolean
) {
  const response = await fetch(getCommentLikeApiPath(commentId), {
    method: nextLiked ? "POST" : "DELETE",
  });

  return readApiJson<CommentLikeMutationResponse>(response);
}

export async function requestCommentDeleteMutation(
  commentId: PostComment["id"]
) {
  const response = await fetch(getCommentApiPath(commentId), {
    method: "DELETE",
  });

  return readApiJson<DeleteCommentResponse>(response);
}
