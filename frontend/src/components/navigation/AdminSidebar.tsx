"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import {
  BookOpenIcon,
  DashboardIcon,
  RequestIcon,
  SettingsIcon,
  UsersIcon,
} from "../icons";

export interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

export default function AdminSidebar({ onCloseMobile }: AdminSidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    {
      label: "Bảng điều khiển",
      href: "/admin/dashboard",
      icon: DashboardIcon,
      isActive: pathname === "/admin/dashboard",
    },
    {
      label: "Duyệt hồ sơ gia sư",
      href: "/admin/tutor-approvals",
      icon: RequestIcon,
      isActive: pathname.startsWith("/admin/tutor-approvals"),
    },
    {
      label: "Quản lý danh mục",
      href: "/admin/catalog",
      icon: BookOpenIcon,
      isActive: pathname.startsWith("/admin/catalog"),
    },
    {
      label: "Quản lý tài khoản",
      href: "/admin/users",
      icon: UsersIcon,
      isActive: pathname.startsWith("/admin/users"),
    },
  ];

  const bottomNavItems = [
    {
      label: "Cài đặt hệ thống",
      href: "/settings",
      icon: SettingsIcon,
      isActive: pathname === "/settings" || pathname.startsWith("/settings/"),
    },
  ];

  return (
    <aside
      aria-label="Admin Navigation Sidebar"
      className="w-64 bg-surface-base border-r border-border-default flex flex-col h-full shrink-0 select-none"
    >
      {/* Brand Header with Logo and Admin Palette */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-border-subtle">
        <Link
          href="/admin/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <Logo size={32} />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-content-primary group-hover:text-status-error transition-colors">
                TutorMatch
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-red-50 text-status-error dark:bg-red-950/60 dark:text-red-300 rounded-full border border-red-200 dark:border-red-900">
                Admin
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Main Navigation Items with Admin Crimson Accent */}
      <div className="flex-1 px-3 py-4 flex flex-col justify-between overflow-y-auto">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                  item.isActive
                    ? "bg-red-50 text-status-error dark:bg-red-950/60 dark:text-red-300 font-semibold border-role-admin shadow-2xs"
                    : "text-content-secondary hover:text-status-error hover:bg-red-50/50 dark:hover:bg-red-950/30"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.isActive ? "text-status-error" : "text-content-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Nav Items & User Info Card */}
        <div className="space-y-3 pt-4 border-t border-border-default">
          <div className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                    item.isActive
                      ? "bg-red-50 text-status-error dark:bg-red-950/60 dark:text-red-300 font-semibold border-role-admin shadow-2xs"
                      : "text-content-secondary hover:text-status-error hover:bg-red-50/50 dark:hover:bg-red-950/30"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      item.isActive ? "text-status-error" : "text-content-muted"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin User Profile Card & Logout */}
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/80 text-status-error font-bold flex items-center justify-center text-xs shrink-0 select-none border border-red-200 dark:border-red-900">
                AD
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  Quản trị viên
                </span>
                <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  Superuser
                </span>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
