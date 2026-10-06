import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LandingPage from "../src/app/(public)/page";
import TutorsPage from "../src/app/(public)/tutors/page";
import LoginPage from "../src/app/(public)/login/page";
import RegisterPage from "../src/app/(public)/register/page";
import SelectRolePage from "../src/app/(public)/select-role/page";
import LearnerDashboardPage from "../src/app/(learner)/learner/dashboard/page";
import TutorDashboardPage from "../src/app/(tutor)/tutor/dashboard/page";
import AdminDashboardPage from "../src/app/(admin)/admin/dashboard/page";
import MessagesPage from "../src/app/(shared)/messages/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("TutorMatching Routing & Role Architecture", () => {
  it("renders Public Landing page with hero CTA", () => {
    render(<LandingPage />);
    expect(screen.getByText(/Kiến tạo tương lai/i)).toBeInTheDocument();
    expect(screen.getByText("Đăng ký ngay")).toBeInTheDocument();
  });

  it("renders Public Tutors list page", () => {
    render(<TutorsPage />);
    expect(screen.getByText("Danh Sách Gia Sư")).toBeInTheDocument();
    expect(screen.getByText("Lê Phương Diệu")).toBeInTheDocument();
  });

  it("renders Public Login page with role fast-access buttons", () => {
    render(<LoginPage />);
    expect(screen.getByText("Đăng Nhập")).toBeInTheDocument();
    expect(screen.getByText(/Vào Không gian Học viên/i)).toBeInTheDocument();
    expect(screen.getByText(/Vào Không gian Gia sư/i)).toBeInTheDocument();
    expect(screen.getByText(/Vào Không gian Quản trị/i)).toBeInTheDocument();
  });

  it("renders Public Register page with 6 standardized fields", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Đăng ký" })).toBeInTheDocument();
    expect(screen.getByText("Bắt đầu hành trình của bạn")).toBeInTheDocument();
    expect(screen.getByText("Đăng ký tài khoản")).toBeInTheDocument();

    // 1. Vai trò (Gia sư, Phụ Huynh, Học Sinh)
    expect(screen.getByText("Chọn vai trò")).toBeInTheDocument();
    expect(screen.getByText("Gia sư")).toBeInTheDocument();
    expect(screen.getByText("Phụ Huynh")).toBeInTheDocument();
    expect(screen.getByText("Học Sinh")).toBeInTheDocument();

    // 2. Email
    expect(screen.getByText("Email")).toBeInTheDocument();

    // 3. Số điện thoại
    expect(screen.getByText("Số điện thoại")).toBeInTheDocument();

    // 4. Họ và tên
    expect(screen.getByText("Họ và tên")).toBeInTheDocument();

    // 5. Mật khẩu & 6. Xác nhận mật khẩu
    expect(screen.getByText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByText("Xác nhận mật khẩu")).toBeInTheDocument();

    // CTAs
    expect(screen.getByRole("button", { name: "Đăng ký" })).toBeInTheDocument();
  });

  it("renders Public Select Role page for OAuth 2.0 fallback", () => {
    render(<SelectRolePage />);
    expect(screen.getByText("Chọn vai trò của bạn")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận & Tiếp tục" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quay lại" })).toBeInTheDocument();
  });

  it("renders Learner Dashboard", () => {
    render(<LearnerDashboardPage />);
    expect(screen.getByText("Xin chào, Học viên 👋")).toBeInTheDocument();
    expect(screen.getByText("Gia sư đang học")).toBeInTheDocument();
  });

  it("renders Tutor Dashboard", () => {
    render(<TutorDashboardPage />);
    expect(screen.getByText("Xin chào, Gia sư 👋")).toBeInTheDocument();
    expect(screen.getByText("✓ Hồ sơ đã được duyệt")).toBeInTheDocument();
  });

  it("renders Admin Dashboard", () => {
    render(<AdminDashboardPage />);
    expect(screen.getByText("Bảng Điều Khiển Quản Trị")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ gia sư chờ duyệt")).toBeInTheDocument();
  });

  it("renders Shared Messages page", () => {
    render(<MessagesPage />);
    expect(screen.getByText("Hộp Thư")).toBeInTheDocument();
    expect(screen.getAllByText("Lê Phương Diệu").length).toBeGreaterThan(0);
  });
});
