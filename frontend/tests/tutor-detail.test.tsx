import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import TutorDetailClient from "@/components/tutors/TutorDetailClient";
import { getTutorById, type PublicTutorDetail } from "@/lib/api/tutors";
import { ApiError } from "@/lib/api/http";
vi.mock("@/lib/api/tutors", async (original) => ({
  ...(await original<typeof import("@/lib/api/tutors")>()),
  getTutorById: vi.fn(),
}));
const profile = {
  id: "profile-1",
  displayName: "Gia sư An",
  avatarUrl: null,
  bio: "Giới thiệu công khai",
  qualification: "Cử nhân",
  experienceYears: 0,
  sessionRateVnd: 150000,
  teachingModes: ["ONLINE"],
  subjects: [
    {
      subjectId: "math",
      name: "Toán",
      levelCodes: ["HIGH_SCHOOL"],
      levelNames: ["THPT"],
    },
  ],
  availability: [
    {
      id: "a",
      dayOfWeek: 1,
      startTime: "18:00",
      endTime: "20:00",
      timeZone: "Asia/Ho_Chi_Minh",
    },
  ],
  courses: [
    {
      id: "c",
      subjectId: "math",
      subjectName: "Toán",
      name: "Ôn thi Toán",
      content: "Nội dung khóa",
      sessionCount: 8,
      pricePerSessionVnd: 150000,
    },
  ],
} as PublicTutorDetail;
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getTutorById).mockResolvedValue(profile);
});
function view() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TutorDetailClient profileId="profile-1" />
    </QueryClientProvider>
  );
}
it("renders public professional fields, per-subject levels, weekly availability and active courses", async () => {
  view();
  expect(
    await screen.findByRole("heading", { name: "Gia sư An" })
  ).toBeInTheDocument();
  expect(screen.getByText(/THPT/)).toBeInTheDocument();
  expect(screen.getByText("Thứ 2 · 18:00–20:00")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Ôn thi Toán" })
  ).toBeInTheDocument();
  expect(screen.getByText("0 năm")).toBeInTheDocument();
  expect(screen.queryByText(/Đã xác thực|4.9/)).not.toBeInTheDocument();
});
it("reports unavailable when eligibility is lost after opening the detail", async () => {
  view();
  await screen.findByRole("heading", { name: "Gia sư An" });
  vi.mocked(getTutorById).mockRejectedValue(
    new ApiError(404, "Unavailable", undefined, null, "/tutors/profile-1")
  );
  fireEvent.click(screen.getByRole("button", { name: "Kiểm tra lại hồ sơ" }));
  expect(
    await screen.findByRole("heading", {
      name: "Hồ sơ gia sư không còn khả dụng",
    })
  ).toBeInTheDocument();
  expect(screen.queryByText("Giới thiệu công khai")).not.toBeInTheDocument();
  expect(screen.queryByText("Ôn thi Toán")).not.toBeInTheDocument();
});
it("allows retry after a network error", async () => {
  vi.mocked(getTutorById).mockRejectedValueOnce(new Error("Offline"));
  view();
  expect(
    await screen.findByRole("heading", { name: "Không thể tải hồ sơ gia sư" })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Thử lại hồ sơ" }));
  expect(
    await screen.findByRole("heading", { name: "Gia sư An" })
  ).toBeInTheDocument();
});
it("shows offer empty states and never renders extra private payload fields", async () => {
  vi.mocked(getTutorById).mockResolvedValue({
    ...profile,
    availability: [],
    courses: [],
    email: "secret@example.test",
    phoneNumber: "0901234567",
    certifications: [{ fileUrl: "/private.pdf" }],
  } as PublicTutorDetail);
  view();
  expect(
    await screen.findByText("Gia sư chưa có lịch rảnh công khai.")
  ).toBeInTheDocument();
  expect(
    screen.getByText("Gia sư chưa có khóa học đang mở.")
  ).toBeInTheDocument();
  expect(screen.queryByText("secret@example.test")).not.toBeInTheDocument();
  expect(screen.queryByText("0901234567")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /chứng chỉ/i })
  ).not.toBeInTheDocument();
});
