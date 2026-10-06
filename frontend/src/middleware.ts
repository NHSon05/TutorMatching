import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
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

  if (pathname === "/"){
    if (token && role) {
      if (role  === "LEARNER") {
        return NextResponse.rewrite(new URL("/learner/dashboard", request.url));
      }
      if (role === "TUTOR") {
        return NextResponse.rewrite(new URL("/tutor/dashboard", request.url));
      }
      if (role === "ADMIN") {
        return NextResponse.rewrite(new URL("/admin/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  const isPublicPage =
    pathname === "/" ||
    pathname.startsWith("/tutors") ||
    isAuthPage ||
    isSelectRolePage;

  if (!token && !isPublicPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token && role && (isAuthPage || isSelectRolePage)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 3. Người dùng đăng nhập qua OAuth2.0 nhưng chưa có vai trò (thiếu role)
  // Nếu cố gắng vào các trang dashboard/admin/tutor/learner/messages mà chưa chọn vai trò -> chuyển đến /select-role
  if (token && !role && !isSelectRolePage && !isPublicPage) {
    return NextResponse.redirect(new URL("/select-role", request.url));
  }

  // 3. Kiểm tra Role-Based Access Control (RBAC)
  if (token && role) {
    if (role === "LEARNER") {
      if (pathname.startsWith("/tutor") || pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (role === "TUTOR") {
      if (pathname.startsWith("/learner") || pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    if (role === "ADMIN") {
      if (pathname.startsWith("/learner") || pathname.startsWith("/tutor")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)",
  ],
};
