import { http } from "@/lib/api/http";
export type CatalogKind = "subjects" | "provinces" | "districts" | "teaching-levels";
export interface CatalogItem { code: string; name: string; isActive: boolean; provinceCode?: string | null }
export async function getAdminCatalog(kind: CatalogKind, signal?: AbortSignal): Promise<CatalogItem[]> {
  return (await http.get<CatalogItem[]>(`/admin/catalog/${kind}`, { signal })).data;
}
export async function saveCatalog(kind: CatalogKind, item: CatalogItem, create: boolean): Promise<CatalogItem> {
  return (await (create ? http.post<CatalogItem>(`/admin/catalog/${kind}`, item) : http.put<CatalogItem>(`/admin/catalog/${kind}/${encodeURIComponent(item.code)}`, item))).data;
}

export async function getPublicCatalog(kind: CatalogKind, signal?: AbortSignal): Promise<CatalogItem[]> {
  return (await http.get<CatalogItem[]>(`/catalog/${kind}`, { signal })).data;
}
