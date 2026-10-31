import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HireRequestList } from "@/components/hiring/HireRequestList";
import { createQueryClient, replaceSession } from "@/lib/query/client";
import type { AccountResponse } from "@/lib/api/auth";
const state = vi.hoisted(() => ({
  account: { id: "learner-a" },
  list: vi.fn(),
}));
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({ data: state.account, isPending: false, isError: false }),
}));
vi.mock("@/lib/api/hire-requests", () => ({
  listHireRequests: (...args: unknown[]) => state.list(...args),
}));
const row = (id: string, status = "PENDING") => ({
  id,
  status,
  version: "v",
  createdAt: "2026-10-30T01:00:00Z",
  learner: { id: "learner", displayName: "Học viên A" },
  tutor: { id: "tutor", displayName: "Gia sư B" },
});
const mount = () => {
  const client = createQueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <HireRequestList audience="learner" />
    </QueryClientProvider>
  );
  return { client, ...view };
};
beforeEach(() => {
  state.account = { id: "learner-a" };
  state.list.mockReset();
});
afterEach(cleanup);
it("resets cursor on filter and account changes, supports keyboard filters and real detail links", async () => {
  state.list.mockImplementation((params) =>
    Promise.resolve({
      items: [row(params?.cursor ? "second" : "first")],
      nextCursor: params?.cursor ? null : "page-two",
    })
  );
  const view = mount();
  await screen.findByText(/Mã: first/);
  expect(screen.getByRole("link", { name: "Xem chi tiết →" })).toHaveAttribute(
    "href",
    "/learner/requests/first"
  );
  fireEvent.click(screen.getByRole("button", { name: "Tải trang tiếp theo" }));
  await screen.findByText(/Mã: second/);
  expect(screen.getByText("Trang 2")).toBeInTheDocument();
  const all = screen.getByRole("tab", { name: "Tất cả trạng thái" });
  all.focus();
  await userEvent.keyboard("{ArrowRight}");
  await waitFor(() =>
    expect(state.list).toHaveBeenLastCalledWith(
      { status: "PENDING", cursor: undefined },
      expect.any(AbortSignal)
    )
  );
  expect(screen.getByText("Trang 1")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Tải trang tiếp theo" }));
  await screen.findByText("Trang 2");
  state.account = { id: "learner-b" };
  view.rerender(
    <QueryClientProvider client={view.client}>
      <HireRequestList audience="learner" />
    </QueryClientProvider>
  );
  await waitFor(() =>
    expect(
      screen.getByRole("tab", { name: "Tất cả trạng thái" })
    ).toHaveAttribute("aria-selected", "true")
  );
  expect(screen.getByText("Trang 1")).toBeInTheDocument();
  expect(state.list).toHaveBeenLastCalledWith(
    { status: undefined, cursor: undefined },
    expect.any(AbortSignal)
  );
});
it("shows loading, failure with retry, and an empty result", async () => {
  let reject!: (reason: Error) => void;
  state.list
    .mockReturnValueOnce(
      new Promise((_, no) => {
        reject = no;
      })
    )
    .mockResolvedValue({ items: [], nextCursor: null });
  mount();
  expect(screen.getByText("Đang tải danh sách yêu cầu…")).toBeInTheDocument();
  reject(new Error("offline"));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  await screen.findByText("Không có yêu cầu nào phù hợp.");
  expect(
    screen.getByRole("button", { name: "Tải trang tiếp theo" })
  ).toBeDisabled();
});
it("renders all six Vietnamese status labels", async () => {
  const statuses = [
    "PENDING",
    "NEGOTIATING",
    "ACCEPTED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
  ];
  state.list.mockResolvedValue({
    items: statuses.map((s) => row(s, s)),
    nextCursor: null,
  });
  mount();
  const list = await screen.findByRole("list", { name: "Danh sách yêu cầu" });
  for (const label of [
    "Chờ phản hồi",
    "Đang thương lượng",
    "Đã chấp nhận",
    "Đã từ chối",
    "Đã hủy",
    "Đã hoàn thành",
  ])
    expect(list).toHaveTextContent(label);
});
it("clears old private lists and details and prevents late responses restoring them", async () => {
  const client = createQueryClient();
  client.setQueryData(["hire-requests", "old"], { items: [row("private")] });
  client.setQueryData(
    ["hire-request-detail", "old", "private"],
    row("private")
  );
  let resolve!: (value: unknown) => void;
  const pending = client
    .fetchQuery({
      queryKey: ["hire-requests", "old", "late"],
      queryFn: () =>
        new Promise((yes) => {
          resolve = yes;
        }),
    })
    .catch(() => undefined);
  replaceSession(client, {
    id: "new",
    roles: ["LEARNER"],
  } as unknown as AccountResponse);
  resolve({ items: [row("late-private")] });
  await pending;
  expect(client.getQueriesData({ queryKey: ["hire-requests"] })).toEqual([]);
  expect(client.getQueriesData({ queryKey: ["hire-request-detail"] })).toEqual(
    []
  );
  client.clear();
});

it("orders tied history by sequence, identifies participants and preserves missing legacy actor information", async () => {
  const { HireRequestTimeline } =
    await import("@/components/hiring/HireRequestTimeline");
  const { within } = await import("@testing-library/react");
  const detail = {
    learner: { id: "learner", displayName: "Học viên A" },
    tutor: { id: "tutor", displayName: "Gia sư B" },
    history: [
      {
        sequence: 3,
        actorId: null,
        fromStatus: "NEGOTIATING",
        toStatus: "CANCELLED",
        reason: "Bận lịch",
        createdAt: "2026-10-30T00:00:00Z",
      },
      {
        sequence: 1,
        actorId: "learner",
        fromStatus: null,
        toStatus: "PENDING",
        createdAt: "2026-10-30T00:00:00Z",
      },
      {
        sequence: 2,
        actorId: "tutor",
        fromStatus: "PENDING",
        toStatus: "NEGOTIATING",
        createdAt: "2026-10-30T00:00:00Z",
      },
    ],
    proposals: [],
  } as unknown as import("@/lib/api/hire-requests").HireDetail;
  render(<HireRequestTimeline detail={detail} />);
  const rows = within(
    screen.getByRole("region", { name: "Lịch sử trạng thái" })
  ).getAllByRole("listitem");
  expect(rows[0]).toHaveTextContent("#1");
  expect(rows[0]).toHaveTextContent("Người thực hiện: Học viên A");
  expect(rows[1]).toHaveTextContent("Người thực hiện: Gia sư B");
  expect(rows[2]).toHaveTextContent("Không có thông tin người thực hiện");
  expect(rows[2]).toHaveTextContent("Lý do: Bận lịch");
  expect(detail.history[0].sequence).toBe(3);
});
