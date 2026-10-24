import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { TutorReviewsPanel } from "@/components/admin/TutorReviews";
import { TutorReviewHistory } from "@/components/profile/TutorReviewHistory";
import {
  getReviewQueue,
  getReviewDetail,
  decideReview,
  getReviewHistory,
  type ReviewDetail,
} from "@/lib/api/tutor-reviews";
import { ApiError } from "@/lib/api/http";
vi.mock("@/lib/api/tutor-reviews", () => ({
  getReviewQueue: vi.fn(),
  getReviewDetail: vi.fn(),
  decideReview: vi.fn(),
  getReviewHistory: vi.fn(),
}));
const detail = {
  id: "tutor",
  accountStatus: "ACTIVE",
  history: [],
  profile: {
    version: "current-version",
    status: "PENDING_REVIEW",
    about: {
      fullName: "Gia sư A",
      subjects: ["Toán"],
      teachingLevels: ["THPT"],
    },
    education: { degree: "Cử nhân" },
    description: { bio: "Giới thiệu", experienceYears: 3 },
    pricing: { sessionRateVnd: 150000 },
    discovery: { teachingModes: ["ONLINE"] },
  },
} as unknown as ReviewDetail;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getReviewQueue).mockResolvedValue({
    items: [
      {
        id: "tutor",
        displayName: "Gia sư A",
        accountStatus: "ACTIVE",
        version: "current-version",
        submittedAt: null,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(getReviewDetail).mockResolvedValue(detail);
  vi.mocked(getReviewHistory).mockResolvedValue([]);
});
function view(owner = false) {
  render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      {owner ? (
        <TutorReviewHistory accountId="owner" />
      ) : (
        <TutorReviewsPanel accountId="admin" />
      )}
    </QueryClientProvider>
  );
}
async function open() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Xem hồ sơ Gia sư A" })
  );
  await screen.findByRole("button", { name: "Yêu cầu sửa" });
}
it("requires a reason and sends the displayed version with request changes", async () => {
  vi.mocked(decideReview).mockResolvedValue({
    status: "DRAFT",
    version: "new",
  });
  view();
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu sửa" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("nhập lý do");
  expect(decideReview).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Lý do / ghi chú duyệt"), {
    target: { value: "Bổ sung trình độ" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Yêu cầu sửa" }));
  await waitFor(() =>
    expect(decideReview).toHaveBeenCalledWith("tutor", {
      expectedVersion: "current-version",
      action: "REQUEST_CHANGES",
      note: "Bổ sung trình độ",
    })
  );
});
it("blocks another decision after a stale-version conflict until reload", async () => {
  vi.mocked(decideReview).mockRejectedValue(
    new ApiError(409, "Conflict", undefined, null, "/review")
  );
  view();
  await open();
  fireEvent.click(screen.getByRole("button", { name: "Phê duyệt" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Hồ sơ đã thay đổi"
  );
  expect(screen.getByRole("button", { name: "Phê duyệt" })).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Tải lại hồ sơ" }));
  await waitFor(() => expect(getReviewDetail).toHaveBeenCalledTimes(2));
});
it("shows empty queue", async () => {
  vi.mocked(getReviewQueue).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
  });
  view();
  expect(
    await screen.findByText(/Không có hồ sơ chờ duyệt/)
  ).toBeInTheDocument();
});
it("offers retry when queue loading fails", async () => {
  vi.mocked(getReviewQueue).mockRejectedValue(new Error("Offline"));
  view();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Không thể tải hàng đợi"
  );
  expect(
    screen.getByRole("button", { name: "Thử lại hàng đợi" })
  ).toBeInTheDocument();
});
it("shows the owner's latest request-changes reason", async () => {
  vi.mocked(getReviewHistory).mockResolvedValue([
    {
      id: "r",
      reviewerId: "a",
      action: "REQUEST_CHANGES",
      reviewedVersion: "v",
      fromStatus: "PENDING_REVIEW",
      toStatus: "DRAFT",
      note: "Bổ sung bằng cấp",
      reviewedAt: "2026-10-21T00:00:00Z",
    },
  ]);
  view(true);
  expect(await screen.findByText("Bổ sung bằng cấp")).toBeInTheDocument();
  expect(screen.getByText("Yêu cầu chỉnh sửa")).toBeInTheDocument();
});
