import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { ProfilePageClient } from "@/components/profile/ProfilePageClient";
import { updateCurrentProfile, type PersonalProfileResponse } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/http";
import { createQueryClient, replaceSession, sessionKey } from "@/lib/query/client";
import { useAuthStore } from "@/stores/use-auth-store";
import { getSession } from "@/lib/auth/session";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/lib/api/profile", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/api/profile")>(), updateCurrentProfile: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({ getSession: vi.fn() }));
vi.mock("@/components/profile/TutorProfessionalForm", () => ({ TutorProfessionalForm: () => <p>Hồ sơ giảng dạy riêng</p> }));

const account: PersonalProfileResponse = {
  id: "learner-1", role: "LEARNER", status: "ACTIVE", fullName: "Học viên thử nghiệm",
  email: "learner@example.com", phoneNumber: "0901234567", dateOfBirth: "2000-05-12", avatarUrl: null,
};
beforeEach(() => { vi.clearAllMocks(); useAuthStore.getState().clearAuth(); });

function setup(profile = account) {
  const client = createQueryClient();
  client.setQueryData(sessionKey, profile);
  render(<QueryClientProvider client={client}><ProfileForm account={profile} /></QueryClientProvider>);
  return client;
}
function editName(value = "Tên mới") {
  fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value } });
}
function save() { fireEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" })); }

it.each(["LEARNER", "TUTOR"] as const)("populates real personal fields for %s and keeps email immutable", role => {
  setup({ ...account, role });
  expect(screen.getByLabelText("Họ và tên")).toHaveValue(account.fullName);
  expect(screen.getByLabelText("Email")).toHaveAttribute("readonly");
  expect(screen.getByLabelText("Số điện thoại")).toHaveValue(account.phoneNumber);
  expect(screen.getByLabelText("Ngày sinh")).toHaveValue(account.dateOfBirth);
  expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
});

it("validates name and future birth date without sending a request", () => {
  setup(); editName("A");
  fireEvent.change(screen.getByLabelText("Ngày sinh"), { target: { value: "2999-01-01" } }); save();
  expect(screen.getByText("Họ và tên phải có từ 2 đến 100 ký tự.")).toBeInTheDocument();
  expect(screen.getByText("Ngày sinh phải là ngày hợp lệ trong quá khứ.")).toBeInTheDocument();
  expect(updateCurrentProfile).not.toHaveBeenCalled();
});

it("saves only allowed fields and synchronizes the returned session and navbar name", async () => {
  const result = { ...account, fullName: "Tên mới", phoneNumber: null };
  vi.mocked(updateCurrentProfile).mockResolvedValue(result);
  const client = setup(); editName("  Tên mới  ");
  fireEvent.change(screen.getByLabelText("Số điện thoại"), { target: { value: "" } }); save();
  expect(await screen.findByText("Đã lưu thông tin cá nhân.")).toBeInTheDocument();
  expect(updateCurrentProfile).toHaveBeenCalledWith({ fullName: "Tên mới", phoneNumber: null, dateOfBirth: account.dateOfBirth, avatarUrl: null }, expect.anything());
  expect(client.getQueryData(sessionKey)).toEqual(result);
  expect(useAuthStore.getState().user?.fullName).toBe("Tên mới");
  expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
});

it("disables the form during save and ignores a response after logout", async () => {
  let finish!: (value: PersonalProfileResponse) => void;
  vi.mocked(updateCurrentProfile).mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const client = setup(); editName(); save();
  expect(await screen.findByRole("button", { name: "Đang lưu..." })).toBeDisabled();
  expect(screen.getByLabelText("Họ và tên")).toBeDisabled();
  act(() => replaceSession(client, null));
  await act(async () => finish({ ...account, fullName: "Tên mới" }));
  expect(client.getQueryData(sessionKey)).toBeNull();
  expect(useAuthStore.getState().user).toBeNull();
  expect(screen.queryByText("Đã lưu thông tin cá nhân.")).not.toBeInTheDocument();
});

it.each([409, 422, 401, 403, 429, 500])("preserves edits and displays a server error for %s", async status => {
  vi.mocked(updateCurrentProfile).mockRejectedValue(new ApiError(status, "Error", status === 422 ? { fullName: ["Tên không hợp lệ"] } : undefined, null, "/users/me"));
  const client = setup(); editName(); save();
  expect(await screen.findByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText("Họ và tên")).toHaveValue("Tên mới");
  expect(client.getQueryData(sessionKey)).toEqual(account);
  if (status === 409) expect(screen.getByText("Số điện thoại này đã được sử dụng.")).toBeInTheDocument();
  if (status === 422) expect(screen.getByText("Tên không hợp lệ")).toBeInTheDocument();
});

it("cancels unsaved edits", () => {
  setup(); editName(); fireEvent.click(screen.getByRole("button", { name: "Hủy thay đổi" }));
  expect(screen.getByLabelText("Họ và tên")).toHaveValue(account.fullName);
  expect(updateCurrentProfile).not.toHaveBeenCalled();
});

function page() {
  const client = createQueryClient();
  render(<QueryClientProvider client={client}><ProfilePageClient /></QueryClientProvider>);
}
it("shows loading without sample identity", () => {
  vi.mocked(getSession).mockReturnValue(new Promise(() => {})); page();
  expect(screen.getByRole("status")).toHaveTextContent("Đang tải hồ sơ");
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
});
it("redirects expired sessions and admins without rendering private fields", async () => {
  vi.mocked(getSession).mockResolvedValue(null); page();
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
});
it("denies admin profile editing", async () => {
  vi.mocked(getSession).mockResolvedValue({ ...account, role: "ADMIN" }); page();
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/forbidden"));
  expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
});
it("shows retry rather than mocks when GET fails", async () => {
  vi.mocked(getSession).mockRejectedValue(new Error("offline")); page();
  expect(await screen.findByRole("alert")).toHaveTextContent("Không thể tải thông tin cá nhân");
  expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  vi.mocked(getSession).mockResolvedValue(account);
  fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByLabelText("Họ và tên")).toHaveValue(account.fullName);
});
it.each(["LEARNER", "TUTOR"] as const)("renders role-specific content for %s", async role => {
  vi.mocked(getSession).mockResolvedValue({ ...account, role }); page();
  await screen.findByLabelText("Họ và tên");
  if (role === "LEARNER") {
    expect(screen.getByText("Dữ liệu mẫu")).toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ giảng dạy riêng")).not.toBeInTheDocument();
  } else {
    expect(screen.getByText("Hồ sơ giảng dạy riêng")).toBeInTheDocument();
    expect(screen.queryByText("Dữ liệu mẫu")).not.toBeInTheDocument();
  }
});
