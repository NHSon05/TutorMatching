import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TutorLiveMatchedPostsFeed } from "@/components/tutor/TutorLiveMatchedPostsFeed";

vi.mock("@/hooks/usePostMatchStream", () => ({
  usePostMatchStream: () => ({
    status: "connected",
    lastEventId: "1001",
    liveItems: [
      {
        notificationId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        demandPostId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
        subjectName: "Toán",
        gradeLevel: 9,
        tuitionFeeVnd: 250000,
        feePeriod: "PER_SESSION",
        teachingMode: "OFFLINE",
        provinceName: "Hà Nội",
        districtName: "Quận Cầu Giấy",
        rawAddress: "Ngõ 165 Cầu Giấy",
        rawContent:
          "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi",
        isLocationAmbiguous: false,
        matchScore: 0.95,
        createdAt: "2026-11-06T10:00:00Z",
        isRead: false,
      },
    ],
  }),
}));

describe("TutorLiveMatchedPostsFeed", () => {
  it("renders realtime connection status and matched demand cards", () => {
    render(<TutorLiveMatchedPostsFeed />);

    expect(screen.getByText(/đang nhận thông báo trực tuyến/i)).toBeInTheDocument();
    expect(screen.getByText("Toán • Lớp 9")).toBeInTheDocument();
    expect(screen.getByText("Quận Cầu Giấy, Hà Nội")).toBeInTheDocument();
    expect(
      screen.getByText(
        /cần tìm gia sư dạy toán lớp 9 ôn thi vào 10 tại quận cầu giấy/i
      )
    ).toBeInTheDocument();
  });
});
