import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TutorDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, Gia sư 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các lớp dạy, lời mời và hồ sơ gia sư của bạn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 bg-green-100 text-green-800 font-semibold rounded-full border border-green-200">
            ✓ Hồ sơ đã được duyệt
          </span>
        </div>
      </div>

      {/* Thống kê gia sư */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Lớp đang dạy
          </span>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">3</p>
          <span className="text-xs text-gray-500 mt-1 block">Tổng 6 học viên</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Lời mời dạy mới
          </span>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">2</p>
          <span className="text-xs text-gray-500 mt-1 block">Chờ phản hồi trong 24h</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Đánh giá trung bình
          </span>
          <p className="text-3xl font-extrabold text-yellow-500 mt-2">5.0 ⭐</p>
          <span className="text-xs text-gray-500 mt-1 block">Dựa trên 18 lượt đánh giá</span>
        </div>
      </div>

      {/* Hành động nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs">
          <h2 className="font-bold text-gray-900 text-base mb-3">
            Lời mời nhận lớp mới nhất
          </h2>
          <div className="space-y-3">
            <div className="p-3.5 bg-gray-50 rounded-lg flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm text-gray-800">
                  Kèm Tiếng Anh lớp 8 tại nhà
                </h4>
                <p className="text-xs text-gray-500">
                  Phụ huynh: Nguyễn Văn A • Q. Cầu Giấy
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="tutor" size="small">
                  Nhận
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-base mb-2">
              Hoàn thiện hồ sơ gia sư
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Cập nhật chứng chỉ, lịch rảnh trong tuần và khu vực nhận dạy để nhận thêm nhiều đề xuất lớp học phù hợp.
            </p>
          </div>
          <Button asChild variant="tutor" isFullWidth>
            <Link href="/tutor/profile-edit">Chỉnh sửa hồ sơ & Lịch dạy</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
