"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HirePaymentDto } from "@/lib/api/hire-requests";

export interface PaymentCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payment: HirePaymentDto | null;
  onConfirmPayment: (paymentId: string) => void | Promise<void>;
  isConfirming?: boolean;
  errorMessage?: string | null;
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function PaymentCheckoutDialog({
  isOpen,
  onClose,
  payment,
  onConfirmPayment,
  isConfirming = false,
  errorMessage = null,
}: PaymentCheckoutDialogProps) {
  if (!isOpen || !payment) return null;

  const isPaid = payment.status === "PAID";

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isConfirming ? () => {} : onClose}
      title="Thanh toán học phí VietQR"
      description="Quét mã QR hoặc chuyển khoản đúng nội dung tham chiếu bên dưới để thanh toán gói học."
      maxWidth="md"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 border border-border-default">
          <img
            src={payment.qrPayload}
            alt={`Mã VietQR cho nội dung ${payment.transferReference}`}
            className="w-48 h-48 object-contain rounded-xl border border-gray-200 bg-white p-2"
          />
          <div className="mt-3 flex items-center gap-2">
            <Badge
              variant={isPaid ? "success" : "warning"}
              appearance="solid"
              shape="pill"
            >
              {isPaid ? "Đã thanh toán" : "Chờ xác nhận thanh toán"}
            </Badge>
            <span className="text-xs text-content-secondary">
              ({payment.providerCode})
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border-default bg-surface-card p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-content-secondary">Đơn giá mỗi buổi:</span>
            <span className="font-medium text-content-primary">
              {formatVnd(payment.unitPriceVnd)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-content-secondary">Số buổi thanh toán:</span>
            <span className="font-medium text-content-primary">
              {payment.billingSessions} buổi
            </span>
          </div>
          <div className="flex justify-between border-t border-border-default pt-2">
            <span className="font-semibold text-content-primary">
              Tổng số tiền:
            </span>
            <span
              data-testid="payment-amount-vnd"
              className="font-bold text-lg text-brand"
            >
              {formatVnd(payment.amountVnd)}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-content-secondary">Nội dung chuyển khoản:</span>
            <code
              data-testid="payment-transfer-ref"
              className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs"
            >
              {payment.transferReference}
            </code>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onClose}
            disabled={isConfirming}
          >
            Đóng
          </Button>
          {!isPaid && (
            <Button
              type="button"
              variant="success"
              size="small"
              isLoading={isConfirming}
              disabled={isConfirming}
              onClick={() => void onConfirmPayment(payment.id)}
            >
              Xác nhận đã chuyển khoản (Sandbox)
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
export default PaymentCheckoutDialog;
