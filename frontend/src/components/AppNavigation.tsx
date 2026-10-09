"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/session";
import type { AccountResponse } from "@/lib/api/auth";

export function AppNavigation({ account }: { account: AccountResponse }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <nav aria-label="Tài khoản" className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card text-content-primary">
    <span>{account.fullName}</span>
    {error && <p role="alert">{error}</p>}
    <Button disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await logout(); router.replace("/login"); }
      catch { setError("Đăng xuất chưa thành công. Vui lòng thử lại."); }
      finally { setBusy(false); }
    }}>{busy ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
  </nav>;
}
