"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useAuthStore } from "@/stores/use-auth-store";
import { TutorSidebar } from "@/components/navigation/TutorSidebar";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { CloseIcon, MenuIcon } from "../icons";

export function TutorLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { data: account } = useSession();
  const authUser = useAuthStore((s) => s.user);

  const tutorProfileStatus =
    account?.tutorProfileStatus ?? authUser?.tutorProfileStatus;
  const isApproved = tutorProfileStatus === "APPROVED";
  const isOnboarding = pathname === "/onboarding";
  const showSidebar = isApproved && !isOnboarding;

  // Khi đang ở trạng thái DRAFT / PENDING đang đăng ký hoặc đang ở onboarding:
  // KHÔNG xuất hiện thanh sidebar của tutor!
  if (!showSidebar) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-base text-content-primary">
        <header className="h-16 border-b border-border-default px-4 sm:px-8 flex items-center justify-between bg-surface-base sticky top-0 z-30 shadow-2xs">
          <Link
            href={isApproved ? "/" : "/onboarding"}
            className="flex items-center gap-2.5 group"
          >
            <Logo size={32} />
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl tracking-tight text-content-primary group-hover:text-amber-600 transition-colors">
                TutorMatch
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                {isOnboarding ? "Hoàn thiện hồ sơ" : "Gia sư"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {account?.fullName && (
              <span className="hidden sm:inline text-xs font-medium text-content-secondary">
                {account.fullName}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  // Khi gia sư đã được phê duyệt (APPROVED): hiển thị sidebar đầy đủ
  return (
    <div className="min-h-screen flex bg-surface-base text-content-primary">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0">
        <TutorSidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-xs bg-surface-base h-full shadow-2xl z-10 flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Đóng thanh điều hướng"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <TutorSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Header */}
        <header className="md:hidden h-16 border-b border-border-default px-4 flex items-center justify-between bg-surface-base sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-bold text-lg text-content-primary">
              TutorMatching
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl border border-border-default text-content-secondary hover:text-content-primary hover:bg-gray-50 dark:hover:bg-gray-800"
            aria-label="Mở menu điều hướng"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
        </header>

        {/* Content Body */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default TutorLayoutShell;
