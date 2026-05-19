import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  BookmarkValidationError,
  getBookmarkCheck,
  savePost,
  unsavePost,
} from "@/lib/server/bookmark-store";

export const runtime = "nodejs";

type BookmarkRouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

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

async function getTargetPostId({ params }: BookmarkRouteContext) {
  const { postId } = await params;

  return Number(postId);
}

export async function GET(_request: NextRequest, context: BookmarkRouteContext) {
  try {
    return Response.json(await getBookmarkCheck(await getTargetPostId(context)));
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(_request: NextRequest, context: BookmarkRouteContext) {
  try {
    const result = await savePost(await getTargetPostId(context));

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: BookmarkRouteContext
) {
  try {
    return Response.json(await unsavePost(await getTargetPostId(context)));
  } catch (error) {
    return mutationError(error);
  }
}
