"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/use-session";
import {
  listHireRequests,
  proposeHireRequest,
  type ProposeHireRequest,
  getHireRequest,
  acceptHireRequest,
  rejectHireRequest,
  cancelHireRequest,
  completeHireRequest,
  type AcceptHireRequest,
  type RejectHireRequest,
  type CloseHireRequest,
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
export function useProposeHireRequest(id: string) {
  const queryClient = useQueryClient();
  const { data: account } = useSession();
  const accountId = account?.id;
  return useMutation({
    mutationFn: (body: ProposeHireRequest) => proposeHireRequest(id, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["hire-request-detail", accountId, id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hire-requests", accountId],
        }),
      ]);
    },
  });
}
export function useCancelHireRequest(id: string) {
  const queryClient = useQueryClient();
  const { data: account } = useSession();
  const accountId = account?.id;
  return useMutation({
    mutationFn: (body: CloseHireRequest) => cancelHireRequest(id, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["hire-request-detail", accountId, id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hire-requests", accountId],
        }),
      ]);
    },
  });
}
export function useCompleteHireRequest(id: string) {
  const queryClient = useQueryClient();
  const { data: account } = useSession();
  const accountId = account?.id;
  return useMutation({
    mutationFn: (body: CloseHireRequest) => completeHireRequest(id, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["hire-request-detail", accountId, id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["hire-requests", accountId],
        }),
      ]);
    },
  });
}
