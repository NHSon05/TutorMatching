"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@assets/logo/Logo";
import { Button } from "../ui";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full fixed top-2 z-20 px-3 sm:px-6 transition-all">
      <div className="max-w-[1776px] mx-auto h-18 rounded-[36px] bg-surface-card backdrop-blur-2xl border border-border-default shadow-sm px-4 sm:px-7 lg:px-9 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Desktop Pill Navigation Links */}
        <div className="flex items-center gap-2 lg:flex-1">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 text-brand-950 hover:bg-gray-900/5 rounded-full lg:hidden transition-colors"
            aria-label="Mở menu điều hướng"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h10M4 18h16"
                />
              </svg>
            )}
          </button>

          <nav
            aria-label="Điều hướng chính"
            className="hidden lg:flex items-center gap-1 text-base font-medium text-brand-950"
          >
            <Link
              href="/"
              className="px-4 py-2 rounded-full bg-gray-900/5 text-brand-950 font-semibold hover:bg-gray-900/10 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/tutors"
              className="px-4 py-2 rounded-full hover:bg-gray-900/5 transition-colors"
            >
              Gia sư
            </Link>
            <Link
              href="#ai-platform"
              className="px-4 py-2 rounded-full hover:bg-gray-900/5 transition-colors"
            >
              Nền tảng AI
            </Link>
          </nav>
        </div>

        {/* Center: Brand Logo (Workday Centered Mark Layout) */}
        <div className="flex items-center justify-center shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo
              variant="gradient"
              size={34}
              className="group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-brand-950 group-hover:text-brand transition-colors leading-none">
              TutorMatch
            </span>
          </Link>
        </div>

        {/* Right: Utility Icons, Login & Pill CTA */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 lg:flex-1">
          <Link
            href="/tutors"
            aria-label="Tìm kiếm gia sư"
            className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full text-brand-950 hover:bg-gray-900/5 transition-colors"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="hidden md:inline-flex text-base font-semibold text-brand hover:bg-gray-900/5 rounded-full px-4 py-2 transition-colors"
          >
            Đăng nhập
          </Link>
          <Button variant="linear" shape="pill" size="large">
            <Link href="/tutors">Chọn gia sư ngay</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 rounded-3xl border border-border-default bg-surface-card/95 backdrop-blur-2xl px-5 pt-4 pb-6 space-y-2 shadow-xl">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-bold text-brand-950 py-2 px-3 rounded-xl bg-gray-900/5"
          >
            Trang chủ
          </Link>
          <Link
            href="/tutors"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-brand-950 py-2 px-3 rounded-xl"
          >
            Tìm gia sư
          </Link>
          <Link
            href="#ai-platform"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-brand-950 py-2 px-3 rounded-xl"
          >
            Nền tảng AI
          </Link>
          <Link
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-content-secondary hover:text-brand-950 py-2 px-3 rounded-xl"
          >
            Đánh giá
          </Link>
          <div className="pt-3 border-t border-border-default flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-xs font-bold text-brand-950 border border-border-default rounded-full"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2.5 text-xs font-bold text-white bg-brand-950 rounded-full"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
