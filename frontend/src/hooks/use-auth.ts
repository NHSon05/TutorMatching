"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerAccount } from "@/lib/api/auth";
import {
  completeGoogleRegistration,
  googleSignIn,
  login,
  logout,
  type GoogleRegistrationRole,
} from "@/lib/auth/session";
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

/** Exchanges a Google ID token; replaces the session only when the backend signed the user in. */
export function useGoogleSignIn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (credential: string) => googleSignIn(credential),
    onSuccess: outcome => {
      if (outcome.kind === "signed-in") replaceSession(client, outcome.account);
    },
    retry: false,
    gcTime: 0,
  });
}

/** Completes a pending Google registration with the chosen role and starts the session. */
export function useCompleteGoogleRegistration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ pendingToken, role }: { pendingToken: string; role: GoogleRegistrationRole }) =>
      completeGoogleRegistration(pendingToken, role),
    onSuccess: account => replaceSession(client, account),
    retry: false,
    gcTime: 0,
  });
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
