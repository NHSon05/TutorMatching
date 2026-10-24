"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { usePathname } from "next/navigation";

export default function TutorNavbar() {
  const pathname = usePathname();
  const isOnboarding = pathname === "/tutor/onboarding";

  const navItems = [
    { label: "Tổng quan", href: "/tutor/dashboard" },
    { label: "Lớp đang dạy", href: "/tutor/teaching-classes" },
    { label: "Lịch rảnh & khóa học", href: "/tutor/offers" },
    { label: "Hồ sơ gia sư", href: "/tutor/profile-edit" },
    { label: "Tin nhắn", href: "/messages" },
  ];

  const visibleItems = isOnboarding ? navItems.filter(item => item.href === "/tutor/offers" || item.href === "/tutor/profile-edit") : navItems;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href={isOnboarding ? "/tutor/onboarding" : "/tutor/dashboard"} className="flex items-center gap-2">
            <span className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </span>
            <span className="font-bold text-gray-900 tracking-tight">
              TutorMatch <span className="text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full ml-1">{isOnboarding ? "Hoàn thiện hồ sơ" : "Gia sư"}</span>
            </span>
          </Link>

          {visibleItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-6">
              {visibleItems.map((item) => {
                const isActive =
                  item.href === "/tutor/dashboard"
                    ? pathname === "/tutor/dashboard" || pathname === "/"
                    : pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors py-1 border-b-2 ${
                      isActive
                        ? "text-amber-600 border-amber-600 font-semibold"
                        : "text-gray-600 border-transparent hover:text-amber-600"
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
          {visibleItems.length > 0 && (
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
