import { screen, waitFor } from "@testing-library/react";
import { render } from "./query-wrapper";
import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "../src/app/(public)/page";
import TutorsPage from "../src/app/(public)/tutors/page";
import LoginPage from "../src/app/(public)/login/page";
import RegisterPage from "../src/app/(public)/register/page";
import SelectRolePage from "../src/app/(public)/select-role/page";
import LegacyLearnerDashboardRedirect from "../src/app/(public)/learner/dashboard/page";
import TutorDashboardPage from "../src/app/(tutor)/tutor/dashboard/page";
import AdminDashboardPage from "../src/app/(admin)/admin/dashboard/page";
import MessagesPage from "../src/app/(public)/messages/page";
import SettingsPage from "../src/app/(public)/settings/page";
import { LearnerShell } from "../src/components/layouts/LearnerShell";
import { SiteShell } from "../src/components/layouts/SiteShell";
import { getSession } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/use-auth-store";

// Mock next/navigation
const { router, route } = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  route: { path: "/" },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  logout: vi.fn(),
  login: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => route.path,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => router,
}));

vi.mock("@/lib/api/catalog", () => ({ getPublicCatalog: vi.fn(async () => []) }));
vi.mock("@/lib/api/tutors", () => ({ getTutors: vi.fn(async () => ({items: [], totalCount: 0, page: 1, pageSize: 20})), publicAvatarUrl: vi.fn() }));

describe("TutorMatching Routing & Role Architecture", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuthStore.getState().clearAuth();
    route.path = "/";
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it("renders Public Landing page on / with hero CTA when unauthenticated (guest)", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    const page = await HomePage();
    render(page);
    expect(screen.getByText(/Kiến tạo tương lai/i)).toBeInTheDocument();
    expect(screen.getByText("Đăng ký ngay")).toBeInTheDocument();
  });

  it("renders Learner Dashboard on / when authenticated as LEARNER", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "test",
      fullName: "Signed-in learner",
      email: "learner@example.com",
      role: "LEARNER",
      status: "ACTIVE",
    });
    const page = await HomePage();
    render(page);
    expect(await screen.findByRole("heading", {name:"Danh sách gia sư"})).toBeInTheDocument();
    expect(screen.getByLabelText("Tên gia sư")).toBeInTheDocument();
  });

  it("renders Public Tutors list page", async () => {
    render(<TutorsPage />);
    expect(await screen.findByRole("heading", {name:"Danh sách gia sư"})).toBeInTheDocument();
    expect(await screen.findByText("0 gia sư phù hợp")).toBeInTheDocument();
  });

  it("renders Public Login page with authentication form", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Đăng Nhập" })).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Mật khẩu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeInTheDocument();
    expect(screen.getByText("Chưa có tài khoản?")).toBeInTheDocument();
  });

  it("blocks authenticated user from /login and redirects to their workspace", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "learner-test",
      fullName: "Learner",
      email: "l@example.com",
      role: "LEARNER",
      status: "ACTIVE",
    });

    render(<LoginPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
    expect(screen.queryByRole("heading", { name: "Đăng Nhập" })).not.toBeInTheDocument();
  });

  it("blocks authenticated tutor from /login and redirects to /tutor/dashboard", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "tutor-test",
      fullName: "Tutor",
      email: "t@example.com",
      role: "TUTOR",
      status: "ACTIVE",
      tutorProfileStatus: "APPROVED",
    });

    render(<LoginPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/tutor/dashboard"));
    expect(screen.queryByRole("heading", { name: "Đăng Nhập" })).not.toBeInTheDocument();
  });

  it("blocks unverified tutor from /login and redirects to /tutor/onboarding", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "tutor-test",
      fullName: "Tutor",
      email: "t@example.com",
      role: "TUTOR",
      status: "ACTIVE",
      tutorProfileStatus: "DRAFT",
    });

    render(<LoginPage />);
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/tutor/onboarding"));
    expect(screen.queryByRole("heading", { name: "Đăng Nhập" })).not.toBeInTheDocument();
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

  it("redirects legacy /learner/dashboard to /", () => {
    render(<LegacyLearnerDashboardRedirect />);
    expect(router.replace).toHaveBeenCalledWith("/");
  });

  it("renders Tutor Dashboard", async () => {
    render(<TutorDashboardPage />);
    expect(await screen.findByRole("heading", { name: "Tổng quan" })).toBeInTheDocument();
    expect(screen.getByText(/Chào Minh/)).toBeInTheDocument();
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

  it("renders Settings page", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "learner-1",
      fullName: "Học viên thử nghiệm",
      email: "learner@example.com",
      role: "LEARNER",
      status: "ACTIVE",
    });
    render(<SettingsPage />);
    expect(await screen.findByText("Hồ sơ của tôi")).toBeInTheDocument();
  });

  it("renders Learner Shell with persistent NavigationRail and TopBar", () => {
    render(
      <LearnerShell
        account={{
          id: "1",
          fullName: "Nguyễn Hồng Sơn",
          email: "learner@example.com",
          role: "LEARNER",
          status: "ACTIVE",
        }}
      >
        <div data-testid="learner-content">Nội dung trang học viên</div>
      </LearnerShell>
    );

    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByText("Gia sư của tôi")).toBeInTheDocument();
    expect(screen.getByText("Lịch học")).toBeInTheDocument();
    expect(screen.getByText("Tin nhắn")).toBeInTheDocument();
    expect(screen.getByText("Tìm gia sư")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Hồng Sơn")).toBeInTheDocument();
    expect(screen.getByText("Thành viên")).toBeInTheDocument();
    expect(screen.getByTestId("learner-content")).toBeInTheDocument();
  });

  it("renders LearnerShell inside SiteShell when logged in as LEARNER on /tutors", async () => {
    route.path = "/tutors";
    vi.mocked(getSession).mockResolvedValue({
      id: "1",
      fullName: "Nguyễn Hồng Sơn",
      email: "learner@example.com",
      role: "LEARNER",
      status: "ACTIVE",
    });
    render(
      <SiteShell>
        <div data-testid="tutors-content">Danh sách gia sư</div>
      </SiteShell>
    );

    expect(await screen.findByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    expect(screen.getByText("TutorMatch")).toBeInTheDocument();
    expect(screen.getByText("Trang chủ")).toBeInTheDocument();
    expect(screen.getByTestId("tutors-content")).toBeInTheDocument();
  });

  it("renders PublicNavbar/Footer inside SiteShell when guest on /tutors", async () => {
    route.path = "/tutors";
    vi.mocked(getSession).mockResolvedValue(null);
    render(
      <SiteShell>
        <div data-testid="tutors-content">Danh sách gia sư</div>
      </SiteShell>
    );

    expect(await screen.findByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByTestId("tutors-content")).toBeInTheDocument();
  });
});
