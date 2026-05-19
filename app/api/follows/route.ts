import type { NextRequest } from "next/server";

import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  followUser,
  FollowValidationError,
  getFollowCheck,
  getFollowedUsers,
  unfollowUser,
} from "@/lib/server/follow-store";

export const runtime = "nodejs";

function jsonError(error: ApiErrorResponse, status: number) {
  return Response.json(error, { status });
}

function mutationError(error: unknown) {
  if (error instanceof FollowValidationError) {
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
      code: "follow_mutation_failed",
      error: "Не удалось обновить подписку.",
    },
    500
  );
}

function getTargetUserFromBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const targetUser = (body as { targetUser?: unknown }).targetUser;

  return typeof targetUser === "string" ? targetUser : null;
}

async function parseTargetUser(request: NextRequest) {
  try {
    return getTargetUserFromBody(await request.json());
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const targetUser = request.nextUrl.searchParams.get("targetUser");

  try {
    if (targetUser) {
      return Response.json(await getFollowCheck(targetUser));
    }

    return Response.json({
      currentUser: CURRENT_USER.handle,
      followingUsers: await getFollowedUsers(),
    });
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(request: NextRequest) {
  const targetUser = await parseTargetUser(request);

  if (!targetUser) {
    return jsonError(
      {
        code: "invalid_target_user",
        error: "Нужно выбрать пользователя для подписки.",
      },
      400
    );
  }

  try {
    const result = await followUser(targetUser);

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(request: NextRequest) {
  const targetUser = await parseTargetUser(request);

  if (!targetUser) {
    return jsonError(
      {
        code: "invalid_target_user",
        error: "Нужно выбрать пользователя для подписки.",
      },
      400
    );
  }

  try {
    return Response.json(await unfollowUser(targetUser));
  } catch (error) {
    return mutationError(error);
  }
}
