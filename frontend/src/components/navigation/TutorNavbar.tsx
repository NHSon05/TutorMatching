"use client";

import Link from "next/link";
import Logo from "@assets/logo/Logo";
import { LogoutButton } from "@/components/LogoutButton";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/use-session";

export default function TutorNavbar() {
  const pathname = usePathname();
  const { data: account } = useSession();
  const isTutor = account?.role === "TUTOR";
  const isOnboarding = pathname === "/onboarding";

  const navItems = [
    { label: "Tổng quan", href: "/" },
    { label: "Yêu cầu thuê", href: "/request" },
    { label: "Lớp đang dạy", href: "/teaching-classes" },
    { label: "Lịch rảnh & khóa học", href: "/offers" },
    { label: "Hồ sơ gia sư", href: "/profile" },
    { label: "Tin nhắn", href: "/messages" },
  ];

  const visibleItems = isOnboarding
    ? navItems.filter(
        (item) => item.href === "/offers" || item.href === "/profile"
      )
    : navItems;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={isOnboarding ? "/onboarding" : "/"}
            className="flex items-center gap-2"
          >
            <Logo variant="gradient" size={32} className="shrink-0" />
            <span className="font-bold text-gray-900 tracking-tight">
              TutorMatch{" "}
              <span className="text-xs font-semibold px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full ml-1">
                {isOnboarding ? "Hoàn thiện hồ sơ" : "Gia sư"}
              </span>
            </span>
          </Link>

          {visibleItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {visibleItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors py-1 border-b-2 ${
                      isActive
                        ? "text-brand-600 border-brand-600 font-semibold"
                        : "text-gray-600 border-transparent hover:text-brand-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {visibleItems.length > 0 && isTutor && (
            <Link
              href="/profile"
              className="text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Tài khoản
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
