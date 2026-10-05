import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Tạo Tài Khoản</h2>
          <p className="text-xs text-gray-500 mt-1">
            Bắt đầu hành trình học tập và giảng dạy cùng TutorMatching
          </p>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Bạn muốn tham gia với vai trò?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 border border-blue-200 bg-blue-50/30 rounded-lg cursor-pointer text-xs font-medium text-gray-800">
                <input type="radio" name="role" defaultChecked className="text-blue-600" />
                <span>Học viên / Phụ huynh</span>
              </label>
              <label className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer text-xs font-medium text-gray-800">
                <input type="radio" name="role" className="text-blue-600" />
                <span>Gia sư</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Họ và tên
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="example@gmail.com"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <Button
            type="submit"
            variant="brand"
            isFullWidth
          >
            Đăng ký
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
