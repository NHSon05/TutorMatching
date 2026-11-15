"use client";

import * as React from "react";
import Link from "next/link";
import { Avatar, TextField } from "../ui";
import type { DashboardTopBarProps, DashboardUser } from "./types";
import { LogoutButton } from "../LogoutButton";
import { NotificationBell } from "../notifications/NotificationBell";
import { SidebarToggleIcon } from "../icons";
import { useUIStore } from "@/stores/use-ui-store";
import { toUserDisplay } from "@/lib/auth/user-display";

export type * from "./types";

/** Neutral placeholder; shells always pass the signed-in account. */
const DEFAULT_USER: DashboardUser = {
  name: "Người dùng",
  avatar: null,
  role: "Thành viên",
};

export function DashboardTopBar({
  user = DEFAULT_USER,
  roleLabel = "Thành viên",
  mobileLink = { href: "/learner/requests", label: "Yêu cầu thuê" },
  onToggleSidebar,
  sidebarCollapsed,
}: DashboardTopBarProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const display = toUserDisplay({ fullName: user.name, avatarUrl: user.avatar }, user.name);
  const mode = useUIStore((state) => state.mode);
  const toggleMode = useUIStore((state) => state.toggleMode);

  const isCollapsed = onToggleSidebar
    ? Boolean(sidebarCollapsed)
    : mode === "collapsed";
  const handleToggle = onToggleSidebar ?? toggleMode;

  return (
    <div className="w-full flex flex-col  sm:flex-row sticky top-2 z-20 items-stretch sm:items-center justify-between gap-4 pb-6">
      <Link
        href={mobileLink.href}
        className="md:hidden text-brand font-semibold"
      >
        {mobileLink.label}
      </Link>
      {/* Search Input Bar */}
      <div className="flex-1 max-w-md">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={
              isCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
            }
            title={
              isCollapsed
                ? "Mở rộng thanh điều hướng"
                : "Thu gọn thanh điều hướng"
            }
            className={`p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors ${
              isCollapsed ? "mx-auto" : ""
            }`}
          >
            <SidebarToggleIcon collapsed={isCollapsed} className="w-5 h-5" />
          </button>
          <TextField
            type="search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search projects"
            width={360}
          />
        </div>
      </div>

      {/* Right Controls: Live Badge, Theme Moon, Bell, Avatar */}
      <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
        {/* Live Badge */}
        <div
          role="button"
          tabIndex={0}
          className="bg-brand hover:bg-brand text-white text-xs font-semibold px-3 py-2 rounded-full flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer select-none"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>{roleLabel}</span>
        </div>

        {/* Moon Icon (Dark Mode toggle button) */}
        <button
          type="button"
          aria-label="Chuyển chế độ sáng/tối"
          className="w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>

        <NotificationBell />

        {/* User Avatar: same source (session) as the sidebar; falls back to initials. */}
        <Link href="/profile" aria-label={`Hồ sơ của ${display.name}`} title={display.name} className="rounded-full">
          <Avatar
            src={display.avatarSrc}
            alt={display.name}
            fallbackText={display.initials}
            data-testid="topbar-avatar"
            className="border-2 border-white dark:border-gray-800 shadow-xs"
          />
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}

export default DashboardTopBar;
