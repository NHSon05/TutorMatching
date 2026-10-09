"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { AccountResponse } from "@/lib/api/auth";
import { AppNavigation } from "@/components/AppNavigation";

export function AuthGuard({ children, role }: { children: ReactNode; role?: AccountResponse["role"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const session = await getSession();
        if (!active) return;
        if (!session) { setAccount(null); router.replace("/login"); }
        else if (role && session.role !== role) { setAccount(null); router.replace("/forbidden"); }
        else { setError(false); setAccount(session); }
      } catch { if (active) { setAccount(null); setError(true); } }
    };
    void check();
    const end = () => { setAccount(null); router.replace("/login"); };
    window.addEventListener("focus", check);
    window.addEventListener("session-ended", end);
    return () => { active = false; window.removeEventListener("focus", check); window.removeEventListener("session-ended", end); };
  }, [pathname, role, router]);
  if (error) return <p role="alert">Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.</p>;
  if (!account) return <p role="status">Đang kiểm tra phiên đăng nhập...</p>;
  return <><AppNavigation account={account} />{children}</>;
}
