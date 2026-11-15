import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { AdminUsersPanel } from "@/components/admin/AdminUsers";
import {
  getAdminUser,
  searchAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
} from "@/lib/api/admin-users";
import { ApiError } from "@/lib/api/http";

vi.mock("@/lib/api/admin-users", () => ({
  ADMIN_USERS_QUERY_MAX: 100,
  searchAdminUsers: vi.fn(),
  getAdminUser: vi.fn(),
  updateAdminUserStatus: vi.fn(),
}));

const self: AdminUser = {
  id: "admin-self",
  fullName: "Quản trị A",
  email: "admin@example.test",
  role: "ADMIN",
  status: "ACTIVE",
  tutorProfileId: null,
  tutorProfileStatus: null,
  version: "v-admin",
};
const tutor: AdminUser = {
  id: "tutor-1",
  fullName: "Gia sư B",
  email: "tutor@example.test",
  role: "TUTOR",
  status: "ACTIVE",
  tutorProfileId: "profile-1",
  tutorProfileStatus: "APPROVED",
  version: "v1",
};

function renderPanel() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <AdminUsersPanel accountId={self.id} />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(searchAdminUsers).mockResolvedValue({
    items: [self, tutor],
    totalCount: 2,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(getAdminUser).mockImplementation(async (id) =>
    id === tutor.id ? tutor : self
  );
});

it("searches by query and filters by role and status", async () => {
  renderPanel();
  await screen.findByText("Gia sư B");
  const search = screen.getByLabelText("Tìm theo tên hoặc email");
  fireEvent.change(search, { target: { value: "  tutor  " } });
  fireEvent.keyDown(search, { key: "Enter" });
  await waitFor(() =>
    expect(searchAdminUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "tutor", page: 1 }),
      expect.anything()
    )
  );

  fireEvent.click(screen.getByRole("button", { name: /Tất cả vai trò/ }));
  fireEvent.click(screen.getByRole("option", { name: /Gia sư/ }));
  await waitFor(() =>
    expect(searchAdminUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ q: "tutor", role: "TUTOR" }),
      expect.anything()
    )
  );

  fireEvent.click(screen.getByRole("button", { name: /Tất cả trạng thái/ }));
  fireEvent.click(screen.getByRole("option", { name: /Đã khóa/ }));
  await waitFor(() =>
    expect(searchAdminUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ role: "TUTOR", status: "LOCKED" }),
      expect.anything()
    )
  );
});

it("shows account detail with profile summary and a lock action", async () => {
  renderPanel();
  fireEvent.click(
    await screen.findByRole("button", { name: "Xem chi tiết Gia sư B" })
  );
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText("tutor@example.test");
  expect(within(dialog).getByText("APPROVED")).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: "Khóa Gia sư B" })
  ).toBeEnabled();
});

it("requires explicit confirmation and sends the current version", async () => {
  vi.mocked(updateAdminUserStatus).mockResolvedValue({
    ...tutor,
    status: "LOCKED",
    version: "v2",
  });
  renderPanel();
  fireEvent.click(await screen.findByRole("button", { name: "Khóa Gia sư B" }));
  const dialog = await screen.findByRole("dialog");
  const submit = within(dialog).getByRole("button", { name: "Xác nhận khóa" });
  expect(submit).toBeDisabled();
  fireEvent.click(
    within(dialog).getByLabelText("Tôi xác nhận muốn khóa tài khoản này.")
  );
  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  await waitFor(() =>
    expect(updateAdminUserStatus).toHaveBeenCalledWith(tutor.id, {
      expectedVersion: "v1",
      status: "LOCKED",
    })
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  );
  await waitFor(() => expect(searchAdminUsers).toHaveBeenCalledTimes(2));
});

it("offers unlock for locked accounts", async () => {
  vi.mocked(searchAdminUsers).mockResolvedValue({
    items: [{ ...tutor, status: "LOCKED" }],
    totalCount: 1,
    page: 1,
    pageSize: 20,
  });
  vi.mocked(updateAdminUserStatus).mockResolvedValue({
    ...tutor,
    version: "v3",
  });
  renderPanel();
  fireEvent.click(
    await screen.findByRole("button", { name: "Mở khóa Gia sư B" })
  );
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(
    within(dialog).getByLabelText("Tôi xác nhận muốn mở khóa tài khoản này.")
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Xác nhận mở khóa" })
  );
  await waitFor(() =>
    expect(updateAdminUserStatus).toHaveBeenCalledWith(tutor.id, {
      expectedVersion: "v1",
      status: "ACTIVE",
    })
  );
});

it("disables locking the administrator's own account", async () => {
  renderPanel();
  const own = await screen.findByRole("button", { name: "Khóa Quản trị A" });
  expect(own).toBeDisabled();
  fireEvent.click(own);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("shows a server self-lock rejection without closing the dialog", async () => {
  vi.mocked(updateAdminUserStatus).mockRejectedValue(
    new ApiError(
      422,
      "Không thể thay đổi trạng thái tài khoản của chính bạn.",
      undefined,
      null,
      "/admin/users/tutor-1/status"
    )
  );
  renderPanel();
  fireEvent.click(await screen.findByRole("button", { name: "Khóa Gia sư B" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(
    within(dialog).getByLabelText("Tôi xác nhận muốn khóa tài khoản này.")
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Xác nhận khóa" })
  );
  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "chính bạn"
  );
});

it("handles a 409 conflict by reloading the account before any retry", async () => {
  vi.mocked(updateAdminUserStatus).mockRejectedValueOnce(
    new ApiError(
      409,
      "Tài khoản đã thay đổi.",
      undefined,
      null,
      "/admin/users/tutor-1/status"
    )
  );
  vi.mocked(getAdminUser).mockResolvedValue({ ...tutor, version: "v-fresh" });
  renderPanel();
  fireEvent.click(await screen.findByRole("button", { name: "Khóa Gia sư B" }));
  let dialog = await screen.findByRole("dialog");
  fireEvent.click(
    within(dialog).getByLabelText("Tôi xác nhận muốn khóa tài khoản này.")
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Xác nhận khóa" })
  );
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("tải lại");
  expect(
    within(dialog).queryByRole("button", { name: "Xác nhận khóa" })
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Tải lại tài khoản" })
  );
  await waitFor(() =>
    expect(getAdminUser).toHaveBeenCalledWith(tutor.id, expect.anything())
  );

  vi.mocked(updateAdminUserStatus).mockResolvedValue({
    ...tutor,
    status: "LOCKED",
    version: "v2",
  });
  dialog = await screen.findByRole("dialog");
  const confirm = await within(dialog).findByLabelText(
    "Tôi xác nhận muốn khóa tài khoản này."
  );
  expect(confirm).not.toBeChecked();
  fireEvent.click(confirm);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Xác nhận khóa" })
  );
  await waitFor(() =>
    expect(updateAdminUserStatus).toHaveBeenLastCalledWith(tutor.id, {
      expectedVersion: "v-fresh",
      status: "LOCKED",
    })
  );
  expect(updateAdminUserStatus).toHaveBeenCalledTimes(2);
});
