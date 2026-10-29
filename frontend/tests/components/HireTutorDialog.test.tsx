import {
  act,
  screen,
  fireEvent,
  render as testingRender,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TutorDetailClient from "@/components/tutors/TutorDetailClient";
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
  const rendered = testingRender(
    <QueryClientProvider client={queryClient}>
      <HireTutorDialog {...props} />
    </QueryClientProvider>
  );
  return { ...rendered, queryClient };
}

vi.mock("@/lib/api/hire-requests", () => ({ createHireRequest: vi.fn() }));
vi.mock("@/lib/api/catalog", () => ({
  getPublicCatalog: vi.fn().mockResolvedValue([]),
}));
import { createHireRequest } from "@/lib/api/hire-requests";
import { ApiError } from "@/lib/api/http";

const outcome = {
  id: "request-1",
  version: "v1",
  status: "PENDING" as const,
  conversationId: "conversation-1",
};
async function fill() {
  await screen.findByText("Đăng ký học: Nguyễn Văn A");
  fireEvent.change(screen.getByLabelText("Ngày bắt đầu"), {
    target: { value: "2099-01-01" },
  });
  fireEvent.click(screen.getByLabelText(/Thứ 2: 18:00/));
}
const submit = () =>
  fireEvent.click(
    screen.getByRole("button", { name: "Gửi yêu cầu thuê gia sư →" })
  );
describe("HireTutorDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTutorById).mockResolvedValue(mockTutorDetail);
    vi.mocked(createHireRequest).mockResolvedValue(outcome);
  });
  it("submits selected real terms and waits for server confirmation", async () => {
    let complete!: (value: typeof outcome) => void;
    vi.mocked(createHireRequest).mockReturnValue(
      new Promise((resolve) => {
        complete = resolve;
      })
    );
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await fill();
    submit();
    expect(
      screen.queryByText("Đã gửi yêu cầu thuê gia sư!")
    ).not.toBeInTheDocument();
    expect(createHireRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        tutorProfileId: "profile-100",
        subjectId: "math",
        priceVnd: 250000,
        expectedListedPriceVnd: 250000,
        startDate: "2099-01-01",
        schedules: [{ dayOfWeek: 1, startTime: "18:00", endTime: "20:00" }],
      }),
      expect.any(String)
    );
    fireEvent.submit(screen.getByLabelText("Ngày bắt đầu").closest("form")!);
    expect(createHireRequest).toHaveBeenCalledTimes(1);
    complete(outcome);
    expect(
      await screen.findByText("Đã gửi yêu cầu thuê gia sư!")
    ).toBeInTheDocument();
  });
  it("validates required date and windows without submitting", async () => {
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await screen.findByText("Đăng ký học: Nguyễn Văn A");
    submit();
    expect(createHireRequest).not.toHaveBeenCalled();
  });
  it("retains input and identity on a failed transport, changes identity after an edit", async () => {
    vi.mocked(createHireRequest).mockRejectedValue(new Error("Network"));
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await fill();
    submit();
    await screen.findByRole("alert");
    const key = vi.mocked(createHireRequest).mock.calls[0][1];
    expect(screen.getByLabelText("Ngày bắt đầu")).toHaveValue("2099-01-01");
    submit();
    await screen.findByRole("alert");
    expect(vi.mocked(createHireRequest).mock.calls[1][1]).toBe(key);
    fireEvent.change(screen.getByLabelText("Ghi chú"), {
      target: { value: "Changed" },
    });
    submit();
    await screen.findByRole("alert");
    expect(vi.mocked(createHireRequest).mock.calls[2][1]).not.toBe(key);
  });
  it("shows conflict and allows refreshing current offering without losing notes", async () => {
    vi.mocked(createHireRequest).mockRejectedValue(
      new ApiError(409, "Giá đã thay đổi", undefined, null, "/hire-requests")
    );
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await fill();
    submit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Giá đã thay đổi"
    );
    expect(
      screen.getByRole("button", { name: "Cập nhật giá và lịch" })
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Đã gửi yêu cầu thuê gia sư!")
    ).not.toBeInTheDocument();
  });
});

it("keeps retry payload stable when public pricing refreshes in the background", async () => {
  vi.mocked(getTutorById).mockResolvedValue(mockTutorDetail);
  vi.mocked(createHireRequest)
    .mockReset()
    .mockRejectedValue(new Error("Network"));
  const { queryClient } = renderDialog({
    isOpen: true,
    onClose: vi.fn(),
    tutorId: "profile-100",
  });
  await fill();
  submit();
  await screen.findByRole("alert");
  const first = vi.mocked(createHireRequest).mock.calls[0];
  act(() =>
    queryClient.setQueryData(["public-tutor-detail", "profile-100"], {
      ...mockTutorDetail,
      sessionRateVnd: 999999,
    })
  );
  submit();
  await screen.findByRole("alert");
  expect(vi.mocked(createHireRequest).mock.calls[1]).toEqual(first);
});

describe("hire form refresh and reducer transitions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTutorById).mockResolvedValue(mockTutorDetail);
    vi.mocked(createHireRequest).mockRejectedValue(new Error("Network"));
  });

  it("retains the form and retry key after a failed background detail refetch", async () => {
    const { queryClient } = renderDialog({
      isOpen: true,
      onClose: vi.fn(),
      tutorId: "profile-100",
    });
    await fill();
    submit();
    await screen.findByRole("alert");
    const first = vi.mocked(createHireRequest).mock.calls[0];
    vi.mocked(getTutorById).mockRejectedValue(new Error("Offline"));
    await act(async () => {
      await queryClient.refetchQueries({
        queryKey: ["public-tutor-detail", "profile-100"],
      });
    });
    expect(screen.getByLabelText("Ngày bắt đầu")).toHaveValue("2099-01-01");
    submit();
    await screen.findByRole("alert");
    expect(vi.mocked(createHireRequest).mock.calls[1]).toEqual(first);
  });

  it("keeps an open hire form mounted when the parent detail page refetch fails", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    testingRender(
      <QueryClientProvider client={queryClient}>
        <TutorDetailClient profileId="profile-100" />
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole("button", { name: "Thuê gia sư" }));
    await fill();
    submit();
    await screen.findByRole("alert");
    const first = vi.mocked(createHireRequest).mock.calls[0];
    vi.mocked(getTutorById).mockRejectedValue(new Error("Offline"));
    await act(async () => {
      await queryClient.refetchQueries({
        queryKey: ["public-tutor-detail", "profile-100"],
      });
    });
    expect(screen.getByLabelText("Ngày bắt đầu")).toHaveValue("2099-01-01");
    submit();
    await screen.findByText(/Chưa nhận được xác nhận/);
    expect(vi.mocked(createHireRequest).mock.calls[1]).toEqual(first);
  });

  it("preserves notes and valid schedules, drops removed slots on explicit refresh", async () => {
    vi.mocked(createHireRequest).mockRejectedValue(
      new ApiError(409, "Lịch đã thay đổi", undefined, null, "/hire-requests")
    );
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await fill();
    fireEvent.click(screen.getByLabelText(/Thứ 4: 19:00/));
    fireEvent.change(screen.getByLabelText("Ghi chú"), {
      target: { value: "Giữ ghi chú" },
    });
    submit();
    await screen.findByRole("alert");
    vi.mocked(getTutorById).mockResolvedValue({
      ...mockTutorDetail,
      availability: [mockTutorDetail.availability[1]],
      sessionRateVnd: 300000,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Cập nhật giá và lịch" })
    );
    await screen.findByText(/Khung giờ không còn hợp lệ đã được bỏ chọn/);
    expect(screen.getByLabelText("Ghi chú")).toHaveValue("Giữ ghi chú");
    expect(screen.queryByLabelText(/Thứ 2: 18:00/)).not.toBeInTheDocument();
    vi.mocked(createHireRequest).mockResolvedValue(outcome);
    submit();
    await screen.findByText("Đã gửi yêu cầu thuê gia sư!");
    expect(vi.mocked(createHireRequest).mock.calls[1][0]).toMatchObject({
      note: "Giữ ghi chú",
      expectedListedPriceVnd: 300000,
      schedules: [{ dayOfWeek: 3, startTime: "19:00", endTime: "21:00" }],
    });
  });

  it("preserves the snapshot and retry identity when explicit refresh fails", async () => {
    vi.mocked(createHireRequest).mockRejectedValue(
      new ApiError(409, "Giá đã thay đổi", undefined, null, "/hire-requests")
    );
    renderDialog({ isOpen: true, onClose: vi.fn(), tutorId: "profile-100" });
    await fill();
    submit();
    await screen.findByRole("alert");
    const first = vi.mocked(createHireRequest).mock.calls[0];
    vi.mocked(getTutorById).mockRejectedValue(new Error("Offline"));
    fireEvent.click(
      screen.getByRole("button", { name: "Cập nhật giá và lịch" })
    );
    await screen.findByText(/Không cập nhật được giá và lịch/);
    submit();
    await screen.findByRole("alert");
    expect(vi.mocked(createHireRequest).mock.calls[1]).toEqual(first);
  });
});
