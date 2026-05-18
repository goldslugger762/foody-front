import type { AuthActionResponse } from "@/lib/auth-api";

export async function DELETE() {
  // TODO: delete the current user's account through the backend.
  return Response.json({ ok: true } satisfies AuthActionResponse);
}
