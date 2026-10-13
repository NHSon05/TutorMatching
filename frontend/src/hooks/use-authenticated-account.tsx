"use client";

import { createContext, useContext } from "react";
import type { AccountResponse } from "@/lib/api/auth";

export const AuthenticatedAccountContext = createContext<AccountResponse | null>(null);

/** Read the account already verified by AuthGuard, without starting another session request. */
export function useAuthenticatedAccount() {
  const account = useContext(AuthenticatedAccountContext);
  if (!account) throw new Error("useAuthenticatedAccount must be used inside AuthGuard.");
  return account;
}
