"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";
import type { AccountResponse } from "@/lib/api/auth";

export function AppNavigation({ account }: { account: AccountResponse }) {
  const router = useRouter();
  const { mutateAsync: logout, isPending: busy } = useLogout();
  const [error, setError] = useState("");

  async function handleLogout() {
    setError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("Đăng xuất chưa thành công. Vui lòng thử lại.");
    }
  }

  return <nav aria-label="Tài khoản" className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-card text-content-primary">
    <span>{account.fullName}</span>
    {error && <p role="alert">{error}</p>}
    <Button disabled={busy} onClick={handleLogout}>{busy ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
  </nav>;
}
