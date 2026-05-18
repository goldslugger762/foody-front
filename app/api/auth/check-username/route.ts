import { normalizeUsername, type AvailabilityResponse } from "@/lib/auth-api";

const USERNAME_PATTERN = /^[\p{L}\d_]+$/u;
const RESERVED_USERNAMES = new Set(["admin", "foody", "you"]);

function isUsernamePayload(value: unknown): value is { username: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Partial<{ username: string }>).username === "string"
  );
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        code: "INVALID_JSON",
        error: "Не удалось прочитать имя пользователя.",
        field: "username",
      },
      { status: 400 }
    );
  }

  if (!isUsernamePayload(payload)) {
    return Response.json(
      {
        code: "INVALID_USERNAME",
        error: "Введите имя пользователя",
        field: "username",
      },
      { status: 400 }
    );
  }

  const username = normalizeUsername(payload.username).toLowerCase();

  if (!username) {
    return Response.json(
      {
        code: "INVALID_USERNAME",
        error: "Введите имя пользователя",
        field: "username",
      },
      { status: 400 }
    );
  }

  if (username.length > 12) {
    return Response.json(
      {
        code: "USERNAME_TOO_LONG",
        error: "Имя пользователя может быть максимум 12 символов",
        field: "username",
      },
      { status: 400 }
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return Response.json(
      {
        code: "INVALID_USERNAME_CHARS",
        error: "Имя пользователя может содержать только буквы, цифры и _",
        field: "username",
      },
      { status: 400 }
    );
  }

  // TODO: replace this mock reservation check with the production backend lookup.
  if (RESERVED_USERNAMES.has(username) || username.startsWith("taken")) {
    return Response.json(
      {
        code: "USERNAME_TAKEN",
        error: "Это имя пользователя уже занято",
        field: "username",
      },
      { status: 409 }
    );
  }

  return Response.json({
    available: true,
    ok: true,
  } satisfies AvailabilityResponse);
}
