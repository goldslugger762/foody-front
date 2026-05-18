import { CURRENT_USER } from "@/lib/current-user";
import type { ApiErrorResponse } from "@/lib/feed-api";
import {
  getUserProfileSnapshot,
  ProfileValidationError,
  updateCurrentUserProfile,
  type ProfileUpdateInput,
} from "@/lib/server/profile-store";

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

function parseNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  return typeof value === "string" ? value : null;
}

function parseProfileUpdatePayload(value: unknown): ProfileUpdateInput {
  if (!value || typeof value !== "object") {
    throw new ProfileValidationError(
      "invalid_payload",
      "Не удалось прочитать данные профиля."
    );
  }

  const payload = value as Record<string, unknown>;

  if (
    typeof payload.displayName !== "string" ||
    typeof payload.username !== "string"
  ) {
    throw new ProfileValidationError(
      "invalid_payload",
      "Заполните имя и никнейм."
    );
  }

  return {
    about: parseNullableString(payload.about),
    avatarUrl:
      payload.avatarUrl === undefined
        ? undefined
        : parseNullableString(payload.avatarUrl),
    city: parseNullableString(payload.city),
    displayName: payload.displayName,
    username: payload.username,
  };
}

export async function PATCH(request: Request) {
  try {
    const payload = parseProfileUpdatePayload(await request.json());
    const snapshot = await updateCurrentUserProfile(payload);

    return Response.json(snapshot);
  } catch (error) {
    if (error instanceof ProfileValidationError) {
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
        code: "profile_update_failed",
        error: "Не удалось сохранить профиль.",
      },
      500
    );
  }
}
