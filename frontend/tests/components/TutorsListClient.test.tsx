import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import TutorsListClient from "@/components/tutors/TutorsListClient";
import { getTutors } from "@/lib/api/tutors";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/tutors",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/api/tutors", () => ({
  getTutors: vi.fn(),
  publicAvatarUrl: vi.fn(),
}));
vi.mock("@/lib/api/catalog", () => ({
  getPublicCatalog: vi.fn(async () => []),
}));
beforeEach(() => vi.resetAllMocks());
function view() {
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <TutorsListClient />
    </QueryClientProvider>
  );
}
it("does not expose seed/mock profiles when the API is empty", async () => {
  vi.mocked(getTutors).mockResolvedValue({
    items: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
  });
  view();
  expect(
    await screen.findByText("Không tìm thấy gia sư phù hợp")
  ).toBeInTheDocument();
  expect(screen.queryByText("Lê Phương Diệu")).not.toBeInTheDocument();
});
it("does not expose seed/mock profiles when the API fails", async () => {
  vi.mocked(getTutors).mockRejectedValue(new Error("Offline"));
  view();
  expect(
    await screen.findByText("Không thể tải danh sách gia sư.")
  ).toBeInTheDocument();
  expect(screen.queryByText("Lê Phương Diệu")).not.toBeInTheDocument();
});
