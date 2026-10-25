import { screen, fireEvent, render as testingRender } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HireTutorDialog } from "@/components/tutors/HireTutorDialog";
import { getTutorById, type PublicTutorDetail } from "@/lib/api/tutors";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/api/tutors", async (original) => ({
  ...(await original<typeof import("@/lib/api/tutors")>()),
  getTutorById: vi.fn(),
}));

const mockTutorDetail: PublicTutorDetail = {
  id: "profile-100",
  displayName: "Nguyễn Văn A",
  avatarUrl: "/uploads/avatars/user-100.png",
  bio: "Hơn 5 năm kinh nghiệm gia sư chuyên Toán",
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
  availability: [
    {
      id: "slot-1",
      dayOfWeek: 1,
      startTime: "18:00",
      endTime: "20:00",
      timeZone: "Asia/Ho_Chi_Minh",
    },
    {
      id: "slot-2",
      dayOfWeek: 3,
      startTime: "19:00",
      endTime: "21:00",
      timeZone: "Asia/Ho_Chi_Minh",
    },
  ],
  courses: [],
};

function renderDialog(props: React.ComponentProps<typeof HireTutorDialog>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return testingRender(
    <QueryClientProvider client={queryClient}>
      <HireTutorDialog {...props} />
    </QueryClientProvider>
  );
}

describe("HireTutorDialog Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTutorById).mockResolvedValue(mockTutorDetail);
  });

  it("calls getTutorById when opened with tutorId and renders tutor details", async () => {
    const onClose = vi.fn();
    renderDialog({
      isOpen: true,
      onClose,
      tutorId: "profile-100",
    });

    expect(getTutorById).toHaveBeenCalledWith(
      "profile-100",
      expect.anything()
    );

    expect(
      await screen.findByText("Đăng ký học: Nguyễn Văn A")
    ).toBeInTheDocument();
    expect(screen.getAllByText("250.000đ/buổi").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Trực tuyến / Trực tiếp").length).toBeGreaterThan(0);
    expect(screen.getByText(/Thứ 2:\s*18:00/)).toBeInTheDocument();
  });

  it("submits the hiring form and displays confirmation screen", async () => {
    const onClose = vi.fn();
    renderDialog({
      isOpen: true,
      onClose,
      tutorId: "profile-100",
    });

    await screen.findByText("Đăng ký học: Nguyễn Văn A");

    const submitBtn = screen.getByRole("button", {
      name: "Gửi yêu cầu thuê gia sư →",
    });
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText("Đã gửi yêu cầu thuê gia sư!")
    ).toBeInTheDocument();
    expect(screen.getByText(/Yêu cầu của bạn đã được gửi thành công/)).toBeInTheDocument();
  });

  it("handles dialog close when cancel or close button is clicked", async () => {
    const onClose = vi.fn();
    renderDialog({
      isOpen: true,
      onClose,
      tutorId: "profile-100",
    });

    await screen.findByText("Đăng ký học: Nguyễn Văn A");

    const cancelBtn = screen.getByRole("button", { name: "Hủy" });
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
