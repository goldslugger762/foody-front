import type { ApiErrorResponse } from "@/lib/feed-api";
import type { PostStatus } from "@/lib/mock-data";
import {
  moderatePost,
  ReviewPostValidationError,
} from "@/lib/server/review-post-store";

export const runtime = "nodejs";

type ReviewModerationRouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function isPostStatus(value: unknown): value is PostStatus {
  return (
    value === "pending_moderation" ||
    value === "approved" ||
    value === "rejected"
  );
}

async function getRoutePostId({ params }: ReviewModerationRouteContext) {
  const { postId } = await params;
  const parsedPostId = Number(postId);

  if (!Number.isInteger(parsedPostId)) {
    throw new ReviewPostValidationError(
      "invalid_post_id",
      "Нужно выбрать пост для модерации."
    );
  }

  return parsedPostId;
}

export async function PATCH(
  request: Request,
  context: ReviewModerationRouteContext
) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;

    if (!isPostStatus(payload.status)) {
      throw new ReviewPostValidationError(
        "invalid_status",
        "Неизвестный статус модерации."
      );
    }

    const post = await moderatePost(await getRoutePostId(context), payload.status);

    return Response.json({ post });
  } catch (error) {
    if (error instanceof ReviewPostValidationError) {
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
        code: "review_post_moderation_failed",
        error: "Не удалось обновить статус поста.",
      },
      500
    );
  }
}
