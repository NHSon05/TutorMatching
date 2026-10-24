"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getAdminCatalog, saveCatalog, type CatalogItem, type CatalogKind } from "@/lib/api/catalog";
const kinds: { kind: CatalogKind; label: string }[] = [
  { kind: "subjects", label: "Môn học" }, { kind: "provinces", label: "Tỉnh/thành" },
  { kind: "districts", label: "Quận/huyện" }, { kind: "teaching-levels", label: "Trình độ học viên" },
];
const empty: CatalogItem = { code: "", name: "", isActive: true, provinceCode: "" };
export default function CatalogManager() {
  const [kind, setKind] = useState<CatalogKind>("subjects");
  const [item, setItem] = useState<CatalogItem>(empty);
  const [create, setCreate] = useState(true);
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["admin-catalog", kind], queryFn: ({ signal }) => getAdminCatalog(kind, signal) });
  const mutation = useMutation({ mutationFn: (input: { kind: CatalogKind; item: CatalogItem; create: boolean }) => saveCatalog(input.kind, input.item, input.create),
    onSuccess: async (_, variables) => { await cache.invalidateQueries({ queryKey: ["admin-catalog", variables.kind] }); setItem(empty); setCreate(true); } });
  return <section className="space-y-6 text-content-primary">
    <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
    <div className="flex flex-wrap gap-2" aria-label="Loại danh mục">{kinds.map(k => <Button key={k.kind} disabled={mutation.isPending} variant={kind === k.kind ? "primary" : "secondary"} onClick={() => { setKind(k.kind); setItem(empty); setCreate(true); mutation.reset(); }}>{k.label}</Button>)}</div>
    {query.isPending && <p role="status">Đang tải danh mục…</p>}
    {query.isError && <div role="alert">Không tải được danh mục. <Button onClick={() => query.refetch()}>Thử lại</Button></div>}
    {query.data?.length === 0 && <p>Chưa có dữ liệu.</p>}
    <ul className="space-y-2">{query.data?.map(row => <li key={row.code} className="flex items-center justify-between rounded-lg border border-border-default bg-surface-card p-3"><span>{row.name} — {row.isActive ? "Đang sử dụng" : "Ngừng sử dụng"}</span><Button disabled={mutation.isPending} variant="secondary" onClick={() => { setItem(row); setCreate(false); mutation.reset(); }}>Sửa {row.name}</Button></li>)}</ul>
    <form className="space-y-4 rounded-lg bg-surface-card p-4" onSubmit={e => { e.preventDefault(); mutation.mutate({ kind, item: { ...item, name: item.name.trim(), code: item.code.trim() }, create }); }}>
      <h2 className="font-semibold">{create ? "Thêm danh mục" : "Sửa danh mục"}</h2>
      <TextField label={kind === "subjects" ? "Mã môn (UUID)" : "Mã danh mục"} required disabled={!create || mutation.isPending} value={item.code} onChange={e => setItem({ ...item, code: e.target.value })} />
      {create && kind === "subjects" && <Button type="button" variant="secondary" onClick={() => setItem({ ...item, code: crypto.randomUUID() })}>Tạo mã môn</Button>}
      <TextField label="Tên danh mục" required maxLength={100} value={item.name} disabled={mutation.isPending} onChange={e => setItem({ ...item, name: e.target.value })} />
      {kind === "districts" && <TextField label="Mã tỉnh/thành" required maxLength={32} disabled={!create || mutation.isPending} value={item.provinceCode ?? ""} onChange={e => setItem({ ...item, provinceCode: e.target.value })} />}
      <Button type="button" variant="secondary" disabled={mutation.isPending} onClick={() => setItem({ ...item, isActive: !item.isActive })}>{item.isActive ? "Ngừng sử dụng" : "Sử dụng lại"}</Button>
      {mutation.isError && <p role="alert">Không lưu được. Kiểm tra mã, tên trùng, quyền truy cập và tỉnh/thành hợp lệ.</p>}
      <div className="flex gap-2"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Đang lưu…" : "Lưu danh mục"}</Button><Button type="button" variant="tertiary" disabled={mutation.isPending} onClick={() => { setItem(empty); setCreate(true); mutation.reset(); }}>Hủy</Button></div>
    </form>
  </section>;
}
