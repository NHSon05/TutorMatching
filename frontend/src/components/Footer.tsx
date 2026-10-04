import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer id="contact" className="bg-[#0b0f19] text-gray-400 text-sm pt-16 pb-12">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-gray-800">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/">
              <img
                src="https://giasuhome.vn/lib/image/logo_toi.png"
                alt="GiasuHome Footer Logo"
                className="h-8 w-auto object-contain mb-4"
              />
            </Link>
            <div className="flex items-start gap-3 text-xs">
              <i className="fa-solid fa-location-dot text-amber-400 mt-1"></i>
              <div>
                <strong className="text-white block mb-0.5">Địa chỉ:</strong>
                <p>107A Nguyễn Phong Sắc, Cầu Giấy, Hà Nội</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <i className="fa fa-envelope text-amber-400 mt-1"></i>
              <div>
                <strong className="text-white block mb-0.5">Email:</strong>
                <p>giasuhome.vn@gmail.com</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs">
              <i className="fa fa-phone text-amber-400 mt-1"></i>
              <div>
                <strong className="text-white block mb-0.5">Hotline:</strong>
                <a href="tel:0369148660" className="hover:text-amber-400">
                  0369 148 660
                </a>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.facebook.com/giasuhome.vn"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-[#1877F2] text-white flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <i className="fab fa-facebook-f text-xs"></i>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                aria-label="Youtube"
              >
                <i className="fab fa-youtube text-xs"></i>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-black text-white flex items-center justify-center transition-colors"
                aria-label="TikTok"
              >
                <i className="fab fa-tiktok text-xs"></i>
              </a>
            </div>
          </div>

          {/* Links 1: Về GiasuHome */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Về GiasuHome</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/gioi-thieu" className="hover:text-white transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Liên hệ
                </a>
              </li>
              <li>
                <a
                  href="https://tuyendung.giasuhome.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Tuyển dụng
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2: Dịch vụ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Dịch vụ</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/hoc-phi" className="hover:text-white transition-colors">
                  Bảng giá học phí
                </Link>
              </li>
              <li>
                <Link href="/lop-hoc" className="hover:text-white transition-colors">
                  Danh sách lớp mới
                </Link>
              </li>
              <li>
                <Link href="/gia-su?subject=Ti%E1%BA%BFng%20Anh" className="hover:text-white transition-colors">
                  Gia sư Tiếng Anh
                </Link>
              </li>
              <li>
                <Link href="/gia-su?subject=IELTS" className="hover:text-white transition-colors">
                  Gia sư IELTS
                </Link>
              </li>
              <li>
                <Link href="/gia-su?form=Online" className="hover:text-white transition-colors">
                  Gia sư Online
                </Link>
              </li>
            </ul>
          </div>

          {/* Links 3: Hỗ trợ */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Hỗ trợ</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/#trial_section" className="hover:text-white transition-colors">
                  Đăng ký học thử
                </Link>
              </li>
              <li>
                <a
                  href="https://zalo.me/0369148660"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Tư vấn Zalo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Gia sư đăng nhập
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>Copyright © 2024 - GiasuHome - All rights reserved</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-300">
              Điều khoản
            </a>
            <a href="#" className="hover:text-gray-300">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
