import { screen, fireEvent, render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import type { HireDetail } from "@/lib/api/hire-requests";

const sampleDetail: HireDetail = {
  id: "req-123",
  version: "v-1",
  status: "PENDING",
  createdAt: "2026-10-29T10:00:00Z",
  learner: { id: "user-learner", displayName: "Nguyễn Học Viên" },
  tutor: { id: "user-tutor", displayName: "Trần Gia Sư" },
  initialTerms: {
    startDate: "2026-11-10",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 200000,
    schedules: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "19:30" },
    ],
  },
  currentTerms: {
    startDate: "2026-11-10",
    sessionsPerWeek: 2,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 200000,
    schedules: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "19:30" },
    ],
  },
  finalAgreement: null,
  proposals: [],
  history: [
    {
      sequence: 1,
      actorId: "user-learner",
      fromStatus: null,
      toStatus: "PENDING",
      createdAt: "2026-10-29T10:00:00Z",
    },
  ],
  conversationId: "conv-456",
  allowedActions: ["accept", "reject"],
};

describe("HireRequestDetail component", () => {
  it("renders detail with participants, terms, and status badge", () => {
    render(<HireRequestDetail detail={sampleDetail} />);

    expect(screen.getByText("Nguyễn Học Viên")).toBeInTheDocument();
    expect(screen.getByText("Trần Gia Sư")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Trạng thái yêu cầu" })).toHaveTextContent("Chờ phản hồi");
    expect(screen.queryByText("Điều khoản ban đầu")).not.toBeInTheDocument();
    expect(screen.getByText(/200\.000 đ/)).toBeInTheDocument();
    expect(screen.getByText(/Thứ 2: 18:00 - 19:30/)).toBeInTheDocument();
    expect(screen.getByText(/Thứ 4: 18:00 - 19:30/)).toBeInTheDocument();
  });

  it("shows action buttons according to server allowedActions", () => {
    render(
      <HireRequestDetail
        detail={sampleDetail}
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Chấp nhận yêu cầu" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Từ chối yêu cầu..." })).toBeInTheDocument();
  });

  it("hides action buttons when allowedActions is empty", () => {
    const closedDetail: HireDetail = {
      ...sampleDetail,
      status: "ACCEPTED",
      allowedActions: [],
    };
    render(<HireRequestDetail detail={closedDetail} />);

    expect(screen.queryByRole("button", { name: "Chấp nhận yêu cầu" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Từ chối yêu cầu..." })).not.toBeInTheDocument();
  });

  it("calls onAccept when accept button is clicked", () => {
    const handleAccept = vi.fn();
    render(<HireRequestDetail detail={sampleDetail} onAccept={handleAccept} />);

    fireEvent.click(screen.getByRole("button", { name: "Chấp nhận yêu cầu" }));
    expect(handleAccept).toHaveBeenCalledTimes(1);
  });

  it("shows loading and disables buttons when isAccepting is true", () => {
    const handleAccept = vi.fn();
    render(
      <HireRequestDetail
        detail={sampleDetail}
        onAccept={handleAccept}
        isAccepting={true}
      />
    );

    const acceptBtn = screen.getByRole("button", { name: "Chấp nhận yêu cầu" });
    expect(acceptBtn).toBeDisabled();
  });

  it("validates rejection reason: shows error for blank or whitespace and does not call onReject", () => {
    const handleReject = vi.fn();
    render(<HireRequestDetail detail={sampleDetail} onReject={handleReject} />);

    // Open reject form
    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));

    const confirmBtn = screen.getByRole("button", { name: "Xác nhận từ chối" });
    fireEvent.click(confirmBtn);

    expect(
      screen.getByText("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.")
    ).toBeInTheDocument();
    expect(handleReject).not.toHaveBeenCalled();

    // Type only whitespace
    const textarea = screen.getByPlaceholderText(/Nhập lý do từ chối/);
    fireEvent.change(textarea, { target: { value: "   " } });
    fireEvent.click(confirmBtn);

    expect(
      screen.getByText("Nhập lý do từ 1 đến 1000 ký tự, không chỉ chứa khoảng trắng.")
    ).toBeInTheDocument();
    expect(handleReject).not.toHaveBeenCalled();
  });

  it("calls onReject with trimmed text when valid reason is entered", () => {
    const handleReject = vi.fn();
    render(<HireRequestDetail detail={sampleDetail} onReject={handleReject} />);

    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));
    const textarea = screen.getByPlaceholderText(/Nhập lý do từ chối/);
    fireEvent.change(textarea, { target: { value: "  Thời gian này tôi bận dạy lớp khác  " } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));

    expect(handleReject).toHaveBeenCalledWith("Thời gian này tôi bận dạy lớp khác");
  });

  it("handles version conflict: displays conflict banner, retains draft reason, and provides refresh", () => {
    const handleRefresh = vi.fn();
    let draft = "Đang soạn lý do dở dang";

    render(
      <HireRequestDetail
        detail={sampleDetail}
        isConflict={true}
        onRefresh={handleRefresh}
        reasonDraft={draft}
        onReasonDraftChange={(val) => {
          draft = val;
        }}
      />
    );

    // Conflict banner visible
    expect(
      screen.getByText(/Dữ liệu yêu cầu đã được cập nhật bởi thao tác khác/)
    ).toBeInTheDocument();

    // Refresh buttons available
    const refreshButtons = screen.getAllByRole("button", { name: /Làm mới/ });
    expect(refreshButtons.length).toBeGreaterThan(0);
    fireEvent.click(refreshButtons[0]);
    expect(handleRefresh).toHaveBeenCalled();

    // Reason form should retain the draft
    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));
    const textarea = screen.getByPlaceholderText(/Nhập lý do từ chối/) as HTMLTextAreaElement;
    expect(textarea.value).toBe("Đang soạn lý do dở dang");
  });

  it("renders status history with sequence and formatted status labels", () => {
    const historyDetail: HireDetail = {
      ...sampleDetail,
      history: [
        { sequence: 1, toStatus: "PENDING", fromStatus: null, createdAt: "2026-10-29T10:00:00Z" },
        { sequence: 2, toStatus: "REJECTED", fromStatus: "PENDING", reason: "Bận lịch", createdAt: "2026-10-29T11:00:00Z" },
      ],
    };
    render(<HireRequestDetail detail={historyDetail} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText(/Bận lịch/)).toBeInTheDocument();
  });
});
