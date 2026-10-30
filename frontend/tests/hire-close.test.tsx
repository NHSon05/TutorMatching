import { screen, fireEvent, render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CloseRequestDialog } from "@/components/hiring/CloseRequestDialog";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import type { HireDetail } from "@/lib/api/hire-requests";

const baseAcceptedDetail: HireDetail = {
  id: "req-accepted-1",
  version: "v-accepted-1",
  status: "ACCEPTED",
  createdAt: "2026-10-29T10:00:00Z",
  learner: { id: "user-learner", displayName: "Lê Học Viên" },
  tutor: { id: "user-tutor", displayName: "Phạm Gia Sư" },
  initialTerms: {
    startDate: "2026-11-10",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 200000,
    schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
  },
  currentTerms: {
    startDate: "2026-11-10",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 200000,
    schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
  },
  finalAgreement: {
    terms: {
      startDate: "2026-11-10",
      sessionsPerWeek: 2,
      durationMinutes: 90,
      teachingMode: "ONLINE",
      priceVnd: 200000,
      schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
    },
    acceptedBy: "user-tutor",
    acceptedAt: "2026-10-29T11:00:00Z",
  },
  proposals: [],
  history: [
    {
      sequence: 1,
      actorId: "user-learner",
      fromStatus: null,
      toStatus: "PENDING",
      createdAt: "2026-10-29T10:00:00Z",
    },
    {
      sequence: 2,
      actorId: "user-tutor",
      fromStatus: "PENDING",
      toStatus: "ACCEPTED",
      createdAt: "2026-10-29T11:00:00Z",
    },
  ],
  conversationId: "conv-1",
  allowedActions: ["cancel", "complete"],
};

describe("CloseRequestDialog & Terminal Controls (T042)", () => {
  it("renders cancel dialog and handles dismissed confirmation", () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    const { rerender } = render(
      <CloseRequestDialog
        isOpen={true}
        onClose={handleClose}
        action="cancel"
        isAccepted={false}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText("Xác nhận hủy yêu cầu thuê gia sư")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận hủy" })).toBeDisabled();

    // Click "Hủy bỏ" to dismiss dialog
    fireEvent.click(screen.getByRole("button", { name: "Hủy bỏ" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();

    // Rerender as closed
    rerender(
      <CloseRequestDialog
        isOpen={false}
        onClose={handleClose}
        action="cancel"
        isAccepted={false}
        onConfirm={handleConfirm}
      />
    );
    expect(screen.queryByText("Xác nhận hủy yêu cầu thuê gia sư")).not.toBeInTheDocument();
  });

  it("enforces required reason for cancelling an ACCEPTED request", async () => {
    const handleConfirm = vi.fn();

    render(
      <CloseRequestDialog
        isOpen={true}
        onClose={vi.fn()}
        action="cancel"
        isAccepted={true}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText("Xác nhận hủy yêu cầu đã đồng ý")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const submitBtn = screen.getByRole("button", { name: "Xác nhận hủy" });
    expect(submitBtn).toBeEnabled();

    // Submitting without reason should trigger validation error
    fireEvent.click(submitBtn);
    expect(
      screen.getByText("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.")
    ).toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();

    // Enter only whitespace
    const textarea = screen.getByRole("textbox", { name: /Lý do hủy/ });
    fireEvent.change(textarea, { target: { value: "     " } });
    fireEvent.click(submitBtn);
    expect(
      screen.getByText("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.")
    ).toBeInTheDocument();
    expect(handleConfirm).not.toHaveBeenCalled();

    // Enter valid reason and submit
    fireEvent.change(textarea, { target: { value: "Bận đột xuất không thể tiếp tục lịch học" } });
    fireEvent.click(submitBtn);
    expect(handleConfirm).toHaveBeenCalledWith({
      confirmed: true,
      reason: "Bận đột xuất không thể tiếp tục lịch học",
    });
  });

  it("permits completing an ACCEPTED request with explicit confirmation and optional reason", () => {
    const handleConfirm = vi.fn();

    render(
      <CloseRequestDialog
        isOpen={true}
        onClose={vi.fn()}
        action="complete"
        isAccepted={true}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByText("Xác nhận hoàn tất việc học")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận hoàn tất" })).toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const submitBtn = screen.getByRole("button", { name: "Xác nhận hoàn tất" });
    expect(submitBtn).toBeEnabled();

    // Submit with optional reason
    const textarea = screen.getByRole("textbox", { name: /Lý do \/ Ghi chú/ });
    fireEvent.change(textarea, { target: { value: "Khóa học kết thúc thành công tốt đẹp." } });
    fireEvent.click(submitBtn);

    expect(handleConfirm).toHaveBeenCalledWith({
      confirmed: true,
      reason: "Khóa học kết thúc thành công tốt đẹp.",
    });
  });

  it("displays loading and conflict recovery states in HireRequestDetail", () => {
    const handleRefresh = vi.fn();

    const { rerender } = render(
      <HireRequestDetail
        detail={baseAcceptedDetail}
        onRefresh={handleRefresh}
        isCancelling={true}
        isConflict={false}
      />
    );

    expect(screen.getByRole("button", { name: "Hủy yêu cầu..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hoàn tất việc học..." })).toBeDisabled();

    // Rerender in conflict state
    rerender(
      <HireRequestDetail
        detail={baseAcceptedDetail}
        onRefresh={handleRefresh}
        isCancelling={false}
        isConflict={true}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Dữ liệu yêu cầu đã được cập nhật bởi thao tác khác."
    );

    const refreshBtn = screen.getByRole("button", { name: "Làm mới ngay" });
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();
  });

  it("hides close action buttons on terminal states", () => {
    const terminalDetail: HireDetail = {
      ...baseAcceptedDetail,
      status: "COMPLETED",
      allowedActions: [],
    };

    render(<HireRequestDetail detail={terminalDetail} />);

    expect(screen.queryByRole("button", { name: "Hủy yêu cầu..." })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hoàn tất việc học..." })).not.toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveTextContent(
      "Đã hoàn thành"
    );
  });
});
