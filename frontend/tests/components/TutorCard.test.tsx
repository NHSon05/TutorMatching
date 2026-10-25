import { screen, fireEvent, render as testingRender } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TutorCard } from "@/components/tutors/TutorCard";
import type { TutorListItemResponse } from "@/lib/api/tutors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return testingRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("TutorCard Component", () => {
  const realDbTutor: TutorListItemResponse = {
    id: "profile-100",
    displayName: "Nguyễn Văn A",
    avatarUrl: "/uploads/avatars/user-100.png",
    bio: "Hơn 5 năm kinh nghiệm gia sư chuyên Toán và luyện thi đại học điểm cao.",
    qualification: "Thạc sĩ Sư phạm",
    schoolName: "ĐH Sư Phạm Hà Nội",
    specialization: "Toán nâng cao",
    experienceYears: 5,
    teachingMethodology: "Phương pháp tương tác phản xạ",
    achievements: "Giải Nhì Toán Quốc Gia",
    sessionRateVnd: 250000,
    teachingModes: ["ONLINE", "OFFLINE"],
    provinceCode: "01",
    provinceName: "Hà Nội",
    districtCode: "001",
    districtName: "Cầu Giấy",
    subjects: [
      {
        subjectId: "math",
        name: "Toán học",
        levelCodes: ["HIGH_SCHOOL"],
        levelNames: ["THPT"],
      },
    ],
    approvedAt: "2026-01-01T00:00:00Z",
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders pure real database fields from API /api/v1/tutors", () => {
    renderWithQuery(<TutorCard tutor={realDbTutor} />);

    // Tên và link chi tiết
    const nameLink = screen.getByRole("link", { name: "Nguyễn Văn A" });
    expect(nameLink).toHaveAttribute("href", "/tutors/profile-100");

    // Thông tin chuyên môn, môn học, hình thức thực tế
    expect(screen.getByText("Thạc sĩ Sư phạm • ĐH Sư Phạm Hà Nội")).toBeInTheDocument();
    expect(screen.getByText("Toán học")).toBeInTheDocument();
    expect(screen.getByText("Trực tuyến / Trực tiếp • Toán nâng cao")).toBeInTheDocument();
    expect(screen.getByText("Cầu Giấy, Hà Nội")).toBeInTheDocument();

    // Phương pháp giảng dạy thực tế
    expect(screen.getByText("Phương pháp tương tác phản xạ")).toBeInTheDocument();

    // Bio
    expect(screen.getByText(/Hơn 5 năm kinh nghiệm gia sư chuyên Toán/)).toBeInTheDocument();

    // Link xem chi tiết hồ sơ
    expect(
      screen.getByRole("link", { name: `Xem hồ sơ ${realDbTutor.displayName}` })
    ).toHaveAttribute("href", "/tutors/profile-100");

    // Huy hiệu đã kiểm duyệt (vì approvedAt tồn tại)
    expect(screen.getByTitle("Gia sư đã được kiểm duyệt")).toBeInTheDocument();
  });

  it("renders real session rate and real database stats", () => {
    renderWithQuery(<TutorCard tutor={realDbTutor} />);

    // Học phí
    expect(screen.getByLabelText("250.000 VNĐ/buổi")).toBeInTheDocument();
    expect(screen.getByText("250.000đ")).toBeInTheDocument();
    expect(screen.getByText("Học phí theo buổi")).toBeInTheDocument();

    // Thống kê thực tế từ database
    expect(screen.getByText("5 năm")).toBeInTheDocument();
    expect(screen.getByText("kinh nghiệm")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("môn dạy")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("hình thức")).toBeInTheDocument();
  });

  it("handles favorite toggle interactions", () => {
    const onToggleFavorite = vi.fn();
    renderWithQuery(
      <TutorCard
        tutor={realDbTutor}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const favoriteButton = screen.getByLabelText("Lưu gia sư yêu thích");
    fireEvent.click(favoriteButton);
    expect(onToggleFavorite).toHaveBeenCalledWith("profile-100", true);

    fireEvent.click(favoriteButton);
    expect(onToggleFavorite).toHaveBeenCalledWith("profile-100", false);
  });

  it("triggers onBookTrial and onSendMessage callbacks when clicked", () => {
    const onBookTrial = vi.fn();
    const onSendMessage = vi.fn();

    renderWithQuery(
      <TutorCard
        tutor={realDbTutor}
        onBookTrial={onBookTrial}
        onSendMessage={onSendMessage}
      />
    );

    const trialBtn = screen.getByRole("button", { name: "Đăng ký ngay" });
    fireEvent.click(trialBtn);
    expect(onBookTrial).toHaveBeenCalledWith("profile-100");

    const messageBtn = screen.getByRole("link", { name: "Nhắn tin" });
    fireEvent.click(messageBtn);
    expect(onSendMessage).toHaveBeenCalledWith("profile-100");
  });

  it("opens HireTutorDialog when clicking Đăng ký ngay without onBookTrial callback", () => {
    renderWithQuery(<TutorCard tutor={realDbTutor} />);

    const trialBtn = screen.getByRole("button", { name: "Đăng ký ngay" });
    fireEvent.click(trialBtn);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(`Đăng ký học: ${realDbTutor.displayName}`)
    ).toBeInTheDocument();
  });

  it("gracefully omits missing database fields without inventing mock values", () => {
    const minimalTutor: TutorListItemResponse = {
      id: "profile-min",
      displayName: "Trần B",
      avatarUrl: null,
      bio: null,
      qualification: null,
      schoolName: null,
      specialization: null,
      experienceYears: null,
      teachingMethodology: null,
      achievements: null,
      sessionRateVnd: 100000,
      teachingModes: [],
      provinceCode: null,
      provinceName: null,
      districtCode: null,
      districtName: null,
      subjects: [],
      approvedAt: null,
    };

    renderWithQuery(<TutorCard tutor={minimalTutor} />);

    expect(screen.getByText("Trần B")).toBeInTheDocument();
    expect(screen.getByLabelText("100.000 VNĐ/buổi")).toBeInTheDocument();

    // Không tự ý sinh ra mock badges hay mock reviews
    expect(screen.queryByTitle("Gia sư đã được kiểm duyệt")).not.toBeInTheDocument();
    expect(screen.queryByText(/Phương pháp/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Professional/)).not.toBeInTheDocument();
    expect(screen.queryByText(/4\.9/)).not.toBeInTheDocument();
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument();
  });
});
