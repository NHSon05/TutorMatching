"use client";

import { usePathname } from "next/navigation";
import PublicNavbar from "@/components/navigation/PublicNavbar";
import PublicFooter from "@/components/navigation/PublicFooter";

// Danh sách các route muốn ẩn Navbar / Footer
const HIDE_NAVBAR_ROUTES = ["/register", "/login", "/select-role"];
const HIDE_FOOTER_ROUTES = ["/register", "/login", "/select-role"];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar = HIDE_NAVBAR_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );
  const hideFooter = HIDE_FOOTER_ROUTES.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!hideNavbar && <PublicNavbar />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <PublicFooter />}
    </div>
  );
}
