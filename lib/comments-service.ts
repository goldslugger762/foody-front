import {
  requestCommentDeleteMutation,
  type DeleteCommentResponse,
} from "@/lib/feed-api";
import type { Post, PostComment } from "@/lib/mock-data";

export type CreateCommentInput = {
  comment: PostComment;
  postId: Post["id"];
};

export type CreateCommentResponse = {
  changed: boolean;
  comment: PostComment;
  postId: Post["id"];
};

function isLocalCommentId(commentId: PostComment["id"]) {
  return String(commentId).startsWith("local-");
}

export async function deleteComment(
  commentId: PostComment["id"]
): Promise<DeleteCommentResponse> {
  if (isLocalCommentId(commentId)) {
    // TODO: replace this local mock branch when comment deletion has a backend.
    return {
      changed: true,
      commentId: String(commentId),
      currentUser: null,
      deletedCommentIds: [String(commentId)],
    };
  }

  return requestCommentDeleteMutation(commentId);
}

export async function createComment({
  comment,
  postId,
}: CreateCommentInput): Promise<CreateCommentResponse> {
  // TODO: replace this local mock branch when comment creation has a backend.
  return {
    changed: true,
    comment: {
      ...comment,
      status: "sent",
    },
    postId,
  };
}
