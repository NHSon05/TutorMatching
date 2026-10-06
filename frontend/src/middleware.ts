import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bỏ qua các file tĩnh trong public (file xác minh Google, robots.txt, sitemap.xml, images, etc.)
  if (
    pathname.startsWith("/google") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Lấy token và role từ cookie
  const token = request.cookies.get("auth_token")?.value;
  const role = request.cookies.get("user_role")?.value?.toUpperCase();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isSelectRolePage = pathname.startsWith("/select-role");
  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/tutors") ||
    isAuthPage ||
    isSelectRolePage;

  // 1. Người dùng chưa đăng nhập cố tình vào trang yêu cầu xác thực
  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Người dùng đã đăng nhập và đã có vai trò nhưng vào /login, /register hoặc /select-role
  if (token && role && (isAuthPage || isSelectRolePage)) {
    if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    if (role === "TUTOR") {
      return NextResponse.redirect(new URL("/tutor/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/learner/dashboard", request.url));
  }

  // 3. Người dùng đăng nhập qua OAuth2.0 nhưng chưa có vai trò (thiếu role)
  // Nếu cố gắng vào các trang dashboard/admin/tutor/learner/messages mà chưa chọn vai trò -> chuyển đến /select-role
  if (token && !role && !isSelectRolePage && !isPublicPage) {
    return NextResponse.redirect(new URL("/select-role", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
