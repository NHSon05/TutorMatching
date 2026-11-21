"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLogout } from "@/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import Logo from "@assets/logo/Logo";
import {
  CalendarIcon,
  DashboardIcon,
  LogOutIcon,
  MessagesIcon,
  RequestIcon,
  SearchIcon,
  UserProfileIcon,
  UsersIcon,
} from "../icons";
import { AUTH_OUT_TYPES } from "@/lib/navigation/transition-types";
import { POST_LOGOUT_PATH } from "@/lib/auth/logout-redirect";
import { Avatar } from "@/components/ui/avatar";
import { toUserDisplay } from "@/lib/auth/user-display";
import { formatBadgeCount, useMessengerBadge } from "@/hooks/use-messenger-badge";

export interface TutorSidebarProps {
  onCloseMobile?: () => void;
}

export function TutorSidebar({ onCloseMobile }: TutorSidebarProps) {
  const pathname = usePathname();
  const unreadMessages = useMessengerBadge();
  const { data: account } = useSession();
  const user = toUserDisplay(account, "Gia sư");
  const router = useRouter();
  const { mutateAsync: logout, isPending } = useLogout();

  const handleLogout = async () => {
    if (isPending) return;
    try {
      await logout();
      router.replace(POST_LOGOUT_PATH, { transitionTypes: AUTH_OUT_TYPES });
    } catch {
      router.replace("/login", { transitionTypes: AUTH_OUT_TYPES });
    }
  };

  const mainNavItems = [
    {
      label: "Tổng quan",
      href: "/",
      icon: DashboardIcon,
      isActive: pathname === "/",
    },
    {
      label: "Yêu cầu thuê",
      href: "/request",
      icon: RequestIcon,
      isActive: pathname === "/request" || pathname.startsWith("/request/"),
    },
    ...(account?.tutorProfileStatus === "APPROVED"
      ? [{
          label: "Tin nhắn",
          href: "/messages",
          icon: MessagesIcon,
          badge: unreadMessages,
          isActive: pathname === "/messages" || pathname.startsWith("/messages/"),
        }]
      : []),
    {
      label: "Học sinh",
      href: "/teaching-classes",
      icon: UsersIcon,
      isActive: pathname === "/teaching-classes",
    },
    {
      label: "Lịch dạy",
      href: "/offers",
      icon: CalendarIcon,
      isActive: pathname === "/offers",
    },
    {
      label: "Tìm học sinh",
      href: "/students",
      icon: SearchIcon,
      isActive: pathname === "/students",
    },
  ];

  const bottomNavItems = [
    {
      label: "Hồ sơ",
      href: "/profile",
      icon: UserProfileIcon,
      isActive: pathname === "/profile" || pathname === "/onboarding",
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
          href="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <Logo
            variant="gradient"
            size={32}
            className="group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="font-bold text-xl tracking-tight text-brand-950 group-hover:text-brand transition-colors leading-none">
            TutorMatch
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
                    ? "bg-brand-50 text-brand-900 font-semibold border-brand shadow-2xs"
                    : "text-content-secondary hover:text-brand-900 hover:bg-brand-50/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.isActive ? "text-brand" : "text-content-muted"
                  }`}
                />
                <span>{item.label}</span>
                {"badge" in item && item.badge ? (
                  <span
                    className="ml-auto min-w-5 h-5 px-1.5 rounded-full bg-status-error text-white text-xs font-bold flex items-center justify-center"
                    aria-label={`${item.badge} tin nhắn chưa đọc`}
                  >
                    {formatBadgeCount(item.badge)}
                  </span>
                ) : null}
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
                    ? "bg-brand-50 text-brand-900 font-semibold border-brand shadow-2xs"
                    : "text-content-secondary hover:text-brand-900 hover:bg-brand-50/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    item.isActive ? "text-brand" : "text-content-muted"
                  }`}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer: signed-in tutor (same session data as the top bar) + logout */}
      <div className="p-4 border-t border-border-default space-y-2">
        <Link
          href="/profile"
          onClick={onCloseMobile}
          aria-label={`Hồ sơ của ${user.name}`}
          className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-border-subtle hover:border-brand/30 transition-colors"
        >
          <Avatar src={user.avatarSrc} alt={user.name} fallbackText={user.initials} data-testid="tutor-sidebar-avatar" />
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-content-primary truncate" title={user.name}>
              {user.name}
            </span>
            <span className="text-xs text-content-secondary">Gia sư</span>
          </span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-content-secondary hover:text-status-error hover:bg-status-error/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <LogOutIcon className="w-5 h-5 shrink-0" />
          <span>{isPending ? "Đang đăng xuất..." : "Đăng xuất"}</span>
        </button>
      </div>
    </aside>
  );
}
