import type { NextRequest } from "next/server";

import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  CommentLikeValidationError,
  getCommentLikeCheck,
  getLikedCommentIds,
  likeComment,
  unlikeComment,
} from "@/lib/server/comment-like-store";

export const runtime = "nodejs";

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

function getCommentIdFromBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const commentId = (body as { commentId?: unknown }).commentId;

  return typeof commentId === "string" || typeof commentId === "number"
    ? String(commentId)
    : null;
}

async function parseCommentId(request: NextRequest) {
  try {
    return getCommentIdFromBody(await request.json());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const commentId = request.nextUrl.searchParams.get("commentId");
  const requestedCommentIds = request.nextUrl.searchParams
    .getAll("commentId")
    .map((id) => id.trim())
    .filter(Boolean);

  try {
    if (commentId && requestedCommentIds.length === 1) {
      return Response.json(await getCommentLikeCheck(commentId));
    }

    return Response.json({
      currentUser: CURRENT_USER.handle,
      likedCommentIds: await getLikedCommentIds(
        CURRENT_USER.handle,
        requestedCommentIds.length > 0 ? requestedCommentIds : undefined
      ),
    });
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(request: NextRequest) {
  const commentId = await parseCommentId(request);

  if (commentId === null) {
    return jsonError(
      {
        code: "invalid_comment_id",
        error: "Нужно выбрать комментарий для лайка.",
      },
      400
    );
  }

  try {
    const result = await likeComment(commentId);

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const commentId = await parseCommentId(request);

  if (commentId === null) {
    return jsonError(
      {
        code: "invalid_comment_id",
        error: "Нужно выбрать комментарий для лайка.",
      },
      400
    );
  }

  try {
    return Response.json(await unlikeComment(commentId));
  } catch (error) {
    return mutationError(error);
  }
}
