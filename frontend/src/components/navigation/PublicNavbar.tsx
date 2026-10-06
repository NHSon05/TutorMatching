"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@assets/logo/Logo";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Left: Mobile Toggle & Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2 text-gray-700 hover:text-brand rounded-lg lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo
              variant="gradient"
              size={34}
              className="group-hover:scale-105 transition-transform shrink-0"
            />
            <div className="flex flex-col">
              <span className="font-bold text-2xl tracking-tight text-brand group-hover:text-brand transition-colors leading-none">
                TutorMatch
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-gray-900">
          <Link href="/" className="text-brand font-semibold hover:text-brand-hover transition-colors">
            Trang chủ
          </Link>
          <Link href="/tutors" className="hover:text-brand transition-colors">
            Gia sư
          </Link>
          <Link href="#testimonials" className="hover:text-brand transition-colors">
            Đánh giá
          </Link>
          <Link href="#contact" className="hover:text-brand transition-colors">
            Liên hệ
          </Link>
        </nav>

        {/* Right: CTA & Controls */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex text-sm font-medium text-gray-900 hover:text-brand px-3 py-2 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/tutors"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-800 rounded-full shadow-sm shadow-brand-500/20 transition-all hover:shadow"
          >
            Chọn gia sư ngay
          </Link>
          <Link
            href="/register"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-brand transition-colors"
            title="Đăng ký tài khoản"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-semibold text-brand py-1.5"
          >
            Trang chủ
          </Link>
          <Link
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1.5"
          >
            Về chúng tôi
          </Link>
          <Link
            href="#subjects"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1.5"
          >
            Môn học
          </Link>
          <Link
            href="/tutors"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1.5"
          >
            Tìm gia sư
          </Link>
          <Link
            href="#programs"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1.5"
          >
            Chương trình
          </Link>
          <Link
            href="#testimonials"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-gray-700 py-1.5"
          >
            Đánh giá
          </Link>
          <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-semibold text-gray-700 border border-gray-200 rounded-full"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 text-center py-2 text-xs font-semibold text-white bg-brand rounded-full"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
