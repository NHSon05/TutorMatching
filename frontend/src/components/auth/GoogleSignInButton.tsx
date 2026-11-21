"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import type { AccountResponse } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/http";
import type { GoogleRoleRequired } from "@/lib/auth/session";
import { useGoogleSignIn } from "@/hooks/use-auth";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_BUTTON_WIDTH = 400; // Google Identity Services maximum.
const FALLBACK_LABEL = "Đăng nhập với Google";
const BUTTON_LABELS: Record<
  NonNullable<GoogleSignInButtonProps["text"]>,
  string
> = {
  signin_with: "Đăng nhập bằng Google",
  continue_with: "Tiếp tục với Google",
  signup_with: "Đăng ký bằng Google",
};

export const GOOGLE_NOT_CONFIGURED_MESSAGE =
  "Đăng nhập Google chưa được cấu hình. Vui lòng dùng email và mật khẩu.";
export const GOOGLE_SIGN_IN_FAILED_MESSAGE =
  "Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email và mật khẩu.";
export const GOOGLE_RATE_LIMITED_MESSAGE =
  "Bạn đã thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.";

export interface GoogleSignInButtonProps {
  /** Text shown inside Google's button. */
  text?: "signin_with" | "continue_with" | "signup_with";
  onSignedIn: (account: AccountResponse) => void;
  /** Verified Google identity without an account: the parent asks for a role. */
  onRoleRequired: (pending: GoogleRoleRequired) => void;
  onError: (message: string) => void;
  /** Clears a previous error when a new attempt starts. */
  onStart?: () => void;
}

export function googleErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 429)
    return GOOGLE_RATE_LIMITED_MESSAGE;
  return GOOGLE_SIGN_IN_FAILED_MESSAGE;
}

/**
 * "Continue with Google" using Google Identity Services. Google renders the button itself (required to
 * obtain an ID token without a client secret); the credential is sent to the backend and never stored.
 */
export function GoogleSignInButton({
  text = "signin_with",
  onSignedIn,
  onRoleRequired,
  onError,
  onStart,
}: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const { mutateAsync: signInWithGoogle, isPending } = useGoogleSignIn();

  // Google keeps the first callback it was given; route it to the latest props.
  const handleCredentialRef = useRef<
    (response: GoogleCredentialResponse) => void
  >(() => {});
  useEffect(() => {
    handleCredentialRef.current = async ({ credential }) => {
      onStart?.();
      try {
        const outcome = await signInWithGoogle(credential);
        if (outcome.kind === "signed-in") onSignedIn(outcome.account);
        else onRoleRequired(outcome);
      } catch (error) {
        onError(googleErrorMessage(error));
      }
    };
  }, [onError, onRoleRequired, onSignedIn, onStart, signInWithGoogle]);

  const renderGoogleButton = () => {
    const container = containerRef.current;
    const identity = window.google?.accounts.id;
    if (!container || !identity) return;
    identity.initialize({
      client_id: clientId,
      callback: (response) => handleCredentialRef.current(response),
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    container.replaceChildren();
    identity.renderButton(container, {
      type: "standard",
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "center",
      width: GOOGLE_BUTTON_WIDTH,
      locale: "vi",
    });
    setIsRendered(true);
  };

  // Google's button cannot be wider than 400px. Stretch the invisible real button over the
  // full-width visual one so a click anywhere on it still opens Google's popup.
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container || !isRendered) return;
    const fit = () => {
      const scaleX = overlay.offsetWidth / GOOGLE_BUTTON_WIDTH;
      const scaleY = overlay.offsetHeight / Math.max(1, container.offsetHeight);
      container.style.transform = `scale(${scaleX}, ${scaleY})`;
    };
    fit();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(overlay);
    return () => observer?.disconnect();
  }, [isRendered]);

  if (!clientId) {
    return (
      <GoogleVisualButton
        label={FALLBACK_LABEL}
        onClick={() => onError(GOOGLE_NOT_CONFIGURED_MESSAGE)}
      />
    );
  }

  return (
    <div className="relative w-full" aria-busy={isPending}>
      <Script
        src={GOOGLE_SCRIPT_SRC}
        strategy="afterInteractive"
        onReady={renderGoogleButton}
      />
      <div
        className={`group relative w-full rounded-xl focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 ${
          isPending ? "pointer-events-none opacity-60" : ""
        } ${isRendered ? "" : "animate-pulse"}`}
      >
        {/* Visual only: keyboard and screen readers reach Google's real button in the overlay. */}
        <GoogleVisualButton label={BUTTON_LABELS[text]} decorative />
        <div
          ref={overlayRef}
          className="absolute inset-0 overflow-hidden opacity-0"
        >
          <div
            ref={containerRef}
            data-testid="google-signin-button"
            className="w-fit origin-top-left"
          />
        </div>
      </div>
      {isPending && (
        <p role="status" className="mt-2 text-center text-base text-gray-500">
          Đang đăng nhập bằng Google...
        </p>
      )}
    </div>
  );
}

/** Full-width Google button styled like the other auth buttons. */
function GoogleVisualButton({
  label,
  onClick,
  decorative = false,
}: {
  label: string;
  onClick?: () => void;
  decorative?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="large"
      shape="rounded"
      isFullWidth
      onClick={onClick}
      tabIndex={decorative ? -1 : undefined}
      aria-hidden={decorative || undefined}
      leadingIcon={<GoogleLogo />}
      className="bg-white hover:bg-gray-50 group-hover:bg-gray-50 border-gray-200 text-gray-700 font-semibold shadow-xs"
    >
      {label}
    </Button>
  );
}

function GoogleLogo() {
  // Official Google "G" colors are mandated by Google's branding guidelines.
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default GoogleSignInButton;
