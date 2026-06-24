import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 보호된 경로들
const protectedRoutes = ["/dashboard"];
const authRoutes = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일들은 미들웨어에서 제외
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // .js, .css, .png 등
  ) {
    return NextResponse.next();
  }

  // 🍪 단순히 토큰 존재 여부만 확인
  const token = request.cookies.get("adminToken")?.value;
  const hasToken = !!token;

  // 개발 환경에서 토큰 상태 로깅
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] Token check for ${pathname}:`, {
      hasToken,
      tokenLength: token?.length || 0,
    });
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 🔒 보호된 경로에 토큰 없이 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인된 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트
  if (isAuthRoute && hasToken) {
    const redirectTo =
      request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // 보안 헤더 추가
  const response = NextResponse.next();

  if (isProtectedRoute) {
    // 관리자 페이지 보안 강화
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
