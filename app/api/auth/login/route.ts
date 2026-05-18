import {
  getMockAuthUser,
  type LoginUserInput,
  type LoginUserResponse,
} from "@/lib/auth-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLoginUserInput(value: unknown): value is LoginUserInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<LoginUserInput>;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.password === "string"
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
        error: "Не удалось прочитать данные для входа.",
      },
      { status: 400 }
    );
  }

  if (!isLoginUserInput(payload)) {
    return Response.json(
      {
        code: "INVALID_CREDENTIALS",
        error: "Укажите почту и пароль.",
      },
      { status: 400 }
    );
  }

  const email = payload.email.trim().toLowerCase();
  const password = payload.password.trim();

  if (!EMAIL_PATTERN.test(email) || !password) {
    return Response.json(
      {
        code: "INVALID_CREDENTIALS",
        error: "Проверьте почту и пароль.",
      },
      { status: 400 }
    );
  }

  // TODO: replace this MVP mock with backend credential verification.
  if (email.startsWith("fail") || password === "wrong") {
    return Response.json(
      {
        code: "AUTH_FAILED",
        error: "Неверная почта или пароль.",
      },
      { status: 401 }
    );
  }

  return Response.json({
    accessToken: `mock-access-token:${email}`,
    ok: true,
    user: getMockAuthUser(email),
  } satisfies LoginUserResponse);
}
