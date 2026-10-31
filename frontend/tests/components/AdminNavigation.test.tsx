import { screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../query-wrapper";
import AdminNavbar from "@/components/navigation/AdminNavbar";
import AdminSidebar from "@/components/navigation/AdminSidebar";
import AdminLayoutShell from "@/components/layouts/AdminLayoutShell";

const { route } = vi.hoisted(() => ({
  route: { path: "/admin/dashboard" },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => route.path,
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(async () => ({
    id: "admin-1",
    fullName: "Quản trị viên",
    email: "admin@example.com",
    role: "ADMIN",
    status: "ACTIVE",
  })),
  logout: vi.fn(),
  login: vi.fn(),
}));

describe("Admin Navigation Suite", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    route.path = "/admin/dashboard";
  });

  describe("AdminNavbar", () => {
    it("renders brand logo, admin role badge, and navigation links", () => {
      render(<AdminNavbar />);

      expect(screen.getByText("TutorMatching")).toBeInTheDocument();
      expect(screen.getByText("Quản trị")).toBeInTheDocument();
      expect(screen.getByText("Superuser")).toBeInTheDocument();

      const nav = screen.getByRole("navigation", { name: "Điều hướng quản trị" });
      expect(within(nav).getByRole("link", { name: "Bảng điều khiển" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(within(nav).getByRole("link", { name: "Duyệt hồ sơ gia sư" })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: "Quản lý danh mục" })).toBeInTheDocument();
      expect(within(nav).getByRole("link", { name: "Quản lý tài khoản" })).toBeInTheDocument();
    });

    it("marks active link based on current path", () => {
      route.path = "/admin/tutor-approvals";
      render(<AdminNavbar />);

      const nav = screen.getByRole("navigation", { name: "Điều hướng quản trị" });
      expect(within(nav).getByRole("link", { name: "Duyệt hồ sơ gia sư" })).toHaveAttribute(
        "aria-current",
        "page"
      );
      expect(within(nav).getByRole("link", { name: "Bảng điều khiển" })).not.toHaveAttribute(
        "aria-current"
      );
    });
  });

  describe("AdminSidebar", () => {
    it("renders sidebar items with role badge and logout button", () => {
      render(<AdminSidebar />);

      expect(screen.getByText("TutorMatch")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
      expect(screen.getByText("Bảng điều khiển")).toBeInTheDocument();
      expect(screen.getByText("Duyệt hồ sơ gia sư")).toBeInTheDocument();
      expect(screen.getByText("Quản lý danh mục")).toBeInTheDocument();
      expect(screen.getByText("Quản lý tài khoản")).toBeInTheDocument();
      expect(screen.getByText("Cài đặt hệ thống")).toBeInTheDocument();

      // User card
      expect(screen.getByText("Quản trị viên")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    });
  });

  describe("AdminLayoutShell", () => {
    it("renders responsive desktop layout with header and content", () => {
      render(
        <AdminLayoutShell>
          <div data-testid="admin-content">Nội dung quản trị</div>
        </AdminLayoutShell>
      );

      expect(screen.getByTestId("admin-content")).toBeInTheDocument();
      expect(screen.getByText("Hệ thống quản trị TutorMatching")).toBeInTheDocument();
      expect(screen.getByText("Hệ thống trực tuyến")).toBeInTheDocument();
    });
  });
});
