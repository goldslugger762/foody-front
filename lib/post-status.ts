import type { Post } from "@/lib/mock-data";

export function isPostPendingModeration(post: Post) {
  return post.status === "pending_moderation";
}

export function isPostRejected(post: Post) {
  return post.status === "rejected";
}
