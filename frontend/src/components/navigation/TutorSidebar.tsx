"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";
import {
  CalendarIcon,
  DashboardIcon,
  GraduationCapIcon,
  LogOutIcon,
  MessagesIcon,
  SearchIcon,
  UserProfileIcon,
  UsersIcon,
} from "../icons";

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
      label: "Yêu cầu thuê",
      href: "/tutor/requests",
      icon: MessagesIcon,
      isActive: pathname.startsWith("/tutor/requests"),
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
      href: "/students",
      icon: SearchIcon,
      isActive: pathname === "/tutors",
    },
  ];

  const bottomNavItems = [
    {
      label: "Hồ sơ",
      href: "/tutor/profile-edit",
      icon: UserProfileIcon,
      isActive:
        pathname === "/tutor/profile-edit" || pathname === "/tutor/onboarding",
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
                    ? "bg-tutor-50 text-tutor-900 font-semibold border-role-tutor shadow-2xs"
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
                    ? "bg-tutor-50 text-tutor-900 font-semibold   border-role-tutor shadow-2xs"
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
