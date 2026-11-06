import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LandingDemandChat } from "@/components/landing/LandingDemandChat";
import * as tutorDemandsApi from "@/lib/api/tutor-demands";

vi.mock("@/lib/api/tutor-demands", () => ({
  submitPublicTutorDemand: vi.fn(),
}));

describe("LandingDemandChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens dialog rendering TutorCard with suitable percent and detailed tutor profile fields on prompt submit", async () => {
    vi.mocked(tutorDemandsApi.submitPublicTutorDemand).mockResolvedValueOnce({
      demandPostId: "11111111-1111-1111-1111-111111111111",
      isDeduplicatedHit: false,
      extractedCriteria: {
        subjectId: "22222222-2222-2222-2222-222222222222",
        subjectName: "Tin học",
        gradeLevel: 12,
        tuitionFeeVnd: 600000,
        feePeriod: "PER_SESSION",
        isFeeNegotiable: false,
        sessionsPerWeek: 2,
        teachingMode: "ONLINE",
        provinceCode: "HCM",
        provinceName: "TP. Hồ Chí Minh",
        districtCode: "HCM_TB",
        districtName: "Quận Tân Bình",
        rawAddress: "Tân Bình",
        isLocationAmbiguous: false,
        confidenceScore: 0.96,
      },
      matchedTutors: [
        {
          tutorProfileId: "33333333-3333-3333-3333-333333333333",
          displayName: "Lê Tuấn Kiệt",
          avatarUrl: "https://example.com/avatar.jpg",
          headline: "Senior Fullstack Developer",
          listedPriceVnd: 600000,
          sessionRateVnd: 600000,
          isNegotiable: true,
          teachingModeCode: "ONLINE",
          teachingModes: ["ONLINE", "OFFLINE"],
          provinceName: "TP. Hồ Chí Minh",
          districtName: "Quận Tân Bình",
          subjects: ["Tin học", "Lập trình"],
          matchScore: 0.96,
          matchHighlights: ["Đúng môn Tin học", "Cùng Quận Tân Bình"],
          specialization:
            "Tự nghiên cứu & 6 năm kinh nghiệm Senior Fullstack Developer",
          experienceYears: 6,
          teachingMethodology:
            "Học lập trình qua dự án thực tế (Project-based learning); code trực tiếp, review pull request và debug lỗi như môi trường doanh nghiệp.",
          bio: "Lập trình viên thực chiến với 6 năm kinh nghiệm tại các công ty công nghệ lớn.",
        },
      ],
    });

    render(<LandingDemandChat />);

    const textarea = screen.getByPlaceholderText(/cần tìm gia sư dạy toán/i);
    fireEvent.change(textarea, {
      target: {
        value:
          "Cần tìm gia sư dạy Tin học lập trình tại Quận Tân Bình TP.HCM, học phí 600k/buổi",
      },
    });

    const submitButton = screen.getByRole("button", { name: /gửi yêu cầu/i });
    fireEvent.click(submitButton);

    // Dialog opens and displays TutorCard with suitable percent and real tutor details
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Lê Tuấn Kiệt")).toBeInTheDocument();
    expect(screen.getByText("Phù hợp 96%")).toBeInTheDocument();
    expect(
      screen.getByText("Quận Tân Bình, TP. Hồ Chí Minh")
    ).toBeInTheDocument();
    expect(screen.getByText("Tin học / Lập trình")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Trực tuyến / Trực tiếp • Tự nghiên cứu & 6 năm kinh nghiệm Senior Fullstack Developer"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Học lập trình qua dự án thực tế/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lập trình viên thực chiến với 6 năm kinh nghiệm/)
    ).toBeInTheDocument();
    expect(screen.getByText("600.000đ")).toBeInTheDocument();
    expect(screen.getByText("6 năm")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Đăng ký ngay" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nhắn tin" })).toHaveAttribute(
      "href",
      "/messages?tutorId=33333333-3333-3333-3333-333333333333"
    );
    expect(
      screen.getByRole("link", { name: "Xem hồ sơ Lê Tuấn Kiệt" })
    ).toHaveAttribute("href", "/tutors/33333333-3333-3333-3333-333333333333");
  });

  it("shows validation alert for short messages without opening dialog", async () => {
    render(<LandingDemandChat />);

    const textarea = screen.getByPlaceholderText(/cần tìm gia sư dạy toán/i);
    fireEvent.change(textarea, { target: { value: "Toán 9" } });
    fireEvent.click(screen.getByRole("button", { name: /gửi yêu cầu/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /ít nhất 10 ký tự/i
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(tutorDemandsApi.submitPublicTutorDemand).not.toHaveBeenCalled();
  });
});
