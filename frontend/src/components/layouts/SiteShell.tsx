"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { LearnerShell } from "@/components/layouts/LearnerShell";
import PublicNavbar from "@/components/navigation/PublicNavbar";
import PublicFooter from "@/components/navigation/PublicFooter";
import SharedNavbar from "@/components/navigation/SharedNavbar";
import { AuthGuard } from "@/components/AuthGuard";
import { GuestGuard } from "@/components/GuestGuard";

const AUTH_STANDALONE_ROUTES = ["/login", "/register", "/select-role"];

export function SiteShell({
  initialRole,
  children,
}: {
  initialRole?: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: account, isLoading } = useSession();

  const isAuthRoute = AUTH_STANDALONE_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  // 1. Auth routes (/login, /register, /select-role) render standalone without headers/footers
  // Chặn người dùng đã đăng nhập truy cập vào các trang này
  if (isAuthRoute) {
    return (
      <GuestGuard initialRole={initialRole}>
        <main className="min-h-screen">{children}</main>
      </GuestGuard>
    );
  }

  // 2. Authenticated LEARNER gets the persistent LearnerShell across all their pages
  // Check both resolved session, SSR initialRole hint, and dedicated /learner/ routes
  const isLearner =
    account?.role === "LEARNER" ||
    (isLoading && initialRole === "LEARNER") ||
    pathname?.startsWith("/learner/");

  if (isLearner) {
    const shellAccount = account ?? {
      id: "",
      fullName: "Học viên",
      email: "",
      role: "LEARNER" as const,
      status: "ACTIVE" as const,
    };
    return <LearnerShell account={shellAccount}>{children}</LearnerShell>;
  }

  // 3. Shared routes (/messages, /settings) when accessed by non-learner (e.g. Tutor, Admin)
  const isSharedRoute =
    pathname === "/messages" ||
    pathname?.startsWith("/messages/") ||
    pathname === "/settings" ||
    pathname?.startsWith("/settings/");

  if (isSharedRoute) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col bg-gray-50">
          <SharedNavbar />
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </AuthGuard>
    );
  }

  // 4. Default / Public routes (Landing, Tutors list when guest or not logged in as Learner)
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
