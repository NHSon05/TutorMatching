"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const pathname = usePathname();

  const isLinkActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="header-sticky py-3.5 px-4 md:px-8 border-b border-gray-100">
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <img
            src="https://giasuhome.vn/lib/image/logo_8.png"
            alt="GiasuHome Logo"
            className="h-7 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-6 text-[15px] font-medium text-[#212529]">
          <Link
            href="/"
            className={`py-1 transition-colors ${
              isLinkActive("/") ? "text-[#ca6f04] font-semibold" : "hover:text-[#ca6f04]"
            }`}
          >
            Trang chủ
          </Link>
          <Link
            href="/gia-su"
            className={`py-1 transition-colors ${
              isLinkActive("/gia-su") ? "text-[#ca6f04] font-semibold" : "hover:text-[#ca6f04]"
            }`}
          >
            Tìm gia sư
          </Link>
          <Link
            href="/hoc-phi"
            className={`py-1 transition-colors ${
              isLinkActive("/hoc-phi") ? "text-[#ca6f04] font-semibold" : "hover:text-[#ca6f04]"
            }`}
          >
            Học phí
          </Link>
          <Link
            href="/lop-hoc"
            className={`py-1 transition-colors ${
              isLinkActive("/lop-hoc") ? "text-[#ca6f04] font-semibold" : "hover:text-[#ca6f04]"
            }`}
          >
            Nhận lớp dạy
          </Link>

          {/* Dropdown "..." */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 text-gray-500 hover:text-black focus:outline-none"
              aria-label="Xem thêm menu"
            >
              <i className="fa fa-circle text-[6px]"></i>
              <i className="fa fa-circle text-[6px]"></i>
              <i className="fa fa-circle text-[6px]"></i>
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                <Link
                  href="/gioi-thieu"
                  onClick={() => setMoreMenuOpen(false)}
                  className={`block px-4 py-2 text-sm hover:bg-orange-50 hover:text-[#ca6f04] ${
                    isLinkActive("/gioi-thieu") ? "text-[#ca6f04] font-semibold" : ""
                  }`}
                >
                  Giới thiệu
                </Link>
                <Link
                  href="/blog"
                  onClick={() => setMoreMenuOpen(false)}
                  className={`block px-4 py-2 text-sm hover:bg-orange-50 hover:text-[#ca6f04] ${
                    isLinkActive("/blog") ? "text-[#ca6f04] font-semibold" : ""
                  }`}
                >
                  Blog
                </Link>
                <a
                  href="#contact"
                  onClick={() => setMoreMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-orange-50 hover:text-[#ca6f04]"
                >
                  Liên hệ
                </a>
                <a
                  href="https://tuyendung.giasuhome.vn"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMoreMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-orange-50 hover:text-[#ca6f04]"
                >
                  Tuyển dụng
                </a>
                <a
                  href="#"
                  onClick={() => setMoreMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-orange-50 hover:text-[#ca6f04]"
                >
                  Gia sư đăng nhập
                </a>
              </div>
            )}
          </div>
        </nav>

        {/* Right Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/#trial_section"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-black hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
          >
            Học thử miễn phí
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:text-black focus:outline-none"
            aria-label="Toggle navigation"
          >
            <i className={`fa ${mobileMenuOpen ? "fa-times" : "fa-bars"} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2.5 pb-2 text-sm font-medium">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/") ? "text-[#ca6f04] font-semibold" : ""}`}
          >
            Trang chủ
          </Link>
          <Link
            href="/gia-su"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/gia-su") ? "text-[#ca6f04] font-semibold" : "hover:text-[#ca6f04]"}`}
          >
            Tìm gia sư
          </Link>
          <Link
            href="/hoc-phi"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/hoc-phi") ? "text-[#ca6f04] font-semibold" : ""}`}
          >
            Học phí
          </Link>
          <Link
            href="/lop-hoc"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/lop-hoc") ? "text-[#ca6f04] font-semibold" : ""}`}
          >
            Nhận lớp dạy
          </Link>
          <Link
            href="/gioi-thieu"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/gioi-thieu") ? "text-[#ca6f04] font-semibold" : ""}`}
          >
            Giới thiệu
          </Link>
          <Link
            href="/blog"
            onClick={() => setMobileMenuOpen(false)}
            className={`py-1 px-2 ${isLinkActive("/blog") ? "text-[#ca6f04] font-semibold" : ""}`}
          >
            Blog
          </Link>
        </div>
      )}
    </header>
  );
}
