import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Home from "../src/app/page";
import TuitionPage from "../src/app/hoc-phi/page";
import ClassListPage from "../src/app/lop-hoc/page";
import AboutPage from "../src/app/gioi-thieu/page";
import BlogPage from "../src/app/blog/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock window methods
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
window.alert = vi.fn();

describe("TutorMatching GiasuHome Multi-page Clone", () => {
  it("renders the Home page faithfully", () => {
    render(<Home />);

    expect(screen.getAllByAltText("GiasuHome Logo").length).toBeGreaterThan(0);
    expect(screen.getByText("Tìm gia sư phù hợp cho con")).toBeInTheDocument();
    expect(screen.getByText("THỰC TRẠNG")).toBeInTheDocument();
    expect(screen.getByText("HIỆU QUẢ")).toBeInTheDocument();
    expect(screen.getByText("GIẢI PHÁP")).toBeInTheDocument();
    expect(screen.getByText("Hành trình chọn gia sư phù hợp")).toBeInTheDocument();
    expect(screen.getByText("3k+")).toBeInTheDocument();
  });

  it("renders the Tuition (/hoc-phi) page faithfully", () => {
    render(<TuitionPage />);

    expect(screen.getByText("Học phí và hình thức học")).toBeInTheDocument();
    expect(screen.getByText("Học phí gia sư tham khảo")).toBeInTheDocument();
    expect(screen.getByText("Nên chọn gia sư nào phù hợp?")).toBeInTheDocument();
    expect(screen.getByText("Học gia sư tại nhà hay học online?")).toBeInTheDocument();
    expect(screen.getByText("Tiểu học")).toBeInTheDocument();
    expect(screen.getByText("Đăng ký nhận tư vấn học phí")).toBeInTheDocument();
  });

  it("renders the Class List (/lop-hoc) page and filters classes", () => {
    render(<ClassListPage />);

    expect(screen.getByText("DANH SÁCH LỚP MỚI")).toBeInTheDocument();
    expect(screen.getByText("LH1767")).toBeInTheDocument();
    expect(screen.getByText("LH1766")).toBeInTheDocument();

    // Filter by subject using the first select
    const selects = screen.getAllByRole("combobox");
    const subjectSelect = selects[0];
    fireEvent.change(subjectSelect, { target: { value: "Tiếng Anh" } });

    expect(screen.getByText("LH1767")).toBeInTheDocument();
    expect(screen.queryByText("LH1766")).not.toBeInTheDocument();
  });

  it("renders the About (/gioi-thieu) page faithfully", () => {
    render(<AboutPage />);

    expect(screen.getByText("Về chúng tôi")).toBeInTheDocument();
    expect(screen.getByText(/Tận tâm kết nối/i)).toBeInTheDocument();
    expect(screen.getByText("Thấu hiểu nhu cầu")).toBeInTheDocument();
    expect(screen.getByText("Vì sao phụ huynh lựa chọn GiasuHome?")).toBeInTheDocument();
    expect(screen.getByText("Chia sẻ từ phụ huynh")).toBeInTheDocument();
  });

  it("renders the Blog (/blog) page and filters by topic", () => {
    render(<BlogPage />);

    expect(screen.getByText("Blog chia sẻ kinh nghiệm")).toBeInTheDocument();
    expect(screen.getByText("Chủ đề được phụ huynh quan tâm")).toBeInTheDocument();
    expect(screen.getByText("5 dấu hiệu con đang cần gia sư hỗ trợ sớm")).toBeInTheDocument();

    // Click topic filter
    const topicBtn = screen.getByText(/Giải pháp học tập hiệu quả/i);
    fireEvent.click(topicBtn);

    expect(screen.getByText("Học online hay học tại nhà hiệu quả hơn?")).toBeInTheDocument();
  });
});
