"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SharedNavbar() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </span>
            <span className="font-bold text-gray-900 tracking-tight">
              TutorMatching
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/messages"
              className={`text-sm font-medium py-1 border-b-2 ${
                pathname === "/messages"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-indigo-600"
              }`}
            >
              Tin nhắn
            </Link>
            <Link
              href="/settings"
              className={`text-sm font-medium py-1 border-b-2 ${
                pathname === "/settings"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-indigo-600"
              }`}
            >
              Cài đặt
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/learner/dashboard"
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            ← Về Dashboard
          </Link>
          <Link
            href="/login"
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            Đăng xuất
          </Link>
        </div>
      </div>
    </header>
  );
}
