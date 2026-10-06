"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  NavigationRail,
  NavItem,
  type NavigationRailMode,
} from "@/components/ui/navigation-rail";
import Logo from "@assets/logo/Logo";

// ============================================================================
// ICONS
// ============================================================================

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

function TutorsIcon({ className = "w-5 h-5" }: { className?: string }) {
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

function MessagesIcon({ className = "w-5 h-5" }: { className?: string }) {
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
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
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

function SidebarToggleIcon({
  collapsed,
  className = "w-5 h-5",
}: {
  collapsed: boolean;
  className?: string;
}) {
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
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
      {collapsed ? (
        <path d="m14 9 3 3-3 3" />
      ) : (
        <path d="m17 9-3 3 3 3" />
      )}
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LearnerNavigationRail() {
  const pathname = usePathname();
  const [mode, setMode] = React.useState<NavigationRailMode>("expanded");

  const isCollapsed = mode === "collapsed";

  const toggleMode = () => {
    setMode((prev) => (prev === "expanded" ? "collapsed" : "expanded"));
  };

  return (
    <aside
      aria-label="Learner Side Navigation"
      className="hidden md:flex shrink-0 h-screen sticky top-0 z-30"
    >
      <NavigationRail
        mode={mode}
        expandedWidth={260}
        height="100%"
        className="h-full dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs"
        header={
          <div className="w-full flex flex-col">
            <div className="w-full flex items-center justify-between py-1 px-2 gap-2">
              <div className="flex items-center gap-2">
                <Logo size={32} />
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl bg-linear-to-r from-blue-600 to-sky-400 bg-clip-text text-transparent font-bold">
                      TutorMatch
                    </span>
                  </div>
                )}
              </div>
              {/* <button
                type="button"
                onClick={toggleMode}
                aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
                title={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
                className={`p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors ${
                  isCollapsed ? "mx-auto" : ""
                }`}
              >
                <SidebarToggleIcon collapsed={isCollapsed} className="w-4 h-4" />
              </button> */}
            </div>
          </div>
        }
        footer={
          <div className="w-full space-y-3">
            {!isCollapsed && (
              <div className="p-4 rounded-2xl bg-[#f0edff] dark:bg-indigo-950/40 text-center space-y-2.5 border border-indigo-100/80 dark:border-indigo-900/40">
                <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed">
                  Upgrade to Pro for more facilities
                </p>
                <button
                  type="button"
                  className="w-full py-2 px-3 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Upgrade</span>
                  <span>→</span>
                </button>
              </div>
            )}
            {isCollapsed ? (
              <div
                title="Học viên Nguyễn Hồng Sơn"
                className="w-10 h-10 mx-auto rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm border border-brand/20 select-none cursor-pointer"
              >
                HS
              </div>
            ) : (
              <div className="flex items-center gap-3 p-1 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 font-bold flex items-center justify-center text-sm shrink-0 select-none border border-brand/20">
                  HS
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    Nguyễn Hồng Sơn
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Học sinh THPT
                  </span>
                </div>
              </div>
            )}
          </div>
        }
      >
          <NavItem
            id="dashboard"
            label="Trang chủ"
            href="/learner/dashboard"
            icon={<DashboardIcon />}
            selected={pathname === "/learner/dashboard"}
          />
          <NavItem
            id="my-tutors"
            label="Gia sư của tôi"
            href="/learner/my-tutors"
            icon={<TutorsIcon />}
            badgeColor="blue"
            badgeVariant="secondary"
            selected={pathname === "/learner/my-tutors"}
          />
          <NavItem
            id="schedule"
            label="Lịch học"
            href="/learner/schedule"
            icon={<CalendarIcon />}
            badgeColor="green"
            badgeVariant="secondary"
            selected={pathname === "/learner/schedule"}
          />
          <NavItem
            id="messages"
            label="Tin nhắn"
            href="/messages"
            icon={<MessagesIcon />}
            badgeColor="red"
            badgeVariant="primary"
            selected={pathname === "/messages"}
          />
          <NavItem
            id="tutors"
            label="Tìm gia sư"
            href="/tutors"
            icon={<SearchIcon />}
            selected={pathname === "/tutors"}
          />
          <NavItem
            id="settings"
            label="Cài đặt tài khoản"
            href="/settings"
            icon={<SettingsIcon />}
            selected={pathname === "/settings"}
          />
      </NavigationRail>
    </aside>
  );
}

export default LearnerNavigationRail;
