"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AccountResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import type { GoogleRegistrationRole, GoogleRoleRequired } from "@/lib/auth/session";
import { useCompleteGoogleRegistration } from "@/hooks/use-auth";

export const GOOGLE_SIGNUP_EXPIRED_MESSAGE =
  "Phiên đăng ký Google đã hết hạn. Vui lòng đóng hộp thoại và đăng nhập Google lại.";
const GOOGLE_SIGNUP_FAILED_MESSAGE = "Không thể tạo tài khoản. Vui lòng thử lại.";

interface RoleOption {
  role: GoogleRegistrationRole;
  title: string;
  description: string;
  icon: string;
}

export const GOOGLE_ROLE_OPTIONS: RoleOption[] = [
  {
    role: "LEARNER",
    title: "Học viên",
    description: "Dành cho học sinh và phụ huynh: tìm gia sư, gửi yêu cầu thuê và theo dõi lịch học.",
    icon: "🎓",
  },
  {
    role: "TUTOR",
    title: "Gia sư",
    description: "Tạo hồ sơ giảng dạy, nhận yêu cầu từ học viên và quản lý lớp học.",
    icon: "👨‍🏫",
  },
];

export interface GoogleRoleDialogProps {
  /** Pending Google registration; the dialog is open while this is set. */
  pending: GoogleRoleRequired | null;
  onClose: () => void;
  onSignedIn: (account: AccountResponse) => void;
}

/** Shown when a verified Google account has no TutorMatching account yet: choose LEARNER or TUTOR. */
export function GoogleRoleDialog({ pending, onClose, onSignedIn }: GoogleRoleDialogProps) {
  return (
    <Dialog
      isOpen={pending !== null}
      onClose={onClose}
      closeOnBackdropClick={false}
      title="Chọn vai trò của bạn"
      description="Tài khoản Google này chưa có trên TutorMatching. Chọn vai trò để hoàn tất đăng ký."
      maxWidth="lg"
    >
      {/* Keyed by token so every new Google attempt starts with a clean selection. */}
      {pending && (
        <RoleStep key={pending.pendingToken} pending={pending} onClose={onClose} onSignedIn={onSignedIn} />
      )}
    </Dialog>
  );
}

function RoleStep({
  pending,
  onClose,
  onSignedIn,
}: {
  pending: GoogleRoleRequired;
  onClose: () => void;
  onSignedIn: (account: AccountResponse) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<GoogleRegistrationRole | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const { mutateAsync: complete, isPending } = useCompleteGoogleRegistration();

  const handleSubmit = async () => {
    if (!selectedRole || isPending) return;
    setErrorMsg("");
    try {
      const account = await complete({ pendingToken: pending.pendingToken, role: selectedRole });
      onSignedIn(account);
    } catch (error) {
      const expired = error instanceof ApiError && error.status === 401;
      setIsExpired(expired);
      setErrorMsg(expired ? GOOGLE_SIGNUP_EXPIRED_MESSAGE : GOOGLE_SIGNUP_FAILED_MESSAGE);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border-default bg-surface-subtle px-4 py-3">
        <p className="text-base font-semibold text-content-primary">{pending.fullName}</p>
        <p className="text-sm text-content-secondary">{pending.email}</p>
      </div>

      <div role="radiogroup" aria-label="Vai trò" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GOOGLE_ROLE_OPTIONS.map(option => {
          const isSelected = selectedRole === option.role;
          return (
            <button
              key={option.role}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isPending || isExpired}
              onClick={() => setSelectedRole(option.role)}
              className={`flex flex-col items-start gap-1 rounded-2xl border-2 p-4 text-left transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-brand bg-brand-50"
                  : "border-border-default bg-surface-card hover:border-brand-300"
              }`}
            >
              <span className="text-2xl" aria-hidden="true">
                {option.icon}
              </span>
              <span className="text-base font-semibold text-content-primary">{option.title}</span>
              <span className="text-sm text-content-secondary">{option.description}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <p role="alert" className="text-sm font-medium text-status-error">
          {errorMsg}
        </p>
      )}

      <div className="flex items-center justify-end gap-2.5 border-t border-border-subtle pt-3">
        <Button type="button" variant="secondary" size="medium" onClick={onClose} disabled={isPending}>
          Hủy
        </Button>
        <Button
          type="button"
          variant="brand"
          size="medium"
          onClick={handleSubmit}
          disabled={!selectedRole || isExpired}
          isLoading={isPending}
        >
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}

export default GoogleRoleDialog;
