"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicCatalog, type CatalogKind } from "@/lib/api/catalog";

export function usePublicCatalog(kind: CatalogKind, enabled = true) {
  return useQuery({
    queryKey: ["catalog", kind],
    queryFn: ({ signal }) => getPublicCatalog(kind, signal),
    enabled,
  });
}
