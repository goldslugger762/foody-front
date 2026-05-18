import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import { getUserProfileSnapshot } from "@/lib/server/profile-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

export async function GET() {
  try {
    const snapshot = await getUserProfileSnapshot(CURRENT_USER.handle);

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
