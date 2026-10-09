"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { registerAccount } from "@/lib/api/auth";
import Logo from "@assets/logo/Logo";
import {
  DEFAULT_COUNTRY,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  REGISTRATION_STEPS,
  ROLE_OPTIONS,
  SUPPORTED_COUNTRIES,
  type FieldErrors,
  type RegisterCardProps,
  type RegistrationError,
  type RegistrationField,
} from "./RegisterCard.types";

export type * from "./RegisterCard.types";

export default function RegisterCard({ className = "", onSuccess }: RegisterCardProps = {}) {
  // 1. Vai trò (Gia sư, Phụ Huynh, Học Sinh)
  const [role, setRole] = useState("TUTOR");

  // 2. Email
  const [email, setEmail] = useState("");

  // 3. Số điện thoại
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  // 4. Họ và tên
  const [fullName, setFullName] = useState("");

  // 5. Mật khẩu & 6. Xác nhận mật khẩu
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const clearFieldError = (field: RegistrationField) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors: FieldErrors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      validationErrors.password = `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
    } else if (password.length > MAX_PASSWORD_LENGTH) {
      validationErrors.password = `Mật khẩu không được vượt quá ${MAX_PASSWORD_LENGTH} ký tự.`;
    }
    if (password !== confirmPassword) {
      validationErrors.passwordConfirmation = "Mật khẩu xác nhận không trùng khớp.";
    }

    setFieldErrors(validationErrors);
    setGeneralError("");
    setIsSuccess(false);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await registerAccount({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        passwordConfirmation: confirmPassword,
        role: role === "TUTOR" ? "TUTOR" : "LEARNER",
      });
      setIsSuccess(true);
      onSuccess?.();
    } catch (error) {
      const apiError = error as RegistrationError;
      if (apiError.status === 409) {
        setFieldErrors({ email: "Email này đã được sử dụng." });
      } else if (apiError.errors) {
        const serverErrors = Object.fromEntries(
          Object.entries(apiError.errors)
            .filter(([field, messages]) =>
              ["fullName", "email", "password", "passwordConfirmation", "role"].includes(field) &&
              messages.length > 0)
            .map(([field, messages]) => [field, messages[0]])
        ) as FieldErrors;
        setFieldErrors(serverErrors);
        if (Object.keys(serverErrors).length === 0) {
          setGeneralError(apiError.message || "Không thể đăng ký. Vui lòng thử lại.");
        }
      } else {
        setGeneralError(apiError.message || "Không thể đăng ký. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`min-h-screen w-full p-2 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 overflow-hidden ${className}`.trim()}
    >
      {/* ========================================================================= */}
      {/* CỘT TRÁI: BLUE GRADIENT BANNER & 3 STEP PROGRESS CARDS (lg:col-span-7) */}
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
            Bắt đầu hành trình của bạn
          </h1>

          <p className="text-base text-blue-100/90 font-normal max-w-md">
            Theo dõi các bước để thiết lập tài khoản
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          {REGISTRATION_STEPS.map((s) => (
            <div
              key={s.step}
              className={
                s.isActive
                  ? "bg-white rounded-2xl p-3.5 shadow-md flex flex-col justify-between min-h-26.25"
                  : "bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3.5 flex flex-col justify-between min-h-26.25"
              }
            >
              <div
                className={
                  s.isActive
                    ? "w-6 h-6 rounded-full bg-[#2563eb] text-white text-xs font-bold flex items-center justify-center mb-3"
                    : "w-6 h-6 rounded-full bg-white/25 text-white text-xs font-medium flex items-center justify-center mb-3"
                }
              >
                {s.step}
              </div>
              <span
                className={
                  s.isActive
                    ? "text-xs font-bold leading-snug text-gray-900"
                    : "text-xs font-medium leading-snug text-white/90"
                }
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI: FORM ĐĂNG KÝ 6 TRƯỜNG CHUẨN (lg:col-span-5) */}
      {/* ========================================================================= */}
      <div className="lg:col-span-5 flex flex-col justify-center px-2 sm:px-6 py-4 sm:py-6">
        <h2 className="text-3xl font-extrabold text-gray-900 text-center mb-5 tracking-tight">
          Đăng ký
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* TRƯỜNG 1: Chọn vai trò (Gia sư, Phụ Huynh, Học Sinh) */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-1.5">
              Chọn vai trò
            </label>
            <SegmentedControl
              options={ROLE_OPTIONS}
              value={role}
              onChange={setRole}
              size="large"
              isFullWidth
            />
          </div>

          {/* TRƯỜNG 2: Email */}
          <div>
            <TextField
              label={<span className="text-base font-semibold text-gray-800">Email</span>}
              type="email"
              required
              size="medium"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError("email");
              }}
              error={fieldErrors.email}
            />
          </div>

          {/* TRƯỜNG 3: Số điện thoại */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-1.5">
              Số điện thoại
            </label>
            <div className="relative flex items-center h-11 bg-white border border-gray-300 hover:border-gray-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 rounded-xl px-3 transition-all">
              {/* Nút chọn quốc gia */}
              <button
                type="button"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                className="flex items-center gap-1.5 text-base font-medium text-gray-800 pr-2.5 border-r border-gray-200 focus:outline-none"
              >
                <span className="text-lg leading-none">{selectedCountry.flag}</span>
                <span className="text-sm">{selectedCountry.code}</span>
                <svg
                  className="w-3.5 h-3.5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown cờ */}
              {isCountryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 max-h-48 overflow-y-auto">
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCountry(c);
                        setIsCountryDropdownOpen(false);
                      }}
                      className="w-full px-3.5 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="text-sm">{c.name}</span>
                      <span className="text-gray-400 text-sm ml-auto">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              <input
                type="tel"
                placeholder="0000 00 00"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-transparent text-base text-gray-900 placeholder-gray-400 pl-3 focus:outline-none"
              />
            </div>
          </div>

          {/* TRƯỜNG 4: Họ và tên */}
          <div>
            <TextField
              label={<span className="text-base font-semibold text-gray-800">Họ và tên</span>}
              type="text"
              required
              size="medium"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError("fullName");
              }}
              error={fieldErrors.fullName}
            />
          </div>

          {/* TRƯỜNG 5 & 6: Mật khẩu & Xác nhận mật khẩu */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <TextField
                label={<span className="text-base font-semibold text-gray-800">Mật khẩu</span>}
                type={showPassword ? "text" : "password"}
                required
                size="medium"
                placeholder="••••••••••••••••"
                value={password}
                maxLength={MAX_PASSWORD_LENGTH + 1}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                error={fieldErrors.password}
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

            <div className="flex-1">
              <TextField
                label={<span className="text-base font-semibold text-gray-800">Xác nhận mật khẩu</span>}
                type={showConfirmPassword ? "text" : "password"}
                required
                size="medium"
                placeholder="••••••••••••••••"
                value={confirmPassword}
                maxLength={MAX_PASSWORD_LENGTH + 1}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("passwordConfirmation");
                }}
                error={fieldErrors.passwordConfirmation}
                trailingIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? "👁️" : "🙈"}
                  </button>
                }
              />
            </div>
          </div>

          {generalError && (
            <p role="alert" className="text-sm font-medium text-status-error">
              {generalError}
            </p>
          )}

          {isSuccess && (
            <p role="status" className="rounded-xl bg-status-success-bg p-3 text-sm text-status-success-dark">
              Đăng ký thành công. Bạn có thể{" "}
              <Link href="/login" className="font-semibold underline">
                Đăng nhập
              </Link>
              .
            </p>
          )}

          {/* Nút Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="brand"
              size="medium"
              shape="rounded"
              className="w-full text-base font-semibold"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </div>
        </form>

        {/* Already have an account */}
        <p className="text-center text-base text-gray-600 mt-3.5">
          Bạn đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-brand font-semibold hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
