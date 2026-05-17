import type { NextRequest } from "next/server";

import { type ApiErrorResponse, isFeedScope } from "@/lib/feed-api";
import { getFeedSnapshot } from "@/lib/server/follow-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

export async function GET(request: NextRequest) {
  const scopeParam = request.nextUrl.searchParams.get("scope");

  if (scopeParam !== null && !isFeedScope(scopeParam)) {
    return jsonError(
      {
        code: "invalid_feed_scope",
        error: "Неизвестный режим ленты.",
      },
      400
    );
  }

  try {
    return Response.json(await getFeedSnapshot(scopeParam ?? "new"));
  } catch (error) {
    console.error(error);

    return jsonError(
      {
        code: "feed_load_failed",
        error: "Не удалось загрузить ленту.",
      },
      500
    );
  }
}
