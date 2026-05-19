import {
  requestCommentDeleteMutation,
  type DeleteCommentResponse,
} from "@/lib/feed-api";
import type { PostComment } from "@/lib/mock-data";

function isLocalCommentId(commentId: PostComment["id"]) {
  return String(commentId).startsWith("local-");
}

export async function deleteComment(
  commentId: PostComment["id"]
): Promise<DeleteCommentResponse> {
  if (isLocalCommentId(commentId)) {
    // TODO: replace this local mock branch when comment creation has a backend.
    return {
      changed: true,
      commentId: String(commentId),
      currentUser: null,
      deletedCommentIds: [String(commentId)],
    };
  }

  return requestCommentDeleteMutation(commentId);
}
