"use client";

import { useContext } from "react";
import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AuthenticatedAccountContext } from "@/hooks/use-authenticated-account";
import { useAuthStore } from "@/stores/use-auth-store";

export interface LoginRequiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function useIsViewerAuthenticated(): boolean {
  const contextAccount = useContext(AuthenticatedAccountContext);
  const storeUser = useAuthStore((s) => s.user);
  const isStoreAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (contextAccount || storeUser || isStoreAuthenticated) {
    return true;
  }

  if (typeof document !== "undefined") {
    const cookies = document.cookie || "";
    if (
      cookies.includes("tm_role=") ||
      cookies.includes("user_role=") ||
      cookies.includes("auth_token=")
    ) {
      return true;
    }
  }

  return false;
}

export function LoginRequiredDialog({
  isOpen,
  onClose,
}: LoginRequiredDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Yêu cầu đăng nhập"
      maxWidth="sm"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button asChild variant="brand">
            <Link href="/login">Đăng nhập ngay</Link>
          </Button>
        </>
      }
    >
      <div role="alert" className="space-y-2 text-content-primary">
        <p className="font-medium">
          Bạn cần đăng nhập để thực hiện thuê gia sư.
        </p>
        <p className="text-sm text-content-secondary">
          Vui lòng đăng nhập tài khoản học viên hoặc đăng ký tài khoản mới để
          tiếp tục gửi yêu cầu học tập.
        </p>
      </div>
    </Dialog>
  );
}
