import { readApiJson } from "@/lib/feed-api";
import { CURRENT_USER } from "@/lib/current-user";
import type { Post, PostStatus } from "@/lib/mock-data";

export const REVIEW_POSTS_CHANGED_EVENT = "foody:review-posts-changed";
export const REVIEW_SUBMIT_ERROR_EVENT = "foody:review-submit-error";

const OPTIMISTIC_REVIEW_POSTS_STORAGE_KEY = "foody:optimistic-review-posts";
const REVIEW_SUBMIT_ERROR_STORAGE_KEY = "foody:review-submit-error";

export type CreateReviewPostData = {
  address: string;
  categoryLabel?: string | null;
  clientId?: string | null;
  dish: string;
  photoUrls: string[];
  place: string;
  price: string;
  rating: number;
  tags: string[];
  text: string;
};

export type CreateReviewPostResponse = {
  post: Post;
};

export type ReviewPostsResponse = {
  posts: Post[];
};

export type ModeratePostResponse = {
  post: Post;
};

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function dispatchReviewPostsChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(REVIEW_POSTS_CHANGED_EVENT));
}

function readStoredOptimisticPosts() {
  if (!canUseSessionStorage()) {
    return [];
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      OPTIMISTIC_REVIEW_POSTS_STORAGE_KEY
    );

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter((post): post is Post => {
      return (
        post &&
        typeof post === "object" &&
        typeof post.id === "number" &&
        typeof post.user === "string" &&
        typeof post.dish === "string"
      );
    });
  } catch {
    return [];
  }
}

function writeStoredOptimisticPosts(posts: Post[]) {
  if (!canUseSessionStorage()) {
    return;
  }

  if (posts.length === 0) {
    window.sessionStorage.removeItem(OPTIMISTIC_REVIEW_POSTS_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    OPTIMISTIC_REVIEW_POSTS_STORAGE_KEY,
    JSON.stringify(posts)
  );
}

export function getOptimisticReviewPosts() {
  return readStoredOptimisticPosts();
}

export function addOptimisticReviewPost(post: Post) {
  const nextPosts = [
    post,
    ...readStoredOptimisticPosts().filter(
      (storedPost) => storedPost.clientId !== post.clientId
    ),
  ];

  writeStoredOptimisticPosts(nextPosts);
  dispatchReviewPostsChanged();
}

export function removeOptimisticReviewPost(clientId: string) {
  const nextPosts = readStoredOptimisticPosts().filter(
    (post) => post.clientId !== clientId
  );

  writeStoredOptimisticPosts(nextPosts);
  dispatchReviewPostsChanged();
}

export function createOptimisticReviewPost(
  data: CreateReviewPostData,
  clientId: string
): Post {
  return {
    clientId,
    comments: 0,
    dish: data.dish.trim(),
    id: -Date.now(),
    likes: 0,
    photos: data.photoUrls.length,
    photoUrls: data.photoUrls,
    place: `${data.place.trim()} · ${data.address.trim()}`,
    price: data.price.trim().startsWith("₽")
      ? data.price.trim()
      : `₽${data.price.trim()}`,
    rating: Math.round(data.rating * 10) / 10,
    realName: CURRENT_USER.realName,
    seed: Date.now() % 997,
    status: "pending_moderation",
    tags: data.tags.map((tag) => `#${tag.trim().replace(/^#+/, "")}`),
    text: data.text.trim(),
    user: CURRENT_USER.handle,
    when: "только что",
  };
}

export function storeReviewSubmitError(message: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(REVIEW_SUBMIT_ERROR_STORAGE_KEY, message);
  window.dispatchEvent(new Event(REVIEW_SUBMIT_ERROR_EVENT));
}

export function consumeReviewSubmitError() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const message = window.sessionStorage.getItem(REVIEW_SUBMIT_ERROR_STORAGE_KEY);

  if (message) {
    window.sessionStorage.removeItem(REVIEW_SUBMIT_ERROR_STORAGE_KEY);
  }

  return message;
}

export async function createReviewPost(data: CreateReviewPostData) {
  const response = await fetch("/api/reviews", {
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readApiJson<CreateReviewPostResponse>(response);
}

export async function getMyPosts() {
  const response = await fetch("/api/reviews", {
    cache: "no-store",
  });

  return readApiJson<ReviewPostsResponse>(response);
}

export async function getFeedPosts() {
  const response = await fetch("/api/reviews?scope=feed", {
    cache: "no-store",
  });

  return readApiJson<ReviewPostsResponse>(response);
}

export async function moderatePost(postId: Post["id"], status: PostStatus) {
  const response = await fetch(`/api/reviews/${postId}/moderation`, {
    body: JSON.stringify({ status }),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const result = await readApiJson<ModeratePostResponse>(response);

  dispatchReviewPostsChanged();

  return result;
}
