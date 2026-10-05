"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { label: "Bảng điều khiển", href: "/admin/dashboard", icon: "📊" },
    { label: "Duyệt hồ sơ gia sư", href: "/admin/tutor-approvals", icon: "📝" },
    { label: "Quản lý người dùng", href: "/admin/users", icon: "👥" },
    { label: "Cài đặt hệ thống", href: "/settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-gray-200 min-h-screen flex flex-col flex-shrink-0 border-r border-gray-800">
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
            A
          </span>
          <span className="font-bold text-lg text-white tracking-wide">
            Admin Portal
          </span>
        </Link>
      </div>

      <nav className="p-4 flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-red-600/20 text-red-400 font-semibold border-l-4 border-red-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          <span>🚪</span>
          <span>Đăng xuất Admin</span>
        </Link>
      </div>
    </aside>
  );
}
