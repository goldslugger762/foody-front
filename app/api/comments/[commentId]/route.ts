import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  CommentValidationError,
  deleteCommentById,
} from "@/lib/server/comment-store";

export const runtime = "nodejs";

type CommentRouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function mutationError(error: unknown) {
  if (error instanceof CommentValidationError) {
    return jsonError(
      {
        code: error.code,
        error: error.message,
      },
      error.status
    );
  }

  console.error(error);

  return jsonError(
    {
      code: "comment_delete_failed",
      error: "Не удалось удалить комментарий.",
    },
    500
  );
}

async function getTargetCommentId({ params }: CommentRouteContext) {
  const { commentId } = await params;

  try {
    return decodeURIComponent(commentId);
  } catch {
    return commentId;
  }
}

export async function DELETE(
  _request: NextRequest,
  context: CommentRouteContext
) {
  try {
    return Response.json(await deleteCommentById(await getTargetCommentId(context)));
  } catch (error) {
    return mutationError(error);
  }
}
