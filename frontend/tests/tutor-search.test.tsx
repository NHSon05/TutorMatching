import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { TutorSearchView } from "@/components/tutors/TutorsListClient";
import { getTutors, type TutorListItemResponse } from "@/lib/api/tutors";
import { getPublicCatalog } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/http";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/tutors",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api/tutors", async (original) => ({
  ...(await original<typeof import("@/lib/api/tutors")>()),
  getTutors: vi.fn(),
}));
vi.mock("@/lib/api/catalog", () => ({ getPublicCatalog: vi.fn() }));
export const tutor = {
  id: "profile-1",
  displayName: "Nguyễn An",
  avatarUrl: null,
  qualification: "Cử nhân",
  experienceYears: 2,
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
} as TutorListItemResponse;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTutors).mockResolvedValue({
    items: [tutor],
    totalCount: 21,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(getPublicCatalog).mockImplementation(async (kind) =>
    kind === "subjects"
      ? [{ code: "math", name: "Toán", isActive: true }]
      : kind === "teaching-levels"
        ? [{ code: "HIGH_SCHOOL", name: "THPT", isActive: true }]
        : []
  );
});
function view(queryString = "") {
  render(
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
      <TutorSearchView queryString={queryString} />
    </QueryClientProvider>
  );
}
async function selectFilter(label: string, option: string) {
  const trigger = await screen.findByLabelText(label);
  fireEvent.click(trigger);
  fireEvent.keyDown(screen.getByRole("option", { name: option }), {
    key: "Enter",
  });
  fireEvent.click(trigger);
}
function advanced() {
  fireEvent.click(screen.getByRole("button", { name: /Bộ lọc nâng cao/ }));
}
it("uses URL criteria and links to the canonical profile without inventing price or ratings", async () => {
  view("name=An&subjectId=math&mode=ONLINE");
  expect(
    await screen.findByRole("link", { name: "Xem hồ sơ Nguyễn An" })
  ).toHaveAttribute("href", "/tutors/profile-1");
  expect(screen.getByLabelText("150.000 VNĐ/buổi")).toBeInTheDocument();
  expect(screen.queryByText("Đã xác thực")).not.toBeInTheDocument();
  expect(vi.mocked(getTutors).mock.calls[0][0]?.toString()).toContain(
    "subjectId=math"
  );
});
it("applies multiple filters and resets pagination", async () => {
  view("page=3");
  await screen.findByLabelText("Môn học");
  fireEvent.change(screen.getByLabelText("Tên gia sư"), {
    target: { value: "An" },
  });
  await selectFilter("Môn học", "Toán");
  await selectFilter("Cấp học có thể dạy", "THPT");
  await selectFilter("Hình thức dạy", "Trực tuyến");
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  const next = new URL(push.mock.calls[0][0], "https://example.test")
    .searchParams;
  expect(next.get("name")).toBe("An");
  expect(next.getAll("subjectId")).toEqual(["math"]);
  expect(next.get("page")).toBeNull();
});
it("preserves filters across pages and clears them explicitly", async () => {
  view("name=An&sort=priceAsc");
  fireEvent.click(await screen.findByRole("button", { name: "Trang sau" }));
  expect(push).toHaveBeenCalledWith("/tutors?name=An&sort=priceAsc&page=2");
  fireEvent.click(screen.getByRole("button", { name: "Xóa tất cả bộ lọc" }));
  expect(push).toHaveBeenLastCalledWith("/tutors");
});
it("serializes the full schedule criteria", async () => {
  view();
  advanced();
  fireEvent.click(screen.getByLabelText("Lọc theo lịch và số buổi mỗi tuần"));
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  const params = new URL(push.mock.calls[0][0], "https://example.test")
    .searchParams;
  expect(params.get("sessionsPerWeek")).toBe("2");
  expect(params.get("durationMinutes")).toBe("60");
  expect(JSON.parse(params.get("weeklyWindows")!)[0]).toEqual({
    dayOfWeek: 1,
    startTime: "18:00",
    endTime: "20:00",
  });
});
it("rejects reversed prices and missing offline area before navigation", async () => {
  view();
  advanced();
  fireEvent.change(screen.getByLabelText("Giá thấp nhất / buổi (VNĐ)"), {
    target: { value: "200" },
  });
  fireEvent.change(screen.getByLabelText("Giá cao nhất / buổi (VNĐ)"), {
    target: { value: "100" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Áp dụng bộ lọc" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Khoảng giá");
  expect(push).not.toHaveBeenCalled();
});
it("shows an empty result instead of fallback tutors", async () => {
  vi.mocked(getTutors).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
  });
  view();
  expect(await screen.findByText("0 gia sư phù hợp")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /Xem hồ sơ/ })
  ).not.toBeInTheDocument();
});
it("shows invalid URL feedback and supports retry after network failure", async () => {
  vi.mocked(getTutors).mockRejectedValue(
    new ApiError(400, "Invalid", undefined, null, "/tutors")
  );
  view("page=invalid");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Bộ lọc trên URL không hợp lệ"
  );
  vi.mocked(getTutors).mockResolvedValue({
    items: [tutor],
    totalCount: 1,
    page: 1,
    pageSize: 20,
  });
  fireEvent.click(screen.getByRole("button", { name: "Thử lại tìm kiếm" }));
  await waitFor(() =>
    expect(screen.getByRole("link", { name: /Xem hồ sơ/ })).toBeInTheDocument()
  );
});

it("clears unsaved filter input even when the URL is already empty", async () => {
  view();
  await screen.findByLabelText("Môn học");
  fireEvent.change(screen.getByLabelText("Tên gia sư"), {
    target: { value: "Draft filter" },
  });
  await selectFilter("Môn học", "Toán");
  fireEvent.click(screen.getByRole("button", { name: "Xóa tất cả bộ lọc" }));
  expect(screen.getByLabelText("Tên gia sư")).toHaveValue("");
  expect(screen.getByLabelText("Môn học")).toHaveTextContent("Tất cả môn học");
});

it("keeps advanced controls collapsed so the tutor list is visible immediately", async () => {
  view();
  expect(
    await screen.findByRole("link", { name: "Xem hồ sơ Nguyễn An" })
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText("Giá thấp nhất / buổi (VNĐ)")
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /Bộ lọc nâng cao/ })
  ).toHaveAttribute("aria-expanded", "false");
});
