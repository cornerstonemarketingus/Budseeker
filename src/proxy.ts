import { NextResponse } from "next/server";
import { auth } from "@/server/auth/config";

const PROTECTED_PREFIXES = ["/saved", "/lists", "/alerts", "/notifications", "/profile", "/settings"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (needsAuth && !req.auth) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
