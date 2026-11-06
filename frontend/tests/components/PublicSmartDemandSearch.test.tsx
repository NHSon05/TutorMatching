import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PublicSmartDemandSearch } from "@/components/tutors/PublicSmartDemandSearch";
import * as tutorDemandsApi from "@/lib/api/tutor-demands";

vi.mock("@/lib/api/tutor-demands", () => ({
  submitPublicTutorDemand: vi.fn(),
}));

describe("PublicSmartDemandSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits natural-language demand and renders extracted criteria tags and matched tutors", async () => {
    vi.mocked(tutorDemandsApi.submitPublicTutorDemand).mockResolvedValueOnce({
      demandPostId: "11111111-1111-1111-1111-111111111111",
      isDeduplicatedHit: false,
      extractedCriteria: {
        subjectId: "22222222-2222-2222-2222-222222222222",
        subjectName: "Toán",
        gradeLevel: 9,
        tuitionFeeVnd: 250000,
        feePeriod: "PER_SESSION",
        isFeeNegotiable: false,
        sessionsPerWeek: 2,
        teachingMode: "OFFLINE",
        provinceCode: "HN",
        provinceName: "Hà Nội",
        districtCode: "HN_CG",
        districtName: "Quận Cầu Giấy",
        rawAddress: "Cầu Giấy",
        isLocationAmbiguous: false,
        confidenceScore: 0.95,
      },
      matchedTutors: [
        {
          tutorProfileId: "33333333-3333-3333-3333-333333333333",
          displayName: "Nguyễn Minh Tuấn",
          avatarUrl: null,
          headline: "Giáo viên Toán THCS",
          listedPriceVnd: 250000,
          isNegotiable: true,
          teachingModeCode: "OFFLINE",
          provinceName: "Hà Nội",
          districtName: "Quận Cầu Giấy",
          subjects: ["Toán"],
          matchScore: 0.96,
          matchHighlights: ["Đúng môn Toán", "Cùng Quận Cầu Giấy"],
        },
      ],
    });

    render(<PublicSmartDemandSearch />);

    const textarea = screen.getByLabelText(/nhập nhu cầu tìm gia sư/i);
    fireEvent.change(textarea, {
      target: {
        value:
          "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi",
      },
    });

    const submitButton = screen.getByRole("button", {
      name: /tìm & khớp nối gia sư/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(tutorDemandsApi.submitPublicTutorDemand).toHaveBeenCalledWith(
        "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi"
      );
    });

    expect(await screen.findByText("Môn: Toán")).toBeInTheDocument();
    expect(screen.getByText("Lớp 9")).toBeInTheDocument();
    expect(screen.getByText("Nguyễn Minh Tuấn")).toBeInTheDocument();
    expect(screen.getByText("Đúng môn Toán")).toBeInTheDocument();
  });

  it("shows location ambiguity warning when district could not be resolved", async () => {
    vi.mocked(tutorDemandsApi.submitPublicTutorDemand).mockResolvedValueOnce({
      demandPostId: "11111111-1111-1111-1111-111111111111",
      isDeduplicatedHit: false,
      extractedCriteria: {
        subjectId: "22222222-2222-2222-2222-222222222222",
        subjectName: "Hóa học",
        gradeLevel: 11,
        tuitionFeeVnd: 300000,
        feePeriod: "PER_SESSION",
        isFeeNegotiable: false,
        sessionsPerWeek: 2,
        teachingMode: "OFFLINE",
        provinceCode: "HN",
        provinceName: "Hà Nội",
        districtCode: null,
        districtName: null,
        rawAddress: "Hà Nội",
        isLocationAmbiguous: true,
        confidenceScore: 0.78,
      },
      matchedTutors: [],
    });

    render(<PublicSmartDemandSearch />);

    const textarea = screen.getByLabelText(/nhập nhu cầu tìm gia sư/i);
    fireEvent.change(textarea, {
      target: {
        value: "Cần tìm gia sư Hóa lớp 11 tại Hà Nội học phí 300k/buổi",
      },
    });

    fireEvent.click(
      screen.getByRole("button", { name: /tìm & khớp nối gia sư/i })
    );

    expect(
      await screen.findByText(/chưa xác định rõ quận\/huyện/i)
    ).toBeInTheDocument();
  });
});
