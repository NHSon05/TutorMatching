import { screen } from "@testing-library/react";
import { render } from "../query-wrapper";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TutorDashboardClient } from "@/components/tutor/dashboard/TutorDashboardClient";
import { useSession } from "@/hooks/use-session";

vi.mock("@/hooks/use-session", () => ({
  useSession: vi.fn(),
}));

describe("TutorDashboardClient - Conditional UI Rendering", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders ONLY Wireframe 1 (IncompleteProfileDashboard) when tutor profile is not completed", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        id: "tutor-draft",
        fullName: "Nguyễn Văn Minh",
        email: "minh@example.com",
        role: "TUTOR",
        status: "ACTIVE",
        tutorProfileStatus: "DRAFT",
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TutorDashboardClient />);

    // Header & Greeting của Wireframe 1
    expect(screen.getByRole("heading", { name: "Tổng quan" })).toBeInTheDocument();
    expect(screen.getByText("Chào Minh, bắt đầu hành trình dạy học của bạn.")).toBeInTheDocument();
    expect(screen.getByText("27/10/2026")).toBeInTheDocument();
    expect(screen.getByText("Thứ Ba")).toBeInTheDocument();

    // 4 Metrics của Wireframe 1 (0, 0, —, 0)
    expect(screen.getByText("học sinh đang dạy")).toBeInTheDocument();
    expect(screen.getByText("buổi học hôm nay")).toBeInTheDocument();
    expect(screen.getByText("cơ hội mới phù hợp")).toBeInTheDocument();
    expect(screen.getByText("liên hệ cần theo dõi")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Hoàn thiện hồ sơ" }).length).toBe(2);

    // Cột trái: Trạng thái chưa có lịch dạy & chưa có học sinh
    expect(screen.getByText("Chưa có lịch dạy")).toBeInTheDocument();
    expect(screen.getByText("Chưa có học sinh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Thêm học sinh" })).toBeInTheDocument();

    // Cột phải: Khung nhắc nhở hoàn thiện hồ sơ với 3 Checklist
    expect(
      screen.getByRole("heading", { name: "Hoàn thiện hồ sơ để nhận cơ hội phù hợp" })
    ).toBeInTheDocument();
    expect(screen.getByText("Môn dạy và khối lớp")).toBeInTheDocument();
    expect(screen.getByText("Khu vực nhận dạy")).toBeInTheDocument();
    expect(screen.getByText("Khung giờ có thể dạy")).toBeInTheDocument();

    // Bảng theo dõi trống
    expect(screen.getByText("Chưa có liên hệ nào")).toBeInTheDocument();

    // TUYỆT ĐỐI KHÔNG CÓ nội dung của Wireframe 2
    expect(screen.queryByText("Chào Minh, hôm nay bạn có 2 buổi học")).not.toBeInTheDocument();
    expect(screen.queryByText("17:00–18:30")).not.toBeInTheDocument();
    expect(screen.queryByText("Hoàng Nam")).not.toBeInTheDocument();
    expect(screen.queryByText("Minh Anh")).not.toBeInTheDocument();
    expect(screen.queryByText("Toán 8 · Cầu Giấy")).not.toBeInTheDocument();
  });

  it("renders ONLY Wireframe 2 (CompletedProfileDashboard) when tutor profile is APPROVED", () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        id: "tutor-approved",
        fullName: "Nguyễn Văn Minh",
        email: "minh@example.com",
        role: "TUTOR",
        status: "ACTIVE",
        tutorProfileStatus: "APPROVED",
      },
      isLoading: false,
      error: null,
    } as any);

    render(<TutorDashboardClient />);

    // Header & Greeting của Wireframe 2
    expect(screen.getByRole("heading", { name: "Tổng quan" })).toBeInTheDocument();
    expect(screen.getByText("Chào Minh, hôm nay bạn có 2 buổi học")).toBeInTheDocument();
    expect(screen.getByText("Thứ Ba · 18:45")).toBeInTheDocument();

    // 4 Metrics thực tế của Wireframe 2
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Lịch dạy hôm nay (Hoàng Nam & Minh Anh)
    expect(screen.getByText("17:00–18:30")).toBeInTheDocument();
    expect(screen.getByText("Hoàng Nam")).toBeInTheDocument();
    expect(screen.getByText("Đã hoàn thành")).toBeInTheDocument();
    expect(screen.getByText("19:00–20:30")).toBeInTheDocument();
    expect(screen.getByText("Minh Anh")).toBeInTheDocument();
    expect(screen.getByText("Sắp diễn ra · còn 15 phút")).toBeInTheDocument();

    // Việc cần làm
    expect(screen.getByText("Cập nhật tiến độ học của Minh Anh")).toBeInTheDocument();
    expect(screen.getByText("Xác nhận lịch học thử với phụ huynh Bảo Ngọc")).toBeInTheDocument();

    // Cơ hội phù hợp
    expect(screen.getByText("Tìm gia sư Toán lớp 9")).toBeInTheDocument();
    expect(screen.getByText("Tìm gia sư Vật lý lớp 10")).toBeInTheDocument();
    expect(screen.getByText("Tìm gia sư Toán lớp 8")).toBeInTheDocument();

    // Bảng liên hệ theo dõi
    expect(screen.getByText("Toán 8 · Cầu Giấy")).toBeInTheDocument();
    expect(screen.getByText("Toán 9 · Bảo Ngọc")).toBeInTheDocument();
    expect(screen.getByText("Vật lý 10 · Thanh Xuân")).toBeInTheDocument();

    // TUYỆT ĐỐI KHÔNG CÓ nội dung của Wireframe 1
    expect(screen.queryByText("Chào Minh, bắt đầu hành trình dạy học của bạn.")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có lịch dạy")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có học sinh")).not.toBeInTheDocument();
    expect(screen.queryByText("Chưa có liên hệ nào")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Hoàn thiện hồ sơ để nhận cơ hội phù hợp" })
    ).not.toBeInTheDocument();
  });
});
