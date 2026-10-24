import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import CatalogManager from "@/components/admin/catalog/CatalogManager";
import { getAdminCatalog, saveCatalog } from "@/lib/api/catalog";
vi.mock("@/lib/api/catalog", () => ({ getAdminCatalog: vi.fn(), saveCatalog: vi.fn() }));
beforeEach(() => { vi.mocked(getAdminCatalog).mockReset(); vi.mocked(saveCatalog).mockReset(); });
function view() { return render(<QueryClientProvider client={new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}})}><CatalogManager /></QueryClientProvider>); }
it("loads, edits and deactivates existing catalog values", async () => {
  const row={code:"02000000-0000-0000-0000-000000000001",name:"Toán học",isActive:true};
  vi.mocked(getAdminCatalog).mockResolvedValue([row]); vi.mocked(saveCatalog).mockResolvedValue({...row,isActive:false});
  view(); fireEvent.click(await screen.findByRole("button",{name:"Sửa Toán học"}));
  fireEvent.click(screen.getByRole("button",{name:"Ngừng sử dụng"}));
  fireEvent.click(screen.getByRole("button",{name:"Lưu danh mục"}));
  await waitFor(()=>expect(saveCatalog).toHaveBeenCalledWith("subjects",expect.objectContaining({isActive:false}),false));
});
it("shows empty data and actionable load failure", async () => {
  vi.mocked(getAdminCatalog).mockRejectedValue(new Error("Network")); view();
  expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được");
  vi.mocked(getAdminCatalog).mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button",{name:"Thử lại"}));
  expect(await screen.findByText("Chưa có dữ liệu.")).toBeInTheDocument();
});
