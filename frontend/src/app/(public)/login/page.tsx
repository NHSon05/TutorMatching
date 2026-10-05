"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Đăng Nhập</h2>
          <p className="text-xs text-gray-500 mt-1">
            Chào mừng bạn quay lại hệ thống TutorMatching
          </p>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="mb-6 p-4 bg-blue-50/60 border border-blue-100 rounded-xl">
          <p className="text-xs font-semibold text-blue-800 mb-2.5 text-center">
            🚀 Chọn nhanh vai trò để trải nghiệm:
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="brand"
              isFullWidth
              onClick={() => handleRoleDemo("LEARNER")}
            >
              Vào Không gian Học viên (Learner)
            </Button>
            <Button
              type="button"
              variant="tutor"
              isFullWidth
              onClick={() => handleRoleDemo("TUTOR")}
            >
              Vào Không gian Gia sư (Tutor)
            </Button>
            <Button
              type="button"
              variant="danger"
              isFullWidth
              onClick={() => handleRoleDemo("ADMIN")}
            >
              Vào Không gian Quản trị (Admin)
            </Button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRoleDemo("LEARNER"); }}>
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
            Đăng nhập
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="text-blue-600 font-semibold hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
