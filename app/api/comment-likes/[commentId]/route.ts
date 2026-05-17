import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  CommentLikeValidationError,
  getCommentLikeCheck,
  likeComment,
  unlikeComment,
} from "@/lib/server/comment-like-store";

export const runtime = "nodejs";

type CommentLikeRouteContext = {
  params: Promise<{
    commentId: string;
  }>;
};

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function mutationError(error: unknown) {
  if (error instanceof CommentLikeValidationError) {
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
      code: "comment_like_mutation_failed",
      error: "Не удалось обновить лайк комментария.",
    },
    500
  );
}

async function getTargetCommentId({ params }: CommentLikeRouteContext) {
  const { commentId } = await params;

  try {
    return decodeURIComponent(commentId);
  } catch {
    return commentId;
  }
}

export async function GET(
  _request: NextRequest,
  context: CommentLikeRouteContext
) {
  try {
    return Response.json(
      await getCommentLikeCheck(await getTargetCommentId(context))
    );
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(
  _request: NextRequest,
  context: CommentLikeRouteContext
) {
  try {
    const result = await likeComment(await getTargetCommentId(context));

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: CommentLikeRouteContext
) {
  try {
    return Response.json(await unlikeComment(await getTargetCommentId(context)));
  } catch (error) {
    return mutationError(error);
  }
}
