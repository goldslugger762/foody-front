import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import { getDeletedCommentsSnapshot } from "@/lib/server/comment-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

export async function GET(request: NextRequest) {
  const requestedCommentIds = request.nextUrl.searchParams
    .getAll("commentId")
    .filter((commentId) => commentId.trim().length > 0);

  try {
    return Response.json(
      await getDeletedCommentsSnapshot(
        requestedCommentIds.length > 0 ? requestedCommentIds : undefined
      )
    );
  } catch (error) {
    console.error(error);

    return jsonError(
      {
        code: "deleted_comments_load_failed",
        error: "Не удалось загрузить состояние комментариев.",
      },
      500
    );
  }
}
