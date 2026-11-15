import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TutorScheduleClient } from "@/components/tutor/schedule/TutorScheduleClient";
import {
  getAvailability,
  removeOffer,
  saveAvailability,
} from "@/lib/api/tutor-offers";
import { ApiError } from "@/lib/api/http";
import type { HireDetail } from "@/lib/api/hire-requests";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/api/tutor-offers", () => ({
  getAvailability: vi.fn(),
  saveAvailability: vi.fn(),
  removeOffer: vi.fn(),
}));

const hires = vi.hoisted(() => ({
  details: [] as { data?: unknown; isPending: boolean; isError: boolean }[],
}));
vi.mock("@/hooks/use-in-progress-hires", () => ({
  useInProgressHires: () => ({
    list: { isPending: false, isError: false, refetch: vi.fn() },
    items: hires.details.map((_, i) => ({ id: `hire-${i}` })),
    details: hires.details,
  }),
}));

const lesson = (paid: boolean) =>
  ({
    id: "hire-1",
    learner: { id: "l1", displayName: "Minh Anh" },
    tutor: { id: "t1", displayName: "Gia sư" },
    paymentStatus: paid ? "PAID" : "UNPAID",
    currentTerms: {
      teachingMode: "ONLINE",
      schedules: [{ dayOfWeek: 2, startTime: "19:00", endTime: "20:30" }],
    },
  }) as unknown as HireDetail;

function view() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <TutorScheduleClient accountId="tutor-1" />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  hires.details = [];
  vi.mocked(getAvailability).mockResolvedValue([
    {
      id: "slot-1",
      dayOfWeek: 1,
      startTime: "18:00",
      endTime: "21:00",
      timeZone: "Asia/Ho_Chi_Minh",
    },
  ]);
});

describe("TutorScheduleClient", () => {
  it("shows weekly free time and booked lessons on the calendar", async () => {
    hires.details = [{ data: lesson(false), isPending: false, isError: false }];
    view();
    expect(
      await screen.findByRole("button", {
        name: "Lịch rảnh, Thứ 2 18:00–21:00",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "HV. Minh Anh, Thứ 3 19:00–20:30, Trực tuyến",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("3 giờ")).toBeInTheDocument();
    expect(screen.getByText(/1 khung giờ/)).toBeInTheDocument();
    expect(
      screen.getByText(/buổi chưa được thanh toán/).previousSibling
    ).toHaveTextContent("1");
  });

  it("adds free time by clicking an empty calendar cell", async () => {
    vi.mocked(saveAvailability).mockResolvedValue({
      id: "slot-2",
      dayOfWeek: 3,
      startTime: "08:00",
      endTime: "09:00",
      timeZone: "Asia/Ho_Chi_Minh",
    });
    view();
    fireEvent.click(
      await screen.findByRole("button", { name: "Thêm lịch rảnh Thứ 4 08:00" })
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByLabelText("Giờ bắt đầu")).toHaveValue("08:00");
    expect(within(dialog).getByLabelText("Giờ kết thúc")).toHaveValue("09:00");
    fireEvent.change(within(dialog).getByLabelText("Giờ kết thúc"), {
      target: { value: "10:30" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Lưu lịch rảnh" })
    );
    await waitFor(() =>
      expect(saveAvailability).toHaveBeenCalledWith(
        { dayOfWeek: 3, startTime: "08:00", endTime: "10:30" },
        undefined
      )
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
    expect(getAvailability).toHaveBeenCalledTimes(2);
  });

  it("edits and deletes an existing free-time slot", async () => {
    vi.mocked(saveAvailability).mockResolvedValue({
      id: "slot-1",
      dayOfWeek: 1,
      startTime: "17:00",
      endTime: "21:00",
      timeZone: "Asia/Ho_Chi_Minh",
    });
    vi.mocked(removeOffer).mockResolvedValue();
    view();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Lịch rảnh, Thứ 2 18:00–21:00",
      })
    );
    let dialog = screen.getByRole("dialog", { name: undefined });
    expect(within(dialog).getByText("Sửa lịch rảnh")).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText("Giờ bắt đầu"), {
      target: { value: "17:00" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Lưu lịch rảnh" })
    );
    await waitFor(() =>
      expect(saveAvailability).toHaveBeenCalledWith(
        { dayOfWeek: 1, startTime: "17:00", endTime: "21:00" },
        "slot-1"
      )
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Lịch rảnh, Thứ 2 18:00–21:00",
      })
    );
    dialog = screen.getByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Xóa khung giờ" })
    );
    await waitFor(() =>
      expect(removeOffer).toHaveBeenCalledWith("availability", "slot-1")
    );
  });

  it("explains overlaps and keeps the edited times", async () => {
    vi.mocked(saveAvailability).mockRejectedValue(
      new ApiError(409, "Overlap", undefined, null, "/tutor/availability")
    );
    view();
    fireEvent.click(
      await screen.findByRole("button", { name: "Thêm lịch rảnh" })
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Giờ bắt đầu"), {
      target: { value: "18:30" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Lưu lịch rảnh" })
    );
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "trùng với lịch rảnh"
    );
    expect(within(dialog).getByLabelText("Giờ bắt đầu")).toHaveValue("18:30");
  });

  it("blocks saving when the end time is not after the start time", async () => {
    view();
    fireEvent.click(
      await screen.findByRole("button", { name: "Thêm lịch rảnh" })
    );
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Giờ kết thúc"), {
      target: { value: "17:00" },
    });
    expect(
      within(dialog).getByText("Giờ kết thúc phải sau giờ bắt đầu.")
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: "Lưu lịch rảnh" })
    ).toBeDisabled();
  });

  it("opens the hire request when a lesson is clicked", async () => {
    hires.details = [{ data: lesson(true), isPending: false, isError: false }];
    view();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "HV. Minh Anh, Thứ 3 19:00–20:30, Trực tuyến",
      })
    );
    expect(push).toHaveBeenCalledWith("/request/hire-1");
  });

  it("reports a load failure with retry", async () => {
    vi.mocked(getAvailability).mockRejectedValue(new Error("Network"));
    view();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Không tải được lịch dạy"
    );
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});
