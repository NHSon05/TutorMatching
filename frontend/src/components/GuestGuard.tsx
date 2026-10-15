"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TutorProfileStatus, UserRole } from "@/types/user";

export function getHomeRouteForRole(
  role?: UserRole | "ADMIN" | "LEARNER" | "TUTOR" | string | null,
  tutorProfileStatus?: TutorProfileStatus | string | null
): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TUTOR") {
    if (
      tutorProfileStatus === "DRAFT" ||
      tutorProfileStatus === "PENDING_REVIEW" ||
      tutorProfileStatus === "REJECTED"
    ) {
      return "/tutor/onboarding";
    }
    return "/tutor/dashboard";
  }
  return "/";
}

export interface GuestGuardProps {
  children: ReactNode;
  initialRole?: string | null;
}

/**
 * GuestGuard: Chặn người dùng đã xác thực (đã đăng nhập) truy cập vào các trang chỉ dành cho khách
 * như /login, /register, /select-role.
 *
 * Nếu người dùng đã đăng nhập:
 * - Điều hướng tự động về trang tương ứng theo vai trò (ADMIN -> /admin/dashboard, TUTOR -> /tutor/onboarding hoặc /tutor/dashboard, LEARNER -> /).
 * - Không render nội dung form (tránh chớp UI form đăng nhập).
 */
export function GuestGuard({ children, initialRole }: GuestGuardProps) {
  const router = useRouter();
  const { data: sessionAccount, isLoading } = useSession();
  const storeUser = useAuthStore((state) => state.user);

  const activeRole = sessionAccount?.role ?? storeUser?.role ?? initialRole;
  const activeTutorStatus = sessionAccount?.tutorProfileStatus ?? storeUser?.tutorProfileStatus;
  const isAuthenticated = Boolean(sessionAccount || storeUser || initialRole);

  useEffect(() => {
    if (isLoading && !initialRole && !storeUser) return;
    if (isAuthenticated) {
      router.replace(getHomeRouteForRole(activeRole, activeTutorStatus));
    }
  }, [activeRole, activeTutorStatus, isAuthenticated, isLoading, initialRole, router, storeUser]);

  // Khi đã xác thực, không hiển thị form khách
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
