import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token và role từ cookie
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value?.toUpperCase();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/tutors") ||
    isAuthPage;

  // 1. Người dùng chưa đăng nhập cố tình vào trang yêu cầu xác thực
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Người dùng đã đăng nhập nhưng lại vào /login hoặc /register
  if (token && isAuthPage) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "TUTOR") {
      return NextResponse.redirect(new URL("/tutor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/learner/dashboard", request.url));
  }

  // 3. Kiểm tra Role-Based Access Control (RBAC)
  if (token && role) {
    // Chỉ ADMIN mới được vào /admin/*
    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      const redirectUrl =
        role === "TUTOR" ? "/tutor/dashboard" : "/learner/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Chỉ TUTOR mới được vào /tutor/*
    if (pathname.startsWith("/tutor") && role !== "TUTOR") {
      const redirectUrl =
        role === "ADMIN" ? "/admin/dashboard" : "/learner/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Chỉ LEARNER mới được vào /learner/*
    if (pathname.startsWith("/learner") && role !== "LEARNER") {
      const redirectUrl =
        role === "ADMIN" ? "/admin/dashboard" : "/tutor/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Chạy middleware trên tất cả request ngoại trừ static files, api, _next
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
