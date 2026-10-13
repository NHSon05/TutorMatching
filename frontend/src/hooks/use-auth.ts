"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerAccount } from "@/lib/api/auth";
import { login, logout } from "@/lib/auth/session";
import { replaceSession } from "@/lib/query/client";

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: account => replaceSession(client, account),
    retry: false,
    gcTime: 0,
  });
}

export function useRegister() {
  return useMutation({ mutationFn: registerAccount, retry: false, gcTime: 0 });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => replaceSession(client, null),
    retry: false,
    gcTime: 0,
  });
}
