"use client";

import * as React from "react";
import Link from "next/link";
import Logo from "@assets/logo/Logo";
import AdminSidebar from "@/components/navigation/AdminSidebar";
import { CloseIcon, MenuIcon } from "../icons";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-surface-base text-content-primary">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen sticky top-0 shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-xs bg-surface-base h-full shadow-2xl z-10 flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded-lg text-content-secondary hover:text-content-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Đóng thanh điều hướng"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Header Bar */}
        <header className="h-16 border-b border-border-default px-6 flex items-center justify-between bg-surface-base sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl border border-border-default text-content-secondary hover:text-content-primary hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-label="Mở menu điều hướng"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="md:hidden flex items-center gap-2">
              <Logo size={28} />
              <span className="font-bold text-base text-content-primary">
                TutorMatch Admin
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-content-secondary uppercase tracking-wider">
              <span>Hệ thống quản trị TutorMatching</span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <span className="text-status-error font-medium">Bảng điều hành</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800 select-none">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span>Hệ thống trực tuyến</span>
            </div>

            {/* Quick Links */}
            <Link
              href="/settings"
              className="text-xs font-medium text-content-secondary hover:text-status-error transition-colors px-2 py-1 rounded-md"
            >
              Cài đặt
            </Link>

            {/* User Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-border-default">
              <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-950/80 text-status-error font-bold flex items-center justify-center text-[11px] select-none border border-red-200 dark:border-red-900">
                AD
              </div>
              <span className="hidden sm:inline text-xs font-semibold text-gray-800 dark:text-gray-200">
                Admin
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayoutShell;
