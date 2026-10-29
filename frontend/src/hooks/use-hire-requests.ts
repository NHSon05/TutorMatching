"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import {
  listHireRequests,
  getHireRequest,
  acceptHireRequest,
  rejectHireRequest,
  type AcceptHireRequest,
  type RejectHireRequest,
} from "@/lib/api/hire-requests";

export function useHireRequests(params?: {
  status?: string;
  cursor?: string;
  pageSize?: number;
}) {
  const { data: account } = useSession();
  const accountId = account?.id;

  return useQuery({
    queryKey: ["hire-requests", accountId, params],
    queryFn: ({ signal }) => listHireRequests(params, signal),
    enabled: !!accountId,
  });
}

export function useHireRequestDetail(id: string) {
  const { data: account } = useSession();
  const accountId = account?.id;

  return useQuery({
    queryKey: ["hire-request-detail", accountId, id],
    queryFn: ({ signal }) => getHireRequest(id, signal),
    enabled: !!accountId && !!id,
  });
}

export function useAcceptHireRequest(id: string) {
  const queryClient = useQueryClient();
  const { data: account } = useSession();
  const accountId = account?.id;

  return useMutation({
    mutationFn: (body: AcceptHireRequest) => acceptHireRequest(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hire-request-detail", accountId, id],
      });
      queryClient.invalidateQueries({
        queryKey: ["hire-requests", accountId],
      });
    },
  });
}

export function useRejectHireRequest(id: string) {
  const queryClient = useQueryClient();
  const { data: account } = useSession();
  const accountId = account?.id;

  return useMutation({
    mutationFn: (body: RejectHireRequest) => rejectHireRequest(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["hire-request-detail", accountId, id],
      });
      queryClient.invalidateQueries({
        queryKey: ["hire-requests", accountId],
      });
    },
  });
}
