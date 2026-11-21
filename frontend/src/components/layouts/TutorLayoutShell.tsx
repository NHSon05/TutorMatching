"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import { useAuthStore } from "@/stores/use-auth-store";
import { TutorSidebar } from "@/components/navigation/TutorSidebar";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { DashboardTopBar } from "@/components/learner/DashboardTopBar";
import { useUIStore } from "@/stores/use-ui-store";
import { CloseIcon } from "../icons";
import { Avatar } from "@/components/ui/avatar";
import { toUserDisplay } from "@/lib/auth/user-display";

export function TutorLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();
  const { data: account } = useSession();
  const authUser = useAuthStore((s) => s.user);
  const user = toUserDisplay(account, "Gia sư");

  const tutorProfileStatus =
    account?.tutorProfileStatus ?? authUser?.tutorProfileStatus;
  const isApproved = tutorProfileStatus === "APPROVED";
  const isOnboarding = pathname === "/onboarding";
  const sidebarCollapsed = useUIStore((s) => s.mode === "collapsed");
  const toggleMode = useUIStore((s) => s.toggleMode);
  // Desktop: collapse/expand the sidebar. Mobile: the sidebar lives in a drawer.
  const toggleSidebar = () => {
    if (window.matchMedia("(min-width: 768px)").matches) toggleMode();
    else setMobileOpen(true);
  };
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
              <span className="font-bold text-lg sm:text-xl tracking-tight text-content-primary group-hover:text-brand-600 transition-colors">
                Edora
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-full border border-brand-200 dark:border-brand-800">
                {isOnboarding ? "Hoàn thiện hồ sơ" : "Gia sư"}
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {account && (
              <span className="flex items-center gap-2">
                <Avatar
                  src={user.avatarSrc}
                  alt={user.name}
                  fallbackText={user.initials}
                  size="small"
                  data-testid="tutor-header-avatar"
                />
                <span
                  className="hidden sm:inline text-xs font-medium text-content-secondary"
                  title={user.name}
                >
                  {user.name}
                </span>
              </span>
            )}
            <NotificationBell />
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
    <div className="min-h-screen flex bg-gray-50 text-content-primary">
      {/* Desktop Sidebar (collapsible from the top bar toggle) */}
      <div
        className={`${sidebarCollapsed ? "hidden" : "hidden md:flex"} h-screen sticky top-0 shrink-0`}
      >
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
        <main className="bg-gray-50 flex-1 w-full mx-auto px-4 sm:px-6 py-4 overflow-y-auto">
          <DashboardTopBar
            user={{
              name: user.name,
              avatar: account?.avatarUrl ?? null,
              role: "Gia sư",
            }}
            roleLabel="Gia sư"
            mobileLink={{ href: "/request", label: "Yêu cầu thuê" }}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={toggleSidebar}
          />
          {children}
        </main>
      </div>
    </div>
  );
}

export default TutorLayoutShell;
