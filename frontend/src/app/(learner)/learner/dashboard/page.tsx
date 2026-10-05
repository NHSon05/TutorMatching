import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LearnerDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, Học viên 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chào mừng bạn đến với bảng điều khiển học tập cá nhân.
          </p>
        </div>

        <Button asChild variant="brand" size="small">
          <Link href="/tutors">🔍 Tìm gia sư mới</Link>
        </Button>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Gia sư đang học
          </span>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">2</p>
          <span className="text-xs text-gray-500 mt-1 block">Toán, Tiếng Anh</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Buổi học trong tuần
          </span>
          <p className="text-3xl font-extrabold text-green-600 mt-2">4</p>
          <span className="text-xs text-gray-500 mt-1 block">2 buổi offline, 2 buổi online</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Yêu cầu đang chờ
          </span>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">1</p>
          <span className="text-xs text-gray-500 mt-1 block">Đang đợi gia sư xác nhận</span>
        </div>
      </div>

      {/* Lịch học sắp tới */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-base">Buổi học sắp tới</h2>
          <Link
            href="/learner/schedule"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Xem lịch đầy đủ →
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-sm">
                T2
              </span>
              <div>
                <h3 className="font-semibold text-sm text-gray-800">
                  Tiếng Anh - Cô Lê Phương Diệu
                </h3>
                <p className="text-xs text-gray-500">19:00 - 21:00 • Tại nhà</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 font-medium rounded-full">
              Đúng giờ
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 font-bold flex items-center justify-center text-sm">
                T4
              </span>
              <div>
                <h3 className="font-semibold text-sm text-gray-800">
                  Toán 9 - Thầy Nguyễn Trọng Hưng
                </h3>
                <p className="text-xs text-gray-500">18:00 - 19:30 • Trực tuyến</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-medium rounded-full">
              Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
