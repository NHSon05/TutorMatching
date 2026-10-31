"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { TopNavigation } from "@/components/ui/top-navigation";

const NAV_ITEMS = [
  { label: "Bảng điều khiển", href: "/admin/dashboard" },
  { label: "Duyệt hồ sơ gia sư", href: "/admin/tutor-approvals" },
  { label: "Quản lý danh mục", href: "/admin/catalog" },
  { label: "Quản lý tài khoản", href: "/admin/users" },
  { label: "Cài đặt hệ thống", href: "/settings" },
];

export default function AdminNavbar() {
  const pathname = usePathname();

  return (
    <TopNavigation
      aria-label="Thanh điều hướng quản trị viên"
      behavior="sticky"
      hugLogo
      transparent
      className="border-b border-border-default bg-surface-card text-content-primary"
      logo={
        <Link
          href="/admin/dashboard"
          aria-label="TutorMatching — Tổng quan quản trị viên"
          className="flex items-center gap-2"
        >
          <Logo variant="gradient" className="h-8 w-8" />
          <span className="hidden 2xl:inline font-bold tracking-tight">
            TutorMatching
          </span>
          <span className="hidden sm:inline rounded-full bg-red-50 text-status-error px-2.5 py-0.5 text-xs font-semibold border border-red-200 dark:bg-red-950/60 dark:border-red-900">
            Quản trị
          </span>
        </Link>
      }
      centerContent={
        <nav
          aria-label="Điều hướng quản trị"
          className="hidden xl:flex items-center gap-5 whitespace-nowrap"
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/admin/dashboard"
                ? pathname === "/admin/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`border-b-2 py-1 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-status-error text-status-error font-semibold"
                    : "border-transparent text-content-secondary hover:text-status-error"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      }
      rightContent={
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Superuser</span>
          </div>
          <Link
            href="/settings"
            className="text-xs font-medium text-content-secondary hover:text-content-primary"
          >
            Cài đặt
          </Link>
          <LogoutButton />
        </div>
      }
    />
  );
}
