import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "../query-wrapper";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TutorsListClient from "@/components/tutors/TutorsListClient";
import { mockTutors } from "@/data/mockTutors";
import { getSession } from "@/lib/auth/session";
import { useAuthStore } from "@/stores/use-auth-store";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/lib/api/tutors", () => ({
  getTutors: vi.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }),
}));

describe("TutorsListClient - Modal & Hiring Action Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().clearAuth();
    vi.mocked(getSession).mockResolvedValue(null);
  });

  it("displays 'Đăng nhập để kết nối' when user is unauthenticated and redirects to /login", async () => {
    render(<TutorsListClient initialTutors={mockTutors} />);

    // Click 'Đặt lịch học' on the first tutor card
    const bookButtons = screen.getAllByRole("button", { name: "Đặt lịch học" });
    fireEvent.click(bookButtons[0]);

    // Detail Modal opens
    expect(screen.getByRole("button", { name: "Đăng nhập để kết nối" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Thuê gia sư" })).not.toBeInTheDocument();

    // Click 'Đăng nhập để kết nối'
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập để kết nối" }));
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/login");
    });
  });

  it("opens HireTutorDialog when user is authenticated and clicks 'Thuê gia sư'", async () => {
    vi.mocked(getSession).mockResolvedValue({
      id: "learner-1",
      email: "learner@example.com",
      fullName: "Học Viên Test",
      role: "LEARNER",
      status: "ACTIVE",
    });

    render(<TutorsListClient initialTutors={mockTutors} />);

    // Click 'Đặt lịch học' on the first tutor card
    const bookButtons = screen.getAllByRole("button", { name: "Đặt lịch học" });
    fireEvent.click(bookButtons[0]);

    // Detail Modal opens with 'Thuê gia sư' button
    const hireButton = await screen.findByRole("button", { name: "Thuê gia sư" });
    expect(hireButton).toBeInTheDocument();

    // Click 'Thuê gia sư' to open HireTutorDialog
    fireEvent.click(hireButton);

    // Verify dialog fields: chọn buổi học, giá tiền, nhắc nhở thêm, radio tôi muốn thương lượng
    expect(await screen.findByText(/1\. Chọn lịch & buổi học mong muốn/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Học phí & Thương lượng giá/i)).toBeInTheDocument();
    expect(screen.getByText("3. Nhắc nhở thêm cho gia sư")).toBeInTheDocument();
    expect(screen.getByText("Tôi muốn thương lượng giá")).toBeInTheDocument();

    // Proposed price input is not visible initially (until negotiation radio is selected)
    expect(screen.queryByPlaceholderText("Ví dụ: 180000")).not.toBeInTheDocument();

    // Click radio "Tôi muốn thương lượng giá"
    fireEvent.click(screen.getByText("Tôi muốn thương lượng giá"));

    // Now the proposed price input appears
    const proposedPriceInput = screen.getByPlaceholderText("Ví dụ: 180000");
    expect(proposedPriceInput).toBeInTheDocument();

    // Enter proposed price and notes
    fireEvent.change(proposedPriceInput, { target: { value: "190000" } });
    const notesInput = screen.getByPlaceholderText(/Nhập mục tiêu học tập/i);
    fireEvent.change(notesInput, { target: { value: "Em muốn ôn thi cấp tốc 3 tháng" } });

    // Submit hire request
    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" }));

    // Success screen in dialog
    expect(await screen.findByText("Đã gửi yêu cầu thuê gia sư!")).toBeInTheDocument();
    expect(screen.getByText(/Em muốn ôn thi cấp tốc 3 tháng/)).toBeInTheDocument();

    // Click 'Đến Hộp thư trao đổi →'
    fireEvent.click(screen.getByRole("button", { name: "Đến Hộp thư trao đổi →" }));
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/messages");
    });
  });
});
