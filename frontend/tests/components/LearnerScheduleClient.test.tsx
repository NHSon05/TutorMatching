import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { LearnerScheduleClient } from "@/components/learner/LearnerScheduleClient";
import {
  getHireRequest,
  listHireRequests,
  type HireDetail,
} from "@/lib/api/hire-requests";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
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

function hire(
  id: string,
  tutorName: string,
  schedules: HireDetail["currentTerms"]["schedules"],
  paymentStatus: string
) {
  const terms = {
    startDate: "2026-11-20",
    sessionsPerWeek: schedules.length,
    durationMinutes: 90,
    teachingMode: "ONLINE",
    priceVnd: 200000,
    schedules,
  };
  return {
    summary: {
      id,
      version: "v1",
      status: "ACCEPTED",
      learner: { id: "learner-1", displayName: "Học viên" },
      tutor: { id: `${id}-tutor`, displayName: tutorName },
      createdAt: "2026-11-01T00:00:00Z",
    },
    detail: {
      id,
      version: "v1",
      status: "ACCEPTED",
      learner: { id: "learner-1", displayName: "Học viên" },
      tutor: { id: `${id}-tutor`, displayName: tutorName },
      createdAt: "2026-11-01T00:00:00Z",
      initialTerms: terms,
      currentTerms: terms,
      finalAgreement: {
        terms,
        acceptedBy: `${id}-tutor`,
        acceptedAt: "2026-11-02T00:00:00Z",
      },
      proposals: [],
      history: [],
      conversationId: `${id}-conv`,
      allowedActions: [],
      paymentStatus,
    } as HireDetail,
  };
}

function view() {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LearnerScheduleClient />
    </QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

it("builds the weekly timetable from in-progress hires", async () => {
  const an = hire(
    "hire-1",
    "Nguyễn An",
    [
      { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
      { dayOfWeek: 7, startTime: "06:00", endTime: "07:00" },
    ],
    "PAID"
  );
  const binh = hire(
    "hire-2",
    "Trần Bình",
    [{ dayOfWeek: 3, startTime: "19:00", endTime: "20:30" }],
    "UNPAID"
  );
  vi.mocked(listHireRequests).mockResolvedValue({
    items: [an.summary, binh.summary],
    nextCursor: null,
  });
  vi.mocked(getHireRequest).mockImplementation(async (id) =>
    id === "hire-1" ? an.detail : binh.detail
  );
  view();

  const agenda = await screen.findByRole("list", { name: "Lịch học theo ngày" });
  expect(vi.mocked(listHireRequests).mock.calls[0][0]).toEqual({
    status: "ACCEPTED",
    pageSize: 100,
  });
  // Agenda lists days Monday-first and links each lesson to its hire request.
  const days = within(agenda)
    .getAllByRole("heading", { level: 2 })
    .map((h) => h.textContent);
  expect(days).toEqual(["Thứ 2", "Thứ 4", "Chủ nhật"]);
  expect(
    within(agenda).getByRole("link", { name: /18:00 – 19:30/ })
  ).toHaveAttribute("href", "/learner/requests/hire-1");
  expect(
    within(agenda).getByRole("link", { name: /19:00 – 20:30.*Chưa thanh toán/ })
  ).toHaveAttribute("href", "/learner/requests/hire-2");

  // Early lesson (06:00) widens the calendar instead of being hidden.
  expect(screen.getByText("06:00")).toBeInTheDocument();
  // Clicking a calendar lesson opens its hire request.
  fireEvent.click(screen.getAllByText("GS. Trần Bình")[0]);
  expect(push).toHaveBeenCalledWith("/learner/requests/hire-2");
});

it("shows an empty state when there are no in-progress hires", async () => {
  vi.mocked(listHireRequests).mockResolvedValue({ items: [], nextCursor: null });
  view();

  expect(await screen.findByText("Bạn chưa có lịch học nào")).toBeInTheDocument();
  expect(getHireRequest).not.toHaveBeenCalled();
});

it("offers a retry when the hire list fails", async () => {
  vi.mocked(listHireRequests).mockRejectedValue(new Error("network"));
  view();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Không thể tải thời khóa biểu của bạn."
  );
});
