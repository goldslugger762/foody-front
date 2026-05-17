import type { NextRequest } from "next/server";

import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  followUser,
  FollowValidationError,
  getFollowCheck,
  unfollowUser,
} from "@/lib/server/follow-store";

export const runtime = "nodejs";

type FollowRouteContext = {
  params: Promise<{
    user: string;
  }>;
};

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

async function getTargetUser({ params }: FollowRouteContext) {
  const { user } = await params;

  try {
    return decodeURIComponent(user);
  } catch {
    return user;
  }
}

export async function GET(_request: NextRequest, context: FollowRouteContext) {
  try {
    return Response.json(await getFollowCheck(await getTargetUser(context)));
  } catch (error) {
    return mutationError(error);
  }
}

export async function POST(_request: NextRequest, context: FollowRouteContext) {
  try {
    const result = await followUser(await getTargetUser(context));

    return Response.json(result, { status: result.changed ? 201 : 200 });
  } catch (error) {
    return mutationError(error);
  }
}

export async function DELETE(_request: NextRequest, context: FollowRouteContext) {
  try {
    return Response.json(await unfollowUser(await getTargetUser(context)));
  } catch (error) {
    return mutationError(error);
  }
}
