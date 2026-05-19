import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  getLikeCheck,
  likePost,
  LikeValidationError,
  unlikePost,
} from "@/lib/server/like-store";

export const runtime = "nodejs";

type LikeRouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

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

async function getTargetPostId({ params }: LikeRouteContext) {
  const { postId } = await params;

  return Number(postId);
}

export async function GET(_request: NextRequest, context: LikeRouteContext) {
  try {
    return Response.json(await getLikeCheck(await getTargetPostId(context)));
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(_request: NextRequest, context: LikeRouteContext) {
  try {
    const result = await likePost(await getTargetPostId(context));

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(_request: NextRequest, context: LikeRouteContext) {
  try {
    return Response.json(await unlikePost(await getTargetPostId(context)));
  } catch (error) {
    return mutationError(error);
  }
}
