import type { AuthActionResponse } from "@/lib/auth-api";

export async function POST() {
  // TODO: invalidate the server session through the auth provider/backend.
  return Response.json({ ok: true } satisfies AuthActionResponse);
}
