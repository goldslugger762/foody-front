import type { NextRequest } from "next/server";

import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  BookmarkValidationError,
  getBookmarkCheck,
  getSavedPostIds,
  savePost,
  unsavePost,
} from "@/lib/server/bookmark-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function mutationError(error: unknown) {
  if (error instanceof BookmarkValidationError) {
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
      code: "bookmark_mutation_failed",
      error: "Не удалось обновить сохранение.",
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
      return Response.json(await getBookmarkCheck(Number(postId)));
    }

    return Response.json({
      currentUser: CURRENT_USER.handle,
      savedPostIds: await getSavedPostIds(),
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
        error: "Нужно выбрать пост для сохранения.",
      },
      400
    );
  }

  try {
    const result = await savePost(postId);

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
        error: "Нужно выбрать пост для сохранения.",
      },
      400
    );
  }

  try {
    return Response.json(await unsavePost(postId));
  } catch (error) {
    return mutationError(error);
  }
}
