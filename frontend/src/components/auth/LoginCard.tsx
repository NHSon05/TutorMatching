"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import Logo from "@assets/logo/Logo";

export default function LoginCard() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRoleDemo = (role: "LEARNER" | "TUTOR" | "ADMIN") => {
    // Lưu role vào cookie để middleware nhận diện
    document.cookie = `auth_token=demo_token_${role.toLowerCase()}; path=/; max-age=86400`;
    document.cookie = `user_role=${role}; path=/; max-age=86400`;

    if (role === "ADMIN") {
      router.push("/admin/dashboard");
    } else if (role === "TUTOR") {
      router.push("/tutor/dashboard");
    } else {
      router.push("/learner/dashboard");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setErrorMsg("");

    // Mặc định đăng nhập vào không gian Học viên
    handleRoleDemo("LEARNER");
  };

  const handleGoogleOAuth = () => {
    // Trường hợp OAuth chưa chọn role -> điều hướng đến /select-role
    router.push("/select-role");
  };

  return (
    <div className="min-h-screen w-full p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden font-sans">
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
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm sm:text-base">Ghi nhớ đăng nhập</span>
            </label>
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert("Vui lòng liên hệ quản trị viên hoặc sử dụng đăng nhập Google để truy cập.");
              }}
              className="text-[#2563eb] font-semibold hover:underline text-sm sm:text-base"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút Đăng nhập */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="brand"
              size="medium"
              shape="rounded"
              className="w-full text-base font-semibold"
            >
              Đăng nhập
            </Button>
          </div>
        </form>

        {/* Chưa có tài khoản? */}
        <p className="text-center text-base text-gray-600 mt-3.5">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
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
        <Button
          type="button"
          variant="secondary"
          size="medium"
          shape="rounded"
          isFullWidth
          onClick={handleGoogleOAuth}
          leadingIcon={
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
          }
          className="bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-semibold shadow-xs"
        >
          Đăng nhập với Google
        </Button>
      </div>
    </div>
  );
}
