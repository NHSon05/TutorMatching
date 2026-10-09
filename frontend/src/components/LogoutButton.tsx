"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth/session";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <span>
    <Button disabled={busy} onClick={async () => {
      setBusy(true); setError("");
      try { await logout(); router.replace("/login"); }
      catch { setError("Đăng xuất chưa thành công. Vui lòng thử lại."); }
      finally { setBusy(false); }
    }}>{busy ? "Đang đăng xuất..." : "Đăng xuất"}</Button>
    {error && <span role="alert">{error}</span>}
  </span>;
}
