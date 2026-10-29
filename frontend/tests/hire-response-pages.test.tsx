import { Suspense } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TutorRequestsPage from "@/app/(tutor)/tutor/requests/page";
import TutorRequestDetailPage from "@/app/(tutor)/tutor/requests/[id]/page";
import { ApiError } from "@/lib/api/http";

const mocks = vi.hoisted(() => ({
  list: vi.fn(), detail: vi.fn(), accept: vi.fn(), reject: vi.fn(), refresh: vi.fn(),
  account: { id: "tutor-1" },
}));
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ data: mocks.account }) }));
vi.mock("@/hooks/use-hire-requests", () => ({
  useHireRequests: (params: unknown) => mocks.list(params),
  useHireRequestDetail: () => mocks.detail(),
  useAcceptHireRequest: () => ({ mutateAsync: mocks.accept, isPending: false }),
  useRejectHireRequest: () => ({ mutateAsync: mocks.reject, isPending: false }),
}));

const terms = { startDate: "2030-01-01", sessionsPerWeek: 1, durationMinutes: 60,
  teachingMode: "ONLINE", priceVnd: 150000,
  schedules: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }] };
const detail = { id: "request-1", version: "v1", status: "PENDING",
  learner: { id: "learner", displayName: "Học viên" }, tutor: { id: "tutor", displayName: "Gia sư" },
  initialTerms: terms, currentTerms: terms, finalAgreement: null, proposals: [], history: [],
  allowedActions: ["accept", "reject"] };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.account = { id: "tutor-1" };
  mocks.refresh.mockResolvedValue({ isError: false });
  mocks.detail.mockReturnValue({ data: detail, isLoading: false, refetch: mocks.refresh });
});

describe("Tutor request pages", () => {
  it("returns to previous and first pages even after an empty page", () => {
    mocks.list.mockImplementation(({ cursor }) => ({
      data: { items: cursor === "page3" ? [] : [{ ...detail, createdAt: "2030-01-01" }],
        nextCursor: cursor === undefined ? "page2" : cursor === "page2" ? "page3" : null },
      refetch: mocks.refresh,
    }));
    render(<TutorRequestsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Tải trang tiếp theo" }));
    expect(mocks.list).toHaveBeenLastCalledWith({ cursor: "page2" });
    fireEvent.click(screen.getByRole("button", { name: "Tải trang tiếp theo" }));
    expect(mocks.list).toHaveBeenLastCalledWith({ cursor: "page3" });
    fireEvent.click(screen.getByRole("button", { name: "Trang trước" }));
    expect(mocks.list).toHaveBeenLastCalledWith({ cursor: "page2" });
    fireEvent.click(screen.getByRole("button", { name: "Về trang đầu" }));
    expect(mocks.list).toHaveBeenLastCalledWith({ cursor: undefined });
  });

  it("retains draft after actual ApiError 409 and failed refresh without resubmitting", async () => {
    mocks.reject.mockRejectedValue(new ApiError(409, "Conflict", undefined, null, "/hire-requests"));
    const params = Promise.resolve({ id: "request-1" });
    await act(async () => { render(<Suspense><TutorRequestDetailPage params={params} /></Suspense>); });
    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Bận lịch" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));
    await screen.findByText("Dữ liệu yêu cầu đã được cập nhật bởi thao tác khác.");
    mocks.refresh.mockResolvedValueOnce({ isError: true });
    fireEvent.click(screen.getByRole("button", { name: "Làm mới ngay" }));
    await screen.findByText("Không thể làm mới dữ liệu. Nội dung đang nhập đã được giữ lại.");
    expect(screen.getByRole("textbox")).toHaveValue("Bận lịch");
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận từ chối" }));
    expect(mocks.reject).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Làm mới ngay" }));
    await waitFor(() => expect(screen.queryByText("Dữ liệu yêu cầu đã được cập nhật bởi thao tác khác.")).not.toBeInTheDocument());
    expect(screen.getByRole("textbox")).toHaveValue("Bận lịch");
    expect(mocks.reject).toHaveBeenCalledTimes(1);
  });

  it("clears private drafts when the account changes", async () => {
    const params = Promise.resolve({ id: "request-1" });
    const view = await act(async () => render(<Suspense><TutorRequestDetailPage params={params} /></Suspense>));
    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Private draft" } });
    mocks.account = { id: "tutor-2" };
    view.rerender(<Suspense><TutorRequestDetailPage params={params} /></Suspense>);
    fireEvent.click(screen.getByRole("button", { name: "Từ chối yêu cầu..." }));
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
