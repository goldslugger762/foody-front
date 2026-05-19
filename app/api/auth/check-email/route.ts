import type { AvailabilityResponse } from "@/lib/auth-api";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESERVED_EMAILS = new Set(["taken@example.com", "busy@mail.com"]);

function isEmailPayload(value: unknown): value is { email: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as Partial<{ email: string }>).email === "string"
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
        error: "Не удалось прочитать электронную почту.",
        field: "email",
      },
      { status: 400 }
    );
  }

  if (!isEmailPayload(payload)) {
    return Response.json(
      {
        code: "INVALID_EMAIL",
        error: "Введите корректную электронную почту",
        field: "email",
      },
      { status: 400 }
    );
  }

  const email = payload.email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json(
      {
        code: "INVALID_EMAIL",
        error: "Введите корректную электронную почту",
        field: "email",
      },
      { status: 400 }
    );
  }

  // TODO: replace this mock reservation check with the production backend lookup.
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

  return Response.json({
    available: true,
    ok: true,
  } satisfies AvailabilityResponse);
}
