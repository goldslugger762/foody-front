import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import { getUserPostsSnapshot } from "@/lib/server/profile-store";

export const runtime = "nodejs";

type ProfilePostsRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

async function getRouteUserId({ params }: ProfilePostsRouteContext) {
  const { userId } = await params;

  try {
    return decodeURIComponent(userId);
  } catch {
    return userId;
  }
}

export async function GET(
  _request: NextRequest,
  context: ProfilePostsRouteContext
) {
  try {
    const snapshot = await getUserPostsSnapshot(await getRouteUserId(context));

    if (!snapshot) {
      return jsonError(
        {
          code: "profile_not_found",
          error: "Профиль не найден.",
        },
        404
      );
    }

    return Response.json(snapshot);
  } catch (error) {
    console.error(error);

    return jsonError(
      {
        code: "profile_posts_load_failed",
        error: "Не удалось загрузить посты профиля.",
      },
      500
    );
  }
}
