import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import TutorDetailClient from "@/components/tutors/TutorDetailClient";
import { getTutorById, type PublicTutorDetail } from "@/lib/api/tutors";
import { ApiError } from "@/lib/api/http";
import { useAuthStore } from "@/stores/use-auth-store";
import { getSavedTutors, saveTutor, unsaveTutor } from "@/lib/api/saved-tutors";
vi.mock("@/lib/api/saved-tutors", () => ({
  getSavedTutors: vi.fn(),
  saveTutor: vi.fn(),
  unsaveTutor: vi.fn(),
}));
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
  useAuthStore.getState().clearAuth();
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
  const panel = screen.getByRole("complementary", {
    name: "Học phí và thuê gia sư",
  });
  expect(within(panel).getByText("0 năm")).toBeInTheDocument();
  expect(screen.queryByText(/Đã xác thực|4.9/)).not.toBeInTheDocument();
});
it("reports unavailable when eligibility is lost after opening the detail", async () => {
  view();
  await screen.findByRole("heading", { name: "Gia sư An" });
  vi.mocked(getTutorById).mockRejectedValue(
    new ApiError(404, "Unavailable", undefined, null, "/tutors/profile-1")
  );
  // The detail re-checks eligibility when the tab regains focus (refetchOnWindowFocus).
  act(() => {
    focusManager.setFocused(false);
    focusManager.setFocused(true);
  });
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

it("shows login required alert when clicking Thuê gia sư while unauthenticated", async () => {
  view();
  const hireBtn = await screen.findByRole("button", { name: "Thuê gia sư" });
  fireEvent.click(hireBtn);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    /Bạn cần đăng nhập để thực hiện thuê gia sư/i
  );
  expect(screen.getByRole("link", { name: "Đăng nhập ngay" })).toHaveAttribute(
    "href",
    "/login"
  );
});

function signInAs(role: "LEARNER" | "TUTOR") {
  useAuthStore.getState().setUser({
    id: "viewer-1",
    email: "viewer@example.test",
    fullName: "Người xem",
    role,
    status: "ACTIVE",
  } as Parameters<ReturnType<typeof useAuthStore.getState>["setUser"]>[0]);
}

it("shows price, rating and experience next to the hire button", async () => {
  vi.mocked(getTutorById).mockResolvedValue({
    ...profile,
    averageRating: 4.86,
    reviewCount: 27,
    experienceYears: 5,
  } as PublicTutorDetail);
  view();
  const panel = await screen.findByRole("complementary", {
    name: "Học phí và thuê gia sư",
  });
  expect(within(panel).getByText("150.000đ")).toBeInTheDocument();
  expect(within(panel).getByText("4.9")).toBeInTheDocument();
  expect(within(panel).getByText("27 đánh giá")).toBeInTheDocument();
  expect(within(panel).getByText("5 năm")).toBeInTheDocument();
  expect(
    within(panel).getByRole("button", { name: "Thuê gia sư" })
  ).toBeInTheDocument();
  expect(
    within(panel).getByRole("button", { name: "Chia sẻ hồ sơ" })
  ).toBeInTheDocument();
});

it("asks a visitor to sign in before saving a tutor", async () => {
  view();
  // The cover bookmark and the side-panel heart are the same action.
  const [coverSave] = await screen.findAllByRole("button", {
    name: "Lưu gia sư",
  });
  fireEvent.click(coverSave);
  expect(
    screen.getByRole("link", { name: "Đăng nhập ngay" })
  ).toBeInTheDocument();
  expect(saveTutor).not.toHaveBeenCalled();
});

it("lets a learner save and unsave the tutor from the cover or the side panel", async () => {
  signInAs("LEARNER");
  const savedRow = {
    tutorProfileId: "profile-1",
    savedAt: "2026-11-14T00:00:00Z",
  };
  // Server state: empty first, then saved after the PUT.
  vi.mocked(getSavedTutors)
    .mockResolvedValueOnce([])
    .mockResolvedValue([savedRow]);
  vi.mocked(saveTutor).mockResolvedValue();
  vi.mocked(unsaveTutor).mockResolvedValue();
  view();
  const panel = await screen.findByRole("complementary", {
    name: "Học phí và thuê gia sư",
  });
  const [coverSave] = screen.getAllByRole("button", { name: "Lưu gia sư" });
  await waitFor(() => expect(coverSave).toBeEnabled());
  fireEvent.click(coverSave);
  await waitFor(() => expect(saveTutor).toHaveBeenCalledWith("profile-1"));
  // Both controls reflect the shared saved state.
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: "Bỏ lưu gia sư" })
    ).toHaveLength(2)
  );
  const panelUnsave = within(panel).getByRole("button", {
    name: "Bỏ lưu gia sư",
  });
  expect(panelUnsave).toHaveAttribute("aria-pressed", "true");
  await waitFor(() => expect(panelUnsave).toBeEnabled());
  vi.mocked(getSavedTutors).mockResolvedValue([]);
  fireEvent.click(panelUnsave);
  await waitFor(() => expect(unsaveTutor).toHaveBeenCalledWith("profile-1"));
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: "Lưu gia sư" })).toHaveLength(
      2
    )
  );
});

it("hides the save button from tutors", async () => {
  signInAs("TUTOR");
  view();
  await screen.findByRole("button", { name: "Thuê gia sư" });
  expect(screen.queryByRole("button", { name: /Lưu gia sư/ })).toBeNull();
  expect(getSavedTutors).not.toHaveBeenCalled();
});

it("shows the cover header with qualification and a subjects chip", async () => {
  vi.mocked(getTutorById).mockResolvedValue({
    ...profile,
    schoolName: "ĐH Sư phạm",
    subjects: [
      ...profile.subjects,
      { subjectId: "phy", name: "Vật lý", levelCodes: [], levelNames: [] },
      { subjectId: "chem", name: "Hóa học", levelCodes: [], levelNames: [] },
    ],
  } as PublicTutorDetail);
  view();
  expect(
    await screen.findByRole("heading", { level: 1, name: "Gia sư An" })
  ).toBeInTheDocument();
  expect(screen.getByText("Cử nhân · ĐH Sư phạm")).toBeInTheDocument();
  expect(screen.getByText(/Toán · Vật lý\s*\+1/)).toBeInTheDocument();
});
