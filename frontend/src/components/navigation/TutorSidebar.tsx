"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";

// ============================================================================
// ICONS
// ============================================================================

function GraduationCapIcon({ className = "w-6 h-6 text-role-tutor" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function DashboardIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function UsersIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function SearchIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function UserProfileIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SettingsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function LogOutIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

export interface TutorSidebarProps {
  onCloseMobile?: () => void;
}

export function TutorSidebar({ onCloseMobile }: TutorSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutateAsync: logout, isPending } = useLogout();

  const handleLogout = async () => {
    if (isPending) return;
    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    }
  };

  const mainNavItems = [
    {
      label: "Tổng quan",
      href: "/tutor/dashboard",
      icon: DashboardIcon,
      isActive: pathname === "/tutor/dashboard" || pathname === "/tutor",
    },
    {
      label: "Học sinh",
      href: "/tutor/teaching-classes",
      icon: UsersIcon,
      isActive: pathname === "/tutor/teaching-classes",
    },
    {
      label: "Lịch dạy",
      href: "/tutor/offers",
      icon: CalendarIcon,
      isActive: pathname === "/tutor/offers",
    },
    {
      label: "Tìm học sinh",
      href: "/tutors",
      icon: SearchIcon,
      isActive: pathname === "/tutors",
    },
  ];

  const bottomNavItems = [
    {
      label: "Hồ sơ gia sư",
      href: "/tutor/profile-edit",
      icon: UserProfileIcon,
      isActive: pathname === "/tutor/profile-edit" || pathname === "/tutor/onboarding",
    },
    {
      label: "Cài đặt",
      href: "/settings",
      icon: SettingsIcon,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <aside
      aria-label="Tutor Navigation Sidebar"
      className="w-64 bg-surface-base border-r border-border-default flex flex-col h-full shrink-0 select-none"
    >
      {/* Brand Header with Tutor & Brand Palettes */}
      <div className="h-18 px-6 flex items-center justify-between border-b border-border-subtle">
        <Link
          href="/tutor/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <GraduationCapIcon className="w-6 h-6 text-role-tutor group-hover:text-tutor-700 transition-colors" />
          <span className="font-bold text-xl tracking-tight text-content-primary group-hover:text-brand transition-colors">
            TutorMatching
          </span>
        </Link>
      </div>

      {/* Main Nav Items with Tutor Amber Accent */}
      <div className="flex-1 px-3 py-4 flex flex-col justify-between overflow-y-auto">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base transition-all ${
                  item.isActive
                    ? "bg-tutor-50 text-tutor-900 font-semibold border-l-4 border-role-tutor shadow-2xs"
                    : "text-content-secondary hover:text-tutor-900 hover:bg-tutor-50/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.isActive ? "text-role-tutor" : "text-content-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav Items */}
        <div className="space-y-1 pt-4 border-t border-border-default">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base transition-all ${
                  item.isActive
                    ? "bg-tutor-50 text-tutor-900 font-semibold border-l-4 border-role-tutor shadow-2xs"
                    : "text-content-secondary hover:text-tutor-900 hover:bg-tutor-50/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.isActive ? "text-role-tutor" : "text-content-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Logout Action */}
          <button
            type="button"
            onClick={handleLogout}
            disabled={isPending}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-base text-content-secondary hover:text-status-error hover:bg-red-50/40 transition-colors cursor-pointer text-left"
          >
            <LogOutIcon className="w-5 h-5 shrink-0 text-content-muted" />
            <span>{isPending ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default TutorSidebar;
