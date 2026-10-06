"use client";

import * as React from "react";
import Image from "next/image";
import { TextField } from "../ui";

export interface DashboardUser {
  name: string;
  avatar: string;
  role: string;
  unreadNotifications: number;
}

const DEFAULT_USER: DashboardUser = {
  name: "Esther",
  avatar:
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
  role: "Học viên",
  unreadNotifications: 3,
};

export interface DashboardTopBarProps {
  user?: DashboardUser;
}

export function DashboardTopBar({ user = DEFAULT_USER }: DashboardTopBarProps) {
  const [searchValue, setSearchValue] = React.useState("");

  return (
    <div className="w-full flex flex-col  sm:flex-row sticky top-2 z-20 items-stretch sm:items-center justify-between gap-4 pb-6">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-md">
        <TextField
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search projects"
          width={360}
        />
      </div>

      {/* Right Controls: Live Badge, Theme Moon, Bell, Avatar */}
      <div className="flex items-center justify-end gap-3 self-end sm:self-auto">
        {/* Live Badge */}
        <div
          role="button"
          tabIndex={0}
          className="bg-linear-to-r from-cyan-500 to-blue-500 hover:bg-brand text-white text-xs font-semibold px-3 py-2 rounded-full flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer select-none"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span>Thành viên</span>
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

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Thông báo"
          className="relative w-10 h-10 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
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
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {user.unreadNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
          )}
        </button>

        {/* User Avatar */}
        <div
          role="button"
          tabIndex={0}
          title={user.name}
          className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-xs cursor-pointer"
        >
          <Image
            src={user.avatar}
            alt={user.name}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardTopBar;
