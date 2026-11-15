"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ApiError } from "@/lib/api/http";
import {
  updateAdminUserStatus,
  type AdminUser,
  type AdminUserTargetStatus,
} from "@/lib/api/admin-users";

export interface UserStatusDialogProps {
  user: AdminUser;
  onClose: () => void;
  /** Called after a committed change with the server's updated account. */
  onChanged: (user: AdminUser) => void;
  /** Called when the account changed elsewhere and must be reloaded before retrying. */
  onStale: () => void;
}

export function UserStatusDialog({
  user,
  onClose,
  onChanged,
  onStale,
}: UserStatusDialogProps) {
  const target: AdminUserTargetStatus =
    user.status === "LOCKED" ? "ACTIVE" : "LOCKED";
  const locking = target === "LOCKED";
  const [confirmed, setConfirmed] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      updateAdminUserStatus(user.id, {
        expectedVersion: user.version,
        status: target,
      }),
    onSuccess: onChanged,
  });
  const error = mutation.error;
  const stale = error instanceof ApiError && error.status === 409;

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
      description={
        locking
          ? `Khóa ${user.fullName} (${user.email}) sẽ đăng xuất mọi phiên đang hoạt động và ẩn hồ sơ gia sư khỏi tìm kiếm công khai.`
          : `Mở khóa ${user.fullName} (${user.email}). Người dùng cần đăng nhập lại; các phiên cũ không được khôi phục.`
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" onClick={onClose}>
            Hủy
          </Button>
          {stale ? (
            <Button variant="secondary" onClick={onStale}>
              Tải lại tài khoản
            </Button>
          ) : (
            <Button
              variant={locking ? "danger" : "success"}
              disabled={!confirmed || mutation.isPending}
              isLoading={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {locking ? "Xác nhận khóa" : "Xác nhận mở khóa"}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <Checkbox
          checked={confirmed}
          onChange={(checked) => setConfirmed(checked)}
          disabled={mutation.isPending || stale}
          label={
            locking
              ? "Tôi xác nhận muốn khóa tài khoản này."
              : "Tôi xác nhận muốn mở khóa tài khoản này."
          }
        />
        {error && (
          <p role="alert" className="text-sm text-status-error">
            {stale
              ? "Tài khoản đã thay đổi ở nơi khác. Hãy tải lại trước khi thao tác."
              : error instanceof ApiError
                ? error.title
                : "Không thể cập nhật trạng thái. Vui lòng thử lại."}
          </p>
        )}
      </div>
    </Dialog>
  );
}

export default UserStatusDialog;
