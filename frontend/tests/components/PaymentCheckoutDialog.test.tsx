import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaymentCheckoutDialog } from "@/components/hiring/PaymentCheckoutDialog";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import type { HireDetail, HirePaymentDto } from "@/lib/api/hire-requests";

const samplePayment: HirePaymentDto = {
  id: "pay-1",
  hireRequestId: "req-1",
  unitPriceVnd: 150000,
  billingSessions: 8,
  amountVnd: 1200000,
  providerCode: "VIETQR_SANDBOX",
  transferReference: "TM 1234ABCD",
  qrPayload: "https://img.vietqr.io/image/MB-0000123456789-compact2.png?amount=1200000&addInfo=TM%201234ABCD",
  status: "PENDING",
  createdAt: "2026-11-08T10:00:00Z",
};

const acceptedUnpaidDetail: HireDetail = {
  id: "req-1",
  version: "ver-1",
  status: "ACCEPTED",
  learner: { id: "learner-1", displayName: "Học viên Minh" },
  tutor: { id: "tutor-1", displayName: "Gia sư Lan" },
  createdAt: "2026-11-08T09:00:00Z",
  initialTerms: {
    startDate: "2026-11-15",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 150000,
    schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
  },
  currentTerms: {
    startDate: "2026-11-15",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 150000,
    schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
  },
  proposals: [],
  history: [],
  conversationId: "conv-1",
  // Mirrors the backend: "complete" is withheld until the request is paid.
  allowedActions: ["pay", "cancel"],
  paymentStatus: "UNPAID",
  latestPayment: null,
};

describe("PaymentCheckoutDialog & HireRequestDetail payment gate", () => {
  it("renders VietQR details and triggers sandbox confirmation", async () => {
    const onConfirmPayment = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <PaymentCheckoutDialog
        isOpen={true}
        onClose={onClose}
        payment={samplePayment}
        onConfirmPayment={onConfirmPayment}
      />
    );

    expect(screen.getByText("Thanh toán học phí VietQR")).toBeInTheDocument();
    expect(screen.getByTestId("payment-transfer-ref")).toHaveTextContent(
      "TM 1234ABCD"
    );
    expect(screen.getByTestId("payment-amount-vnd")).toHaveTextContent(
      "1.200.000 đ"
    );
    expect(screen.getByText("8 buổi")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", {
      name: /Xác nhận đã chuyển khoản \(Sandbox\)/i,
    });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(onConfirmPayment).toHaveBeenCalledWith("pay-1");
    });
  });

  it("disables complete button while paymentStatus is UNPAID and initiates payment when clicked", async () => {
    const onInitiatePayment = vi.fn().mockResolvedValue(samplePayment);
    const onConfirmPayment = vi.fn().mockResolvedValue(undefined);

    render(
      <HireRequestDetail
        detail={acceptedUnpaidDetail}
        onInitiatePayment={onInitiatePayment}
        onConfirmPayment={onConfirmPayment}
      />
    );

    const completeBtn = screen.getByRole("button", {
      name: "Hoàn tất việc học...",
    });
    expect(completeBtn).toBeDisabled();
    expect(
      screen.getByText(/Cần thanh toán học phí \(trạng thái Đã thanh toán\)/i)
    ).toBeInTheDocument();

    const payBtn = screen.getByRole("button", {
      name: "Thanh toán học phí (VietQR)",
    });
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(onInitiatePayment).toHaveBeenCalledTimes(1);
    });

    expect(
      await screen.findByText("Thanh toán học phí VietQR")
    ).toBeInTheDocument();
  });
});
