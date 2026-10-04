"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingWidgets() {
  const [showBackTop, setShowBackTop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setShowBackTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Floating Right Contact Panel */}
      <div className="floating-contact-panel">
        {/* Zalo */}
        <a
          href="https://zalo.me/0369148660"
          target="_blank"
          rel="noreferrer"
          className="floating-action-btn"
          aria-label="Tư vấn Zalo"
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_zalo.png"
            alt="Zalo"
            className="w-7 h-7 object-contain"
          />
          <span className="tooltip">Tư vấn Zalo</span>
        </a>

        {/* Hotline Call */}
        <a
          href="tel:0369148660"
          className="floating-action-btn"
          aria-label="Gọi điện thoại"
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_telephone_call.png"
            alt="Phone"
            className="w-7 h-7 object-contain"
          />
          <span className="tooltip">Gọi 0369 148 660</span>
        </a>

        {/* Messenger */}
        <a
          href="https://www.facebook.com/giasuhome.vn"
          target="_blank"
          rel="noreferrer"
          className="floating-action-btn"
          aria-label="Nhắn tin Messenger"
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_messenger.png"
            alt="Messenger"
            className="w-7 h-7 object-contain"
          />
          <span className="tooltip">Messenger</span>
        </a>

        {/* Address */}
        <a
          href="#contact"
          className="floating-action-btn"
          aria-label="Địa chỉ văn phòng"
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_gps.png"
            alt="Địa chỉ"
            className="w-7 h-7 object-contain"
          />
          <span className="tooltip">Địa chỉ văn phòng</span>
        </a>
      </div>

      {/* Back to top button */}
      {showBackTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top-btn"
          aria-label="Cuộn lên đầu trang"
        >
          <i className="fa fa-angle-up text-lg"></i>
        </button>
      )}

      {/* Mobile Sticky Bottom Menu Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center text-xs ${
            pathname === "/" ? "text-[#ca6f04] font-semibold" : "text-gray-600"
          }`}
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_home.png"
            alt="Trang chủ"
            className="w-5 h-5 object-contain"
          />
          <span>Trang chủ</span>
        </Link>
        <Link
          href="/gia-su"
          className={`flex flex-col items-center text-xs ${
            pathname === "/gia-su" ? "text-[#ca6f04] font-semibold" : "text-gray-600"
          }`}
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_timgiasu.png"
            alt="Gia sư"
            className="w-5 h-5 object-contain"
          />
          <span>Gia sư</span>
        </Link>
        <Link
          href="/hoc-phi"
          className={`flex flex-col items-center text-xs ${
            pathname === "/hoc-phi" ? "text-[#ca6f04] font-semibold" : "text-gray-600"
          }`}
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_coins.png"
            alt="Học phí"
            className="w-5 h-5 object-contain"
          />
          <span>Học phí</span>
        </Link>
        <Link
          href="/lop-hoc"
          className={`flex flex-col items-center text-xs ${
            pathname === "/lop-hoc" ? "text-[#ca6f04] font-semibold" : "text-gray-600"
          }`}
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_timlophoc.png"
            alt="Nhận lớp"
            className="w-5 h-5 object-contain"
          />
          <span>Nhận lớp</span>
        </Link>
        <a
          href="https://giasuhome.vn/login"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center text-xs text-gray-600"
        >
          <img
            src="https://giasuhome.vn/lib/image/icon_account.png"
            alt="Đăng nhập"
            className="w-5 h-5 object-contain"
          />
          <span>Đăng nhập</span>
        </a>
      </div>
    </>
  );
}
