"use client";

import { useQueries } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import { useHireRequests } from "@/hooks/use-hire-requests";
import { getHireRequest } from "@/lib/api/hire-requests";

/** Hire requests the tutor accepted and that are not yet completed/cancelled. */
export const IN_PROGRESS_STATUS = "ACCEPTED";
export const IN_PROGRESS_PAGE_SIZE = 100;

/**
 * Loads the viewer's in-progress hires plus each hire's detail (agreed terms,
 * payment status, conversation). Detail queries share the cache key used by
 * useHireRequestDetail, so request detail pages open instantly afterwards.
 */
export function useInProgressHires() {
  const { data: account } = useSession();
  const list = useHireRequests({
    status: IN_PROGRESS_STATUS,
    pageSize: IN_PROGRESS_PAGE_SIZE,
  });
  const items = list.data?.items ?? [];
  const details = useQueries({
    queries: items.map((item) => ({
      queryKey: ["hire-request-detail", account?.id, item.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        getHireRequest(item.id, signal),
      enabled: !!account?.id,
    })),
  });
  return { list, items, details };
}
