import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import GiaSuPage from "../src/app/gia-su/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/gia-su",
}));

// Mock window methods
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
window.alert = vi.fn();

describe("TutorMatching Gia Su (/gia-su) Page & Modals", () => {
  it("renders the Gia Su page with title, filter and tutor list", () => {
    render(<GiaSuPage />);

    expect(screen.getByText("DANH SÁCH GIA SƯ")).toBeInTheDocument();
    expect(screen.getByText("Bộ lọc gia sư")).toBeInTheDocument();
    expect(
      screen.getByText("GS1627 - Lê Phương Diệu - [Sinh viên]")
    ).toBeInTheDocument();
    expect(
      screen.getByText("GS1626 - Phùng Huyền Trang - [Sinh viên]")
    ).toBeInTheDocument();
  });

  it("filters tutors by subject and resets filter", () => {
    render(<GiaSuPage />);

    const selects = screen.getAllByRole("combobox");
    const subjectSelect = selects[0]; // Chọn môn học

    // Chọn môn Toán
    fireEvent.change(subjectSelect, { target: { value: "Toán" } });
    expect(screen.getByText("Tìm kiếm")).toBeInTheDocument();

    // Lê Phương Diệu dạy Tiếng Anh nên không xuất hiện khi lọc Toán
    expect(
      screen.queryByText("GS1627 - Lê Phương Diệu - [Sinh viên]")
    ).not.toBeInTheDocument();

    // Phạm Bảo Trân dạy Toán, Tiếng Việt... nên xuất hiện
    expect(
      screen.getByText("GS1619 - Phạm Bảo Trân - [Sinh viên]")
    ).toBeInTheDocument();

    // Bấm nút Xoá lọc
    fireEvent.click(screen.getByText("Xoá lọc"));

    // Lê Phương Diệu lại xuất hiện
    expect(
      screen.getByText("GS1627 - Lê Phương Diệu - [Sinh viên]")
    ).toBeInTheDocument();
  });

  it("opens Modal 1 (Hồ sơ gia sư) with complete details when clicking 'Xem hồ sơ'", () => {
    render(<GiaSuPage />);

    const viewProfileButtons = screen.getAllByText("Xem hồ sơ");
    fireEvent.click(viewProfileButtons[0]); // Click xem hồ sơ của Lê Phương Diệu

    // Kiểm tra Modal 1 đã mở
    expect(screen.getByText("HỒ SƠ GIA SƯ")).toBeInTheDocument();
    expect(screen.getByText("Thông tin cá nhân")).toBeInTheDocument();
    expect(screen.getByText("Học vấn")).toBeInTheDocument();
    expect(screen.getByText("Chuyên môn dạy")).toBeInTheDocument();
    expect(screen.getByText("Khu vực dạy")).toBeInTheDocument();
    expect(screen.getByText("Thành tích và kinh nghiệm")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ đã được GiasuHome xác thực")).toBeInTheDocument();
    expect(
      screen.getByText("Thông tin cá nhân và học vấn đã được kiểm tra trước khi kết nối tới phụ huynh.")
    ).toBeInTheDocument();
    expect(screen.getByText("Trường đại học Luật Hà Nội")).toBeInTheDocument();
  });

  it("navigates from Modal 1 to Modal 2 (Gửi lời mời dạy) and submits to Modal 3 (Thành công)", () => {
    render(<GiaSuPage />);

    // 1. Mở modal xem hồ sơ
    const viewProfileButtons = screen.getAllByText("Xem hồ sơ");
    fireEvent.click(viewProfileButtons[0]);

    // 2. Click nút "Mời dạy" trong modal hồ sơ
    const inviteButton = screen.getByRole("button", { name: "Mời dạy" });
    fireEvent.click(inviteButton);

    // 3. Modal 2 "Gửi lời mời dạy" hiển thị
    expect(screen.getByText("Gửi lời mời dạy")).toBeInTheDocument();
    expect(
      screen.getByText(/Để lại thông tin để gia sư chủ động liên hệ trao đổi với bạn/i)
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/GS1627 - Lê Phương Diệu/i).length
    ).toBeGreaterThan(0);

    // 4. Nhập form
    const nameInput = screen.getByPlaceholderText("Vui lòng nhập tên*");
    const phoneInput = screen.getByPlaceholderText("Số điện thoại*");
    const noteInput = screen.getByPlaceholderText("Nhu cầu học tập (không bắt buộc)");

    fireEvent.change(nameInput, { target: { value: "Nguyễn Văn Phụ Huynh" } });
    fireEvent.change(phoneInput, { target: { value: "0912345678" } });
    fireEvent.change(noteInput, { target: { value: "Cần kèm tiếng Anh lớp 8" } });

    // 5. Gửi lời mời
    const submitBtn = screen.getByRole("button", { name: "Gửi lời mời" });
    fireEvent.click(submitBtn);

    // 6. Modal 3 "Thành công" hiển thị
    expect(screen.getByText("Thành công")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gửi lời mời thành công. Gia sư sẽ liên hệ sớm nhất trao đổi và hẹn lịch dạy thử."
      )
    ).toBeInTheDocument();

    // 7. Bấm nút Đóng
    const closeBtn = screen.getByRole("button", { name: "Đóng" });
    fireEvent.click(closeBtn);

    // Popup thành công đã đóng
    expect(screen.queryByText("Thành công")).not.toBeInTheDocument();
  });
});
