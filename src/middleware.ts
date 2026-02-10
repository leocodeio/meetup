import { NextRequest, NextResponse } from "next/server";
import { auth } from "./server/services/auth/db.server";
import { routing } from "./i18n/routing";
import createMiddleware from "next-intl/middleware";

export const config = {
  runtime: "nodejs",
  matcher: ["/", "/(en|es|fr)/:path*"],
};

export default async function middleware(request: NextRequest) {
  // Create i18n middleware dynamically (inside function)
  const intlMiddleware = createMiddleware(routing);
  const i18nResponse = intlMiddleware(request);

  const lang =
    i18nResponse.headers.get("x-middleware-request-x-next-intl-locale") ||
    routing.defaultLocale;

  const url = new URL(request.url);
  const pathname = url.pathname;

  const isDashboard = pathname.startsWith(`/${lang}/dashboard`);
  const isPublic =
    pathname === "/" ||
    pathname === `/${lang}` ||
    pathname === `/${lang}/auth` ||
    pathname === `/${lang}/auth/login` ||
    pathname === `/${lang}/auth/signup`;

  const session = await auth.api.getSession({ headers: request.headers });

  if (session && isPublic) {
    return NextResponse.redirect(new URL(`/${lang}/dashboard`, request.url));
  }

  if (!session && isDashboard) {
    return NextResponse.redirect(new URL(`/${lang}/login`, request.url));
  }

  return i18nResponse ?? NextResponse.next();
}
