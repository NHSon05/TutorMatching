import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { MyTutorsClient } from "@/components/learner/MyTutorsClient";
import {
  getHireRequest,
  listHireRequests,
  type HireDetail,
} from "@/lib/api/hire-requests";

vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    data: { id: "learner-1", role: "LEARNER", fullName: "Học viên" },
  }),
}));
vi.mock("@/lib/api/hire-requests", async (original) => ({
  ...(await original<typeof import("@/lib/api/hire-requests")>()),
  listHireRequests: vi.fn(),
  getHireRequest: vi.fn(),
}));

const terms = {
  startDate: "2026-11-20",
  sessionsPerWeek: 2,
  durationMinutes: 90,
  teachingMode: "ONLINE",
  priceVnd: 200000,
  schedules: [{ dayOfWeek: 2, startTime: "18:00", endTime: "19:30" }],
};
const detail = {
  id: "hire-1",
  version: "v1",
  status: "ACCEPTED",
  learner: { id: "learner-1", displayName: "Học viên" },
  tutor: { id: "tutor-user-1", displayName: "Nguyễn An" },
  createdAt: "2026-11-01T00:00:00Z",
  initialTerms: terms,
  currentTerms: terms,
  finalAgreement: {
    terms,
    acceptedBy: "tutor-user-1",
    acceptedAt: "2026-11-02T00:00:00Z",
  },
  proposals: [],
  history: [],
  conversationId: "conv-1",
  allowedActions: [],
  paymentStatus: "UNPAID",
} as HireDetail;

function view() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MyTutorsClient />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

it("lists only in-progress (accepted) hires with agreed terms and actions", async () => {
  vi.mocked(listHireRequests).mockResolvedValue({
    items: [
      {
        id: "hire-1",
        version: "v1",
        status: "ACCEPTED",
        learner: detail.learner,
        tutor: detail.tutor,
        createdAt: detail.createdAt,
      },
    ],
    nextCursor: null,
  });
  vi.mocked(getHireRequest).mockResolvedValue(detail);
  view();

  expect(await screen.findByText("Nguyễn An")).toBeInTheDocument();
  expect(vi.mocked(listHireRequests).mock.calls[0][0]).toEqual({
    status: "ACCEPTED",
    pageSize: 100,
  });
  expect(await screen.findByText("2 buổi/tuần · 90 phút/buổi")).toBeInTheDocument();
  expect(screen.getByText("20/11/2026")).toBeInTheDocument();
  expect(screen.getByText("Thứ 3 18:00–19:30")).toBeInTheDocument();
  expect(screen.getByText("Chưa thanh toán")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Nhắn tin" })).toHaveAttribute(
    "href",
    "/messages?conversationId=conv-1"
  );
  expect(screen.getByRole("link", { name: "Xem chi tiết" })).toHaveAttribute(
    "href",
    "/learner/requests/hire-1"
  );
});

it("shows an empty state when no tutor is currently teaching", async () => {
  vi.mocked(listHireRequests).mockResolvedValue({ items: [], nextCursor: null });
  view();

  expect(
    await screen.findByText("Bạn chưa có gia sư nào đang dạy")
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Tìm gia sư" })).toHaveAttribute(
    "href",
    "/tutors"
  );
  expect(getHireRequest).not.toHaveBeenCalled();
});

it("offers a retry when the list fails to load", async () => {
  vi.mocked(listHireRequests).mockRejectedValue(new Error("network"));
  view();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Không thể tải danh sách gia sư của bạn."
  );
  expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
});
