import Link from "next/link";
import Logo from "@assets/logo/Logo";

const FOOTER_COLUMNS = [
  {
    title: "DÀNH CHO HỌC VIÊN",
    links: [
      { label: "Tìm kiếm gia sư 1-1", href: "/tutors" },
      { label: "Trợ lý AI gợi ý gia sư", href: "/#ai-concierge" },
      { label: "Đăng ký tài khoản học viên", href: "/register" },
      { label: "Lộ trình cá nhân hóa", href: "/#solutions" },
    ],
  },
  {
    title: "DÀNH CHO GIA SƯ",
    links: [
      { label: "Trở thành đối tác gia sư", href: "/register" },
      { label: "Đăng nhập cổng gia sư", href: "/login" },
      { label: "Quy trình xác thực hồ sơ", href: "/#ai-platform" },
      { label: "Quản lý lịch & học phí", href: "/login" },
    ],
  },
  {
    title: "MÔN HỌC TIÊU BIỂU",
    links: [
      { label: "Toán & Tư duy Logic", href: "/tutors" },
      { label: "Vật Lý & Hóa Học", href: "/tutors" },
      { label: "Tiếng Anh & IELTS / SAT", href: "/tutors" },
      { label: "Lập trình & Tin học", href: "/tutors" },
    ],
  },
  {
    title: "CẤP BẬC ĐÀO TẠO",
    links: [
      { label: "Tiểu học & Nền tảng", href: "/tutors" },
      { label: "THCS & Ôn thi vào lớp 10", href: "/tutors" },
      { label: "THPT & Luyện thi Đại học", href: "/tutors" },
      { label: "Chứng chỉ Quốc tế & Đi làm", href: "/tutors" },
    ],
  },
  {
    title: "TÀI NGUYÊN & HỖ TRỢ",
    links: [
      { label: "Câu chuyện thành công", href: "/#testimonials" },
      { label: "Hướng dẫn đặt lịch học thử", href: "/#workflow" },
      { label: "Câu hỏi thường gặp", href: "/#solutions" },
      { label: "Trung tâm trợ giúp 24/7", href: "/login" },
    ],
  },
  {
    title: "VỀ TUTORMATCH",
    links: [
      { label: "Sứ mệnh giáo dục", href: "/#about" },
      { label: "Tiêu chuẩn kiểm duyệt", href: "/#ai-platform" },
      { label: "Cổng quản trị viên", href: "/login" },
      { label: "Liên hệ hợp tác", href: "/register" },
    ],
  },
];

export default function PublicFooter() {
  return (
    <footer className="w-full px-3 sm:px-6 pb-6 pt-4 bg-surface-subtle">
      <div className="max-w-[1776px] mx-auto rounded-4xl bg-surface-card border border-border-default px-6 sm:px-12 lg:px-16 py-12 sm:py-16 text-brand-950 shadow-2xs">
        {/* Top Row: Brand Mark & Quick Social / Action Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-12">
          <div className="space-y-2 max-w-md">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Logo variant="gradient" size={44} />
              <span className="font-bold text-4xl tracking-tight text-brand">
                TutorMatching
              </span>
            </Link>
            <p className="text-base text-content-secondary leading-relaxed">
              Nền tảng trí tuệ nhân tạo kết nối gia sư 1-1 uy tín và học viên
              chất lượng hàng đầu tại Việt Nam.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {["Facebook", "LinkedIn"].map((social) => (
              <Link
                key={social}
                href="/tutors"
                className="inline-flex items-center gap-1.5 rounded-full bg-gray-900/5 hover:bg-gray-900/10 px-4 py-2 text-base font-bold text-brand-950 transition-colors"
              >
                <span>{social}</span>
                <svg
                  className="w-3.5 h-3.5 text-content-secondary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 17L17 7M7 7h10v10"
                  />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* 6-Column Directory Grid (Workday cmp-footer-redesign structure) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 py-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <h4 className="text-base font-bold uppercase text-brand">
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm text-content-secondary">
                {col.links.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="hover:text-brand font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Dashed Horizontal Divider (Workday 1px dashed rgba(21,29,38,0.32)) */}
        <div className="my-10 border-t border-dashed border-border-strong" />

        {/* Bottom Bar: Locale, Legal Links & Copyright */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-base text-content-secondary">
          <div className="flex flex-wrap items-center gap-5">
            <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
              <svg
                className="w-4 h-4 text-brand"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
              </svg>
              Việt Nam (Tiếng Việt)
            </span>
            <Link
              href="/login"
              className="hover:text-brand-950 transition-colors"
            >
              Chính sách bảo mật
            </Link>
            <Link
              href="/login"
              className="hover:text-brand-950 transition-colors"
            >
              Điều khoản sử dụng
            </Link>
            <Link
              href="/login"
              className="hover:text-brand-950 transition-colors"
            >
              Quy chuẩn cộng đồng Gia sư
            </Link>
          </div>

          <p className="font-medium text-content-secondary">
            © 2026 TutorMatching. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
