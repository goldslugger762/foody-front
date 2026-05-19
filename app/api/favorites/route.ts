import type { NextRequest } from "next/server";

import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import { getFavoritePostsSnapshot } from "@/lib/server/bookmark-store";
import { getFollowedUsers } from "@/lib/server/follow-store";
import { getLikedPostIds } from "@/lib/server/like-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function parseTagsLimit(value: string | null) {
  const limit = Number(value ?? 20);

  if (!Number.isInteger(limit)) {
    return 20;
  }

  return Math.min(Math.max(limit, 0), 20);
}

export async function GET(request: NextRequest) {
  try {
    const tagsLimit = parseTagsLimit(
      request.nextUrl.searchParams.get("tagsLimit")
    );
    const [followingUsers, likedPostIds] = await Promise.all([
      getFollowedUsers(CURRENT_USER.handle),
      getLikedPostIds(CURRENT_USER.handle),
    ]);

    return Response.json(
      await getFavoritePostsSnapshot(CURRENT_USER.handle, tagsLimit, {
        followingUsers,
        likedPostIds,
      })
    );
  } catch (error) {
    console.error(error);

    return jsonError(
      {
        code: "favorites_load_failed",
        error: "Не удалось загрузить избранное.",
      },
      500
    );
  }
}
