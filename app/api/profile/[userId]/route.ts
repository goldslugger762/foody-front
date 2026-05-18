import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import { getUserProfileSnapshot } from "@/lib/server/profile-store";

export const runtime = "nodejs";

type ProfileRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

async function getRouteUserId({ params }: ProfileRouteContext) {
  const { userId } = await params;

  try {
    return decodeURIComponent(userId);
  } catch {
    return userId;
  }
}

export async function GET(
  _request: NextRequest,
  context: ProfileRouteContext
) {
  try {
    const snapshot = await getUserProfileSnapshot(await getRouteUserId(context));

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
        code: "profile_load_failed",
        error: "Не удалось загрузить профиль.",
      },
      500
    );
  }
}
