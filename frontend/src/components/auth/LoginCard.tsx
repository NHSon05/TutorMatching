"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import Logo from "@assets/logo/Logo";
import type { TutorProfileStatus, UserRole } from "@/types";
import { useLogin } from "@/hooks/use-auth";
import type { LoginCardProps } from "./LoginCard.types";
import { AUTH_OPEN_TYPES } from "@/lib/navigation/transition-types";
import { redirectAfterSignIn } from "@/lib/auth/post-login-redirect";
import type { AccountResponse } from "@/lib/api/auth";
import type { GoogleRoleRequired } from "@/lib/auth/session";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { GoogleRoleDialog } from "./GoogleRoleDialog";

export type * from "./LoginCard.types";

export default function LoginCard({ className = "", onSuccess }: LoginCardProps = {}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { mutateAsync: login, isPending: isSubmitting, reset } = useLogin();

  const navigateToWorkspace = (role: UserRole, tutorProfileStatus?: TutorProfileStatus | null) => {
    onSuccess?.(role, tutorProfileStatus);
    redirectAfterSignIn(router, role, tutorProfileStatus);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setErrorMsg("");

    try {
      const account = await login({ email, password });
      navigateToWorkspace(account.role, account.tutorProfileStatus);
    } catch {
      setErrorMsg("Không thể đăng nhập. Kiểm tra thông tin hoặc thử lại sau.");
    } finally {
      reset();
    }
  };

  const [googleError, setGoogleError] = useState("");
  const [pendingGoogle, setPendingGoogle] = useState<GoogleRoleRequired | null>(null);

  const handleGoogleSignedIn = (account: AccountResponse) => {
    setPendingGoogle(null);
    navigateToWorkspace(account.role, account.tutorProfileStatus);
  };

  return (
    <div className={`min-h-screen w-full p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden font-sans ${className}`.trim()}>
      {/* ========================================================================= */}
      {/* CỘT TRÁI: BLUE GRADIENT BANNER & 3 STEP/HIGHLIGHT CARDS (lg:col-span-7)   */}
      {/* ========================================================================= */}
      <div className="lg:col-span-7 bg-linear-to-br from-[#1e3a8a] via-[#2563eb] to-[#38bdf8] rounded-3xl p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden min-h-125">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <Logo variant="white" />
          <span className="font-bold text-xl tracking-tight text-white">
            TutorMatch
          </span>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto py-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Chào mừng bạn quay lại
          </h1>

          <p className="text-base text-blue-100/90 font-normal max-w-md">
            Đăng nhập để tiếp tục hành trình học tập và kết nối gia sư lý tưởng của bạn.
          </p>
        </div>

        {/* 3 Step / Highlight Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <div className="bg-white rounded-2xl p-3.5 shadow-md flex flex-col justify-between min-h-26.25">
            <div className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center mb-3">
              1
            </div>
            <span className="text-xs font-bold leading-snug text-gray-900">
              Đăng nhập an toàn
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex flex-col justify-between min-h-26.25">
            <div className="w-6 h-6 rounded-full bg-white/25 text-white text-xs font-medium flex items-center justify-center mb-3">
              2
            </div>
            <span className="text-xs font-medium leading-snug text-white/90">
              Kết nối gia sư
            </span>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex flex-col justify-between min-h-26.25">
            <div className="w-6 h-6 rounded-full bg-white/25 text-white text-xs font-medium flex items-center justify-center mb-3">
              3
            </div>
            <span className="text-xs font-medium leading-snug text-white/90">
              Nâng cao thành tích
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI: FORM ĐĂNG NHẬP & FAST-ACCESS BUTTONS (lg:col-span-5)           */}
      {/* ========================================================================= */}
      <div className="lg:col-span-5 flex flex-col justify-center px-2 sm:px-16 py-4 sm:py-6">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-4 tracking-tight">
          Đăng Nhập
        </h2>

        {/* Form Đăng Nhập */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Email */}
          <div>
            <TextField
              label={<span className="text-base font-semibold text-gray-800">Email</span>}
              type="email"
              required
              size="medium"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Mật khẩu */}
          <div>
            <TextField
              label={<span className="text-base font-semibold text-gray-800">Mật khẩu</span>}
              type={showPassword ? "text" : "password"}
              required
              size="medium"
              placeholder="••••••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errorMsg}
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              }
            />
          </div>

          {/* Ghi nhớ đăng nhập & Quên mật khẩu */}
          <div className="flex items-center justify-between text-base pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
              <input
                type="checkbox"
                checked={false}
                disabled
                className="w-4 h-4 rounded text-brand border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm sm:text-base">Phiên đăng nhập tạm thời</span>
            </label>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Vui lòng liên hệ quản trị viên hoặc sử dụng đăng nhập Google để truy cập.");
              }}
              className="text-brand font-semibold hover:underline text-sm sm:text-base"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút Đăng nhập */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="brand"
              size="medium"
              shape="rounded"
              className="w-full text-base font-semibold"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </div>
        </form>

        {/* Chưa có tài khoản? */}
        <p className="text-center text-base text-gray-600 mt-3.5">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            transitionTypes={AUTH_OPEN_TYPES}
            className="text-brand font-semibold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* Divider Or */}
        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-sm text-gray-400 absolute">
            Hoặc
          </span>
        </div>

        {/* Nút Đăng nhập với Google */}
        <GoogleSignInButton
          text="signin_with"
          onStart={() => setGoogleError("")}
          onSignedIn={handleGoogleSignedIn}
          onRoleRequired={setPendingGoogle}
          onError={setGoogleError}
        />
        {googleError && (
          <p role="alert" className="mt-2 text-center text-sm font-medium text-status-error">
            {googleError}
          </p>
        )}

        {/* Tài khoản Google chưa tồn tại -> chọn vai trò LEARNER / TUTOR */}
        <GoogleRoleDialog
          pending={pendingGoogle}
          onClose={() => setPendingGoogle(null)}
          onSignedIn={handleGoogleSignedIn}
        />
      </div>
    </div>
  );
}
