import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "../query-wrapper";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import AdminDashboardPage from "@/app/(admin)/admin/dashboard/page";
import * as tutorReviewsApi from "@/lib/api/tutor-reviews";

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders header, KPI cards, and quick actions", async () => {
    vi.spyOn(tutorReviewsApi, "getReviewQueue").mockResolvedValue({
      items: [
        {
          id: "tutor-123",
          displayName: "Đặng Thị Thảo",
          accountStatus: "ACTIVE",
          submittedAt: "2026-10-30T10:00:00Z",
          version: "v1",
        },
      ],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    });

    render(<AdminDashboardPage />);

    // Header & Badge
    expect(screen.getByText("Bảng Điều Khiển Quản Trị")).toBeInTheDocument();
    expect(screen.getByText("Admin Portal")).toBeInTheDocument();

    // KPI Cards
    expect(screen.getByText("Tổng người dùng")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ gia sư chờ duyệt")).toBeInTheDocument();
    expect(screen.getByText("Lớp học đang diễn ra")).toBeInTheDocument();
    expect(screen.getByText("Báo cáo khiếu nại")).toBeInTheDocument();

    // Data from query appears
    await waitFor(() => {
      expect(screen.getByText("Đặng Thị Thảo")).toBeInTheDocument();
    });

    // Market demand and platform health
    expect(screen.getByText("Nhu cầu môn học hàng đầu")).toBeInTheDocument();
    expect(screen.getByText("Trạng thái máy chủ")).toBeInTheDocument();
  });

  it("supports switching timeframe tabs", () => {
    render(<AdminDashboardPage />);

    const thirtyDaysTab = screen.getByRole("tab", { name: "30 ngày qua" });
    fireEvent.click(thirtyDaysTab);
    expect(thirtyDaysTab).toHaveAttribute("aria-selected", "true");
  });
});
