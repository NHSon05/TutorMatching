"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  NavigationRail,
  NavItem,
} from "@/components/ui/navigation-rail";
import Logo from "@assets/logo/Logo";
import { CalendarIcon, DashboardIcon, MessagesIcon, SearchIcon, SettingsIcon, TutorsIcon } from "../icons";
import { useUIStore } from "@/stores/use-ui-store";

// ============================================================================
// COMPONENT
// ============================================================================

export function LearnerNavigationRail() {
  const pathname = usePathname();
  const mode = useUIStore((state) => state.mode);

  const isCollapsed = mode === "collapsed";
  
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
            <div className="w-full flex items-center justify-between pt-4 px-2">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl bg-linear-to-r from-brand to-sky-400 bg-clip-text text-transparent font-bold">
                      TutorMatch
                    </span>
                  </div>
                )}
              </Link>
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
                  className="w-full py-2 px-3 rounded-xl bg-linear-to-r from-brand to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
          <NavItem id="hire-requests" label="Yêu cầu thuê" href="/learner/requests" icon={<TutorsIcon />} selected={pathname.startsWith("/learner/requests")} />
          <NavItem
            id="dashboard"
            label="Trang chủ"
            href="/"
            icon={<DashboardIcon />}
            selected={pathname === "/"}
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
