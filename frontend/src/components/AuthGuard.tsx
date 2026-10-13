"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import type { AccountResponse } from "@/lib/api/auth";
import { AuthenticatedAccountContext } from "@/hooks/use-authenticated-account";

type AuthGuardProps = { children: ReactNode; role?: AccountResponse["role"] };

export function AuthGuard({ children, role }: AuthGuardProps) {
  const router = useRouter();
  const { data: account, error, isLoading } = useSession();

  useEffect(() => {
    if (isLoading || error) return;
    if (!account) {
      router.replace("/login");
    } else if (role && account.role !== role) {
      router.replace("/forbidden");
    }
  }, [account, error, isLoading, role, router]);

  if (error) {
    return <p role="alert">Không thể kiểm tra phiên đăng nhập. Vui lòng tải lại trang.</p>;
  }

  if (isLoading || !account || (role && account.role !== role)) {
    return null;
  }

  return (
    <AuthenticatedAccountContext.Provider value={account}>
      {children}
    </AuthenticatedAccountContext.Provider>
  );
}
