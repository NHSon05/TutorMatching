import Link from "next/link";
import Logo from "@assets/logo/Logo";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Logo variant="gradient" size={28} />
            <span className="font-bold text-lg text-white">TutorMatching</span>
          </div>
          <p className="text-sm text-gray-400">
            Nền tảng kết nối gia sư uy tín và học viên chất lượng hàng đầu.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Dành cho Học viên</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/tutors" className="hover:text-white transition-colors">
                Tìm kiếm gia sư
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white transition-colors">
                Đăng ký học
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Dành cho Gia sư</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/register" className="hover:text-white transition-colors">
                Trở thành gia sư
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition-colors">
                Đăng nhập gia sư
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-3">Hệ thống</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/login" className="hover:text-white transition-colors">
                Cổng quản trị viên
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © 2026 TutorMatching. All rights reserved.
      </div>
    </footer>
  );
}
