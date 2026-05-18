import {
  getMockRegisteredAuthUser,
  normalizeUsername,
  type RegisterUserInput,
  type RegisterUserResponse,
} from "@/lib/auth-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^[\p{L}\d]+$/u;
const USERNAME_PATTERN = /^[\p{L}\d_]+$/u;
const RESERVED_EMAILS = new Set(["taken@example.com", "busy@mail.com"]);
const RESERVED_USERNAMES = new Set(["admin", "foody", "you"]);

function isRegisterUserInput(value: unknown): value is RegisterUserInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<RegisterUserInput>;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.password === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.username === "string"
  );
}

function validationError(error: string, field: keyof RegisterUserInput) {
  return Response.json(
    {
      code: "INVALID_REGISTRATION_FIELD",
      error,
      field,
    },
    { status: 400 }
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
        error: "Не удалось прочитать данные регистрации.",
        field: "form",
      },
      { status: 400 }
    );
  }

  if (!isRegisterUserInput(payload)) {
    return Response.json(
      {
        code: "INVALID_REGISTRATION_DATA",
        error: "Заполните данные для регистрации.",
        field: "form",
      },
      { status: 400 }
    );
  }

  const email = payload.email.trim().toLowerCase();
  const name = payload.name.trim();
  const username = normalizeUsername(payload.username).toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return validationError("Введите корректную электронную почту", "email");
  }

  if (payload.password.length < 8) {
    return validationError("Пароль должен быть минимум 8 символов", "password");
  }

  if (!PASSWORD_PATTERN.test(payload.password)) {
    return validationError(
      "Пароль не должен содержать специальные символы",
      "password"
    );
  }

  if (!name) {
    return validationError("Введите имя", "name");
  }

  if (name.length > 12) {
    return validationError("Имя может быть максимум 12 символов", "name");
  }

  if (!username) {
    return validationError("Введите имя пользователя", "username");
  }

  if (username.length > 12) {
    return validationError(
      "Имя пользователя может быть максимум 12 символов",
      "username"
    );
  }

  if (!USERNAME_PATTERN.test(username)) {
    return validationError(
      "Имя пользователя может содержать только буквы, цифры и _",
      "username"
    );
  }

  // TODO: replace mock conflict checks with production backend uniqueness checks.
  if (RESERVED_EMAILS.has(email) || email.startsWith("taken")) {
    return Response.json(
      {
        code: "EMAIL_TAKEN",
        error: "Эта электронная почта уже занята",
        field: "email",
      },
      { status: 409 }
    );
  }

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
    accessToken: `mock-access-token:${email}`,
    ok: true,
    user: getMockRegisteredAuthUser({
      email,
      name,
      username,
    }),
  } satisfies RegisterUserResponse);
}
