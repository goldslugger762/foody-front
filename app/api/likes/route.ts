import type { NextRequest } from "next/server";

import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  getLikeCheck,
  getLikedPostIds,
  likePost,
  LikeValidationError,
  unlikePost,
} from "@/lib/server/like-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function mutationError(error: unknown) {
  if (error instanceof LikeValidationError) {
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
      code: "like_mutation_failed",
      error: "Не удалось обновить лайк.",
    },
    500
  );
}

function getPostIdFromBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const postId = (body as { postId?: unknown }).postId;

  return typeof postId === "number" ? postId : null;
}

async function parsePostId(request: NextRequest) {
  try {
    return getPostIdFromBody(await request.json());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");

  try {
    if (postId) {
      return Response.json(await getLikeCheck(Number(postId)));
    }

    return Response.json({
      currentUser: CURRENT_USER.handle,
      likedPostIds: await getLikedPostIds(),
    });
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(request: NextRequest) {
  const postId = await parsePostId(request);

  if (postId === null) {
    return jsonError(
      {
        code: "invalid_post_id",
        error: "Нужно выбрать пост для лайка.",
      },
      400
    );
  }

  try {
    const result = await likePost(postId);

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const postId = await parsePostId(request);

  if (postId === null) {
    return jsonError(
      {
        code: "invalid_post_id",
        error: "Нужно выбрать пост для лайка.",
      },
      400
    );
  }

  try {
    return Response.json(await unlikePost(postId));
  } catch (error) {
    return mutationError(error);
  }
}
