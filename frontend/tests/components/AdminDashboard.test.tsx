import { screen, waitFor, within } from "@testing-library/react";
import { render } from "../query-wrapper";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminDashboardPage from "@/app/(admin)/admin/dashboard/page";
import * as tutorReviewsApi from "@/lib/api/tutor-reviews";
import * as dashboardApi from "@/lib/api/admin-dashboard";
import type { DashboardSnapshot } from "@/lib/api/admin-dashboard";

const snapshot: DashboardSnapshot = {
  asOf: "2026-11-14T03:00:00Z",
  usersByRole: { LEARNER: 980, TUTOR: 266, ADMIN: 2 },
  tutorProfilesByStatus: {
    DRAFT: 3,
    PENDING_REVIEW: 1,
    APPROVED: 250,
    REJECTED: 0,
  },
  hireRequestsByStatus: {
    PENDING: 4,
    NEGOTIATING: 6,
    ACCEPTED: 30,
    REJECTED: 0,
    CANCELLED: 0,
    COMPLETED: 10,
  },
  topSubjects: [
    { subjectId: "s-math", name: "Toán", requestCount: 25 },
    { subjectId: "s-eng", name: "Tiếng Anh", requestCount: 15 },
  ],
};

const queue = (count: number) => ({
  items: Array.from({ length: count }, (_, i) => ({
    id: `tutor-${i}-abcdefgh`,
    displayName: i === 0 ? "Đặng Thị Thảo" : `Gia sư ${i}`,
    accountStatus: "ACTIVE",
    submittedAt: "2026-10-30T10:00:00Z",
    version: "v1",
  })),
  totalCount: count,
  page: 1,
  pageSize: 20,
});

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders real snapshot counts, derived ratios and subject demand", async () => {
    vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue(snapshot);
    vi.spyOn(tutorReviewsApi, "getReviewQueue").mockResolvedValue(queue(1));
    render(<AdminDashboardPage />);

    expect(screen.getByText("Bảng Điều Khiển Quản Trị")).toBeInTheDocument();
    expect(await screen.findByText("1.248")).toBeInTheDocument();
    expect(
      screen.getByText(/980 học viên • 266 gia sư • 2 quản trị/)
    ).toBeInTheDocument();
    expect(screen.getByText("250 hồ sơ đã duyệt")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("10 đã hoàn thành")).toBeInTheDocument();
    // (30 accepted + 10 completed) / 50 total requests.
    expect(screen.getByText("80% chốt lớp")).toBeInTheDocument();
    expect(
      screen.getByText(/4 chờ phản hồi • 6 đang thương lượng/)
    ).toBeInTheDocument();

    const subjects = screen.getByRole("list", { name: "Nhu cầu theo môn học" });
    expect(within(subjects).getByText("Toán")).toBeInTheDocument();
    expect(within(subjects).getByText("50% (25 yêu cầu)")).toBeInTheDocument();
    expect(
      within(subjects).getByRole("progressbar", { name: "Tiếng Anh" })
    ).toHaveAttribute("aria-valuenow", "30");

    expect(await screen.findByText("Đặng Thị Thảo")).toBeInTheDocument();
    expect(
      screen.getByText(/Có 1 hồ sơ gia sư mới đang chờ xét duyệt/)
    ).toBeInTheDocument();
  });

  it("shows no fabricated metrics or placeholder rows", async () => {
    vi.spyOn(dashboardApi, "getAdminDashboard").mockResolvedValue({
      ...snapshot,
      usersByRole: { LEARNER: 0, TUTOR: 0, ADMIN: 1 },
      tutorProfilesByStatus: {
        DRAFT: 0,
        PENDING_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
      },
      hireRequestsByStatus: {
        PENDING: 0,
        NEGOTIATING: 0,
        ACCEPTED: 0,
        REJECTED: 0,
        CANCELLED: 0,
        COMPLETED: 0,
      },
      topSubjects: [],
    });
    vi.spyOn(tutorReviewsApi, "getReviewQueue").mockResolvedValue(queue(0));
    render(<AdminDashboardPage />);

    expect(
      await screen.findByText("Chưa có yêu cầu thuê gia sư nào.")
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Không có hồ sơ nào đang chờ duyệt.")
    ).toBeInTheDocument();
    expect(screen.getByText("— chốt lớp")).toBeInTheDocument();
    expect(screen.queryByText(/chờ xét duyệt/)).not.toBeInTheDocument();
    for (const fake of [
      /tháng này/,
      /Báo cáo khiếu nại/,
      /Trạng thái máy chủ/,
      /Uptime/,
      /Độ phủ/,
      /NaN/,
    ]) {
      expect(screen.queryByText(fake)).not.toBeInTheDocument();
    }
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("surfaces a load error with retry instead of placeholder numbers", async () => {
    vi.spyOn(dashboardApi, "getAdminDashboard").mockRejectedValue(
      new Error("boom")
    );
    vi.spyOn(tutorReviewsApi, "getReviewQueue").mockResolvedValue(queue(0));
    render(<AdminDashboardPage />);
    await waitFor(() =>
      expect(
        screen.getByText("Không thể tải số liệu bảng điều khiển.")
      ).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
    expect(screen.queryByText("1.248")).not.toBeInTheDocument();
  });
});
