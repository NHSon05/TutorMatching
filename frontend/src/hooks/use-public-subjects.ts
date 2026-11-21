"use client";

import { useQuery } from "@tanstack/react-query";
import { getPublicCatalog, type CatalogItem } from "@/lib/api/catalog";

/** Active subjects from the public catalog; shared by the navbar menu and subject pages. */
export function usePublicSubjects() {
  return useQuery({
    queryKey: ["public-catalog", "subjects"],
    meta: { public: true },
    queryFn: ({ signal }) => getPublicCatalog("subjects", signal),
    staleTime: 10 * 60_000,
  });
}

const normalize = (value: string) => value.normalize("NFC").toLocaleLowerCase("vi").trim();

/** Finds a catalog subject whose name starts with `prefix` (e.g. "toán học"). */
export function findSubjectByName(subjects: CatalogItem[] | undefined, prefix: string) {
  const target = normalize(prefix);
  return subjects?.find((item) => normalize(item.name).startsWith(target));
}
