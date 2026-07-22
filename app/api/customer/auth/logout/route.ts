import { ok } from "@/lib/api-helpers/respond";
import { CUSTOMER_SESSION_COOKIE } from "@/lib/auth/customer-session";

export async function POST() {
  const response = ok({ loggedOut: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
