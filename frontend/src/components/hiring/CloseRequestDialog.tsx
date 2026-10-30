"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TextArea } from "@/components/ui/text-area";

export interface CloseRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: "cancel" | "complete" | null;
  isAccepted: boolean;
  onConfirm: (payload: { confirmed: true; reason?: string }) => void | Promise<void>;
  isLoading?: boolean;
  externalError?: string | null;
}

export function CloseRequestDialog({
  isOpen,
  onClose,
  action,
  isAccepted,
  onConfirm,
  isLoading = false,
  externalError = null,
}: CloseRequestDialogProps) {
  if (!isOpen || !action) return null;

  return (
    <CloseRequestDialogContent
      key={`${action}:${isAccepted}`}
      isOpen={isOpen}
      onClose={onClose}
      action={action}
      isAccepted={isAccepted}
      onConfirm={onConfirm}
      isLoading={isLoading}
      externalError={externalError}
    />
  );
}

function CloseRequestDialogContent({
  isOpen,
  onClose,
  action,
  isAccepted,
  onConfirm,
  isLoading,
  externalError,
}: Omit<CloseRequestDialogProps, "action"> & { action: "cancel" | "complete" }) {
  const [confirmed, setConfirmed] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(null);

  const isCancel = action === "cancel";
  const requiresReason = isCancel && isAccepted;

  const title = isCancel
    ? isAccepted
      ? "Xác nhận hủy yêu cầu đã đồng ý"
      : "Xác nhận hủy yêu cầu thuê gia sư"
    : "Xác nhận hoàn tất việc học";

  const description = isCancel
    ? isAccepted
      ? "Yêu cầu đã được thống nhất trước đó. Việc hủy sau khi đồng ý sẽ thông báo đến bên còn lại và yêu cầu cung cấp lý do cụ thể."
      : "Bạn có chắc chắn muốn hủy yêu cầu thuê gia sư này? Thao tác này sẽ kết thúc quá trình gửi yêu cầu."
    : "Xác nhận rằng toàn bộ các buổi học theo thỏa thuận thuê gia sư này đã được thực hiện và kết thúc hoàn tất.";

  const checkboxLabel = isCancel
    ? isAccepted
      ? "Tôi xác nhận muốn hủy thỏa thuận đã chốt này và chịu trách nhiệm về lý do cung cấp."
      : "Tôi xác nhận muốn hủy yêu cầu này."
    : "Tôi xác nhận việc học đã kết thúc hoàn tất theo đúng thỏa thuận.";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmed) {
      setValidationError("Bạn cần chọn xác nhận để tiếp tục.");
      return;
    }

    const trimmed = reason.trim();
    if (requiresReason) {
      if (!trimmed) {
        setValidationError("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.");
        return;
      }
      if (trimmed.length > 1000) {
        setValidationError("Lý do không được vượt quá 1000 ký tự.");
        return;
      }
    } else if (trimmed.length > 1000) {
      setValidationError("Lý do không được vượt quá 1000 ký tự.");
      return;
    }

    setValidationError(null);
    onConfirm({
      confirmed: true,
      reason: trimmed ? trimmed : undefined,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={title}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <p className="text-sm text-content-secondary">{description}</p>

        {(validationError || externalError) && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium"
          >
            {validationError || externalError}
          </div>
        )}

        {(requiresReason || (!isAccepted && isCancel) || !isCancel) && (
          <TextArea
            label={requiresReason ? "Lý do hủy (bắt buộc)" : "Lý do / Ghi chú (không bắt buộc)"}
            placeholder={
              requiresReason
                ? "Nhập lý do hủy thỏa thuận để đối phương nắm thông tin (1–1000 ký tự)..."
                : "Nhập ghi chú hoặc lý do nếu cần..."
            }
            rows={3}
            maxLength={1000}
            showCount
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (validationError) setValidationError(null);
            }}
          />
        )}

        <div className="pt-2">
          <Checkbox
            id="close-action-confirmed"
            checked={confirmed}
            onChange={(checked) => {
              setConfirmed(checked);
              if (validationError?.includes("xác nhận")) setValidationError(null);
            }}
            label={<span className="text-sm font-medium text-content-primary">{checkboxLabel}</span>}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant={isCancel ? "danger" : "success"}
            size="small"
            isLoading={isLoading}
            disabled={isLoading || !confirmed}
          >
            {isCancel ? "Xác nhận hủy" : "Xác nhận hoàn tất"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
