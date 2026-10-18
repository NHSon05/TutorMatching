"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { TopNavigation } from "@/components/ui/top-navigation";
import { useAuthenticatedAccount } from "@/hooks/use-authenticated-account";

const NAV_ITEMS = [
  { label: "Tổng quan", href: "/" },
  { label: "Gia sư của tôi", href: "/learner/my-tutors" },
  { label: "Lịch học", href: "/learner/schedule" },
  { label: "Tin nhắn", href: "/messages" },
];

export default function LearnerNavbar() {
  const pathname = usePathname();
  const account = useAuthenticatedAccount();

  return (
    <TopNavigation
      aria-label="Thanh điều hướng học viên"
      behavior="sticky"
      hugLogo
      transparent
      className="border-b border-border-default bg-surface-card text-content-primary"
      logo={
        <Link href="/" aria-label="TutorMatching — Tổng quan học viên" className="flex items-center gap-2">
          <Logo variant="gradient" className="h-8 w-8" />
          <span className="hidden 2xl:inline font-bold tracking-tight">TutorMatching</span>
          <span className="hidden sm:inline rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand">Học viên</span>
        </Link>
      }
      centerContent={
        <nav aria-label="Điều hướng học viên" className="hidden xl:flex items-center gap-4 whitespace-nowrap">
          {NAV_ITEMS.map(item => {
            const isActive = item.href === "/" ? pathname === "/" : (pathname === item.href || pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`border-b-2 py-1 text-sm font-medium transition-colors ${isActive
                  ? "border-brand text-brand font-semibold"
                  : "border-transparent text-content-secondary hover:text-brand"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      }
      rightContent={
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/tutors" className="hidden 2xl:inline-flex rounded-md bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-100">
            + Tìm gia sư mới
          </Link>
          <Link href="/profile" className="text-xs font-medium text-content-secondary hover:text-content-primary">
            Hồ sơ
          </Link>
          <span className="hidden md:block max-w-24 truncate text-sm" title={account.fullName}>{account.fullName}</span>
          <LogoutButton />
        </div>
      }
    />
  );
}