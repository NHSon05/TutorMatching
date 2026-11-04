"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { TutorLayoutShell } from "@/components/layouts/TutorLayoutShell";
import { TutorGuard } from "@/components/tutor/TutorGuard";
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

  const isSharedRoute =
    pathname === "/messages" ||
    pathname?.startsWith("/messages/") ||
    pathname === "/settings" ||
    pathname?.startsWith("/settings/") ||
    pathname === "/profile";

  const isTutorRoute =
    pathname === "/" ||
    pathname === "/profile" ||
    pathname === "/messages" ||
    pathname?.startsWith("/messages/");

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

  if (
    (account?.role === "TUTOR" || (isLoading && initialRole === "TUTOR")) &&
    isTutorRoute
  ) {
    return (
      <TutorGuard>
        <TutorLayoutShell>{children}</TutorLayoutShell>
      </TutorGuard>
    );
  }

  // 3. Shared routes (/messages, /settings) when accessed by non-learner (e.g. Tutor, Admin)
  if (isSharedRoute) {
    if (!isLoading && account?.role === "TUTOR" && account?.tutorProfileStatus !== "APPROVED") {
      return null;
    }

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
