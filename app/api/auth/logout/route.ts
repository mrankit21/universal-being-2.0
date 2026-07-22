import { ok } from "@/lib/api-helpers/respond";
import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(SESSION_COOKIE.name, "", { path: "/", maxAge: 0 });
  return response;
}
