"use client";

import { ViewTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  AUTH_IN,
  AUTH_OPEN,
  AUTH_OUT,
} from "@/lib/navigation/transition-types";

const ENTER = {
  [AUTH_OPEN]: "auth-open-enter",
  [AUTH_IN]: "auth-in-enter",
  [AUTH_OUT]: "auth-out-enter",
  default: "page-enter",
};
const EXIT = {
  [AUTH_OPEN]: "auth-open-exit",
  [AUTH_IN]: "auth-in-exit",
  [AUTH_OUT]: "auth-out-exit",
  default: "page-exit",
};

/**
 * Animates page content on route changes. Keying by pathname makes React treat
 * the old and new page as an exit/enter pair; App Router navigations are
 * transitions, so the browser View Transitions API runs the CSS in globals.css.
 * Navigations tagged with an auth transition type (login, logout, opening the
 * auth screens) get their own animation. Browsers without support simply swap
 * content instantly.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter={ENTER} exit={EXIT} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

export default PageTransition;
