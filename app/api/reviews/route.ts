import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  createReviewPost,
  getFeedPosts,
  getMyPosts,
  ReviewPostValidationError,
  type CreateReviewPostInput,
} from "@/lib/server/review-post-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function parseString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function parseStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function parseCreateReviewPayload(value: unknown): CreateReviewPostInput {
  if (!value || typeof value !== "object") {
    throw new ReviewPostValidationError(
      "invalid_payload",
      "Не удалось прочитать отзыв."
    );
  }

  const payload = value as Record<string, unknown>;

  return {
    address: parseString(payload.address),
    categoryLabel:
      typeof payload.categoryLabel === "string" ? payload.categoryLabel : null,
    clientId: typeof payload.clientId === "string" ? payload.clientId : null,
    dish: parseString(payload.dish),
    photoUrls: parseStringArray(payload.photoUrls),
    place: parseString(payload.place),
    price: parseString(payload.price),
    rating: typeof payload.rating === "number" ? payload.rating : 0,
    tags: parseStringArray(payload.tags),
    text: parseString(payload.text),
  };
}

export async function GET(request: Request) {
  const scope = new URL(request.url).searchParams.get("scope");

  try {
    if (scope === "feed") {
      return Response.json({
        posts: await getFeedPosts(),
      });
    }

    return Response.json({
      posts: await getMyPosts(),
    });
  } catch (error) {
    console.error(error);

    return jsonError(
      {
        code: "review_posts_load_failed",
        error: "Не удалось загрузить отзывы.",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const post = await createReviewPost(
      parseCreateReviewPayload(await request.json())
    );

    return Response.json({ post }, { status: 201 });
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
        code: "review_post_create_failed",
        error: "Не удалось отправить отзыв на модерацию.",
      },
      500
    );
  }
}
