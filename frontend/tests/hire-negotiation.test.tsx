import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NegotiationPanel } from "@/components/hiring/NegotiationPanel";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import type { HireDetail } from "@/lib/api/hire-requests";
import { ApiError } from "@/lib/api/http";

const mutate = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/use-hire-requests", () => ({
  useProposeHireRequest: () => ({ mutateAsync: mutate, isPending: false }),
}));
const terms = {
  startDate: "2099-01-01",
  sessionsPerWeek: 1,
  durationMinutes: 60,
  teachingMode: "ONLINE",
  priceVnd: 150000,
  schedules: [{ dayOfWeek: 1, startTime: "18:00", endTime: "20:00" }],
};
const detail: HireDetail = {
  id: "request",
  version: "v1",
  status: "NEGOTIATING",
  createdAt: "2026-10-29T00:00:00Z",
  learner: { id: "learner", displayName: "Học viên" },
  tutor: { id: "tutor", displayName: "Gia sư" },
  initialTerms: terms,
  currentTerms: terms,
  finalAgreement: null,
  proposals: [],
  history: [],
  conversationId: "conversation",
  allowedActions: ["propose"],
};
const send = () =>
  fireEvent.click(screen.getByRole("button", { name: "Gửi đề xuất" }));

describe("negotiation", () => {
  beforeEach(() => {
    mutate.mockReset();
    mutate.mockResolvedValue({
      id: "request",
      version: "v2",
      status: "NEGOTIATING",
    });
  });
  it("requires a changed term and omits inherited fields", async () => {
    render(<NegotiationPanel detail={detail} onRefresh={vi.fn()} />);
    send();
    expect(screen.getByRole("alert")).toHaveTextContent("Cần thay đổi");
    expect(mutate).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Giá thương lượng (VND/buổi)"), {
      target: { value: "170000" },
    });
    send();
    await screen.findByText("Đã gửi đề xuất.");
    expect(mutate).toHaveBeenCalledWith({
      expectedVersion: "v1",
      priceVnd: 170000,
    });
  });
  it("preserves price and note on conflict; refresh never automatically resubmits", async () => {
    mutate.mockRejectedValueOnce(
      new ApiError(409, "Conflict", undefined, null, "/hire-requests")
    );
    const refresh = vi.fn().mockResolvedValue({ ...detail, version: "v2" });
    const { rerender } = render(
      <NegotiationPanel detail={detail} onRefresh={refresh} />
    );
    fireEvent.change(screen.getByLabelText("Giá thương lượng (VND/buổi)"), {
      target: { value: "170000" },
    });
    fireEvent.change(screen.getByLabelText("Ghi chú đề xuất"), {
      target: { value: "Giữ bản nháp" },
    });
    send();
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "Gửi đề xuất" })).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Làm mới để kiểm tra đề xuất" })
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Gửi đề xuất" })).toBeEnabled()
    );
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Ghi chú đề xuất")).toHaveValue(
      "Giữ bản nháp"
    );
    expect(screen.getByLabelText("Giá thương lượng (VND/buổi)")).toHaveValue(
      170000
    );
    rerender(
      <NegotiationPanel
        detail={{ ...detail, version: "v2" }}
        onRefresh={refresh}
      />
    );
    send();
    await screen.findByText("Đã gửi đề xuất.");
    expect(mutate).toHaveBeenLastCalledWith({
      expectedVersion: "v2",
      priceVnd: 170000,
      note: "Giữ bản nháp",
    });
  });
  it("retains schedule edits on a network failure", async () => {
    mutate.mockRejectedValue(new Error("Network"));
    render(<NegotiationPanel detail={detail} onRefresh={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Đề xuất lịch mới"));
    fireEvent.change(screen.getByLabelText("Giờ bắt đầu 1"), {
      target: { value: "19:00" },
    });
    send();
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Giờ bắt đầu 1")).toHaveValue("19:00");
    expect(mutate).toHaveBeenCalledWith({
      expectedVersion: "v1",
      schedules: [{ dayOfWeek: 1, startTime: "19:00", endTime: "20:00" }],
    });
  });
  it("blocks stale draft versions after background refresh", () => {
    const { rerender } = render(
      <NegotiationPanel detail={detail} onRefresh={vi.fn()} />
    );
    fireEvent.change(screen.getByLabelText("Giá thương lượng (VND/buổi)"), {
      target: { value: "170000" },
    });
    rerender(
      <NegotiationPanel
        detail={{ ...detail, version: "v2" }}
        onRefresh={vi.fn()}
      />
    );
    send();
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Điều khoản đã thay đổi"
    );
  });
  it("renders ordered proposal snapshots and only exposes server-authorized acceptance", () => {
    const proposed = {
      ...detail,
      proposals: [
        {
          sequence: 1,
          senderId: "tutor",
          terms: { ...terms, priceVnd: 170000 },
          note: "Đề xuất đầu",
          createdAt: detail.createdAt,
        },
        {
          sequence: 2,
          senderId: "learner",
          terms: { ...terms, priceVnd: 160000 },
          note: "Đề xuất sau",
          createdAt: detail.createdAt,
        },
      ],
    };
    const props = { onRefresh: vi.fn(), onAccept: vi.fn() };
    const { rerender } = render(
      <HireRequestDetail detail={proposed} {...props} />
    );
    expect(
      screen.getByRole("list", { name: "Lịch sử đề xuất" }).textContent
    ).toMatch(/Đề xuất #1.*Đề xuất #2/);
    expect(
      screen.queryByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
    ).not.toBeInTheDocument();
    rerender(
      <HireRequestDetail
        detail={{ ...proposed, allowedActions: ["accept", "propose"] }}
        {...props}
      />
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Chấp nhận đề xuất mới nhất" })
    );
    expect(props.onAccept).toHaveBeenCalledOnce();
  });
});
