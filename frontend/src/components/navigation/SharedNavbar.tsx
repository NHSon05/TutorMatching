"use client";

import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { usePathname } from "next/navigation";
import { MessagesIcon } from "@/components/icons";
import {
  formatBadgeCount,
  useMessengerBadge,
} from "@/hooks/use-messenger-badge";

export default function SharedNavbar() {
  const pathname = usePathname();
  const unreadMessages = useMessengerBadge();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              T
            </span>
            <span className="font-bold text-gray-900 tracking-tight">
              Edora
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/messages"
              aria-label={
                unreadMessages > 0
                  ? `Tin nhắn, ${unreadMessages} chưa đọc`
                  : undefined
              }
              className={`inline-flex items-center gap-1.5 text-sm font-medium py-1 border-b-2 ${
                pathname === "/messages"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-indigo-600"
              }`}
            >
              <span className="relative inline-flex">
                <MessagesIcon className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-status-error text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white"
                  >
                    {formatBadgeCount(unreadMessages)}
                  </span>
                )}
              </span>
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
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-800">
            ← Về Dashboard
          </Link>
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
