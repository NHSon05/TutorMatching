"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-auth";

export function LogoutButton() {
  const router = useRouter();
  const { mutateAsync: logout, isPending } = useLogout();
  const [error, setError] = useState("");
  const errorId = useId();

  async function handleLogout() {
    if (isPending) return;
    setError("");
    try {
      await logout();
      router.replace("/login");
    } catch {
      setError("Đăng xuất chưa thành công. Vui lòng thử lại.");
    }
  }

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        size="small"
        variant="secondary"
        disabled={isPending}
        aria-busy={isPending}
        aria-describedby={error ? errorId : undefined}
        onClick={handleLogout}
      >
        {isPending ? "Đang đăng xuất..." : "Đăng xuất"}
      </Button>
      {error && (
        <p id={errorId} role="alert" className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-lg border border-border-default bg-surface-card p-3 text-sm text-status-error shadow-sm">
          {error}
        </p>
      )}
    </div>
  );
}
