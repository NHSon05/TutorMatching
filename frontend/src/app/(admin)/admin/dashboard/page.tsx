import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bảng Điều Khiển Quản Trị</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tổng quan chỉ số hoạt động toàn hệ thống TutorMatching.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Tổng người dùng
          </span>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">1.248</p>
          <span className="text-xs text-green-600 mt-1 block">↑ 12% so với tháng trước</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Hồ sơ gia sư chờ duyệt
          </span>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">14</p>
          <span className="text-xs text-amber-600 mt-1 block">Cần xử lý trong ngày</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Lớp học đang diễn ra
          </span>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">352</p>
          <span className="text-xs text-blue-600 mt-1 block">Tỷ lệ hoàn thành 98%</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase">
            Báo cáo khiếu nại
          </span>
          <p className="text-3xl font-extrabold text-red-600 mt-2">0</p>
          <span className="text-xs text-gray-500 mt-1 block">Hệ thống an toàn</span>
        </div>
      </div>

      {/* Cần xử lý gấp */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 text-base">Hồ sơ gia sư mới gửi yêu cầu</h2>
          <Link
            href="/admin/tutor-approvals"
            className="text-xs font-semibold text-red-600 hover:underline"
          >
            Xem tất cả 14 hồ sơ →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase">
              <tr>
                <th className="py-2.5 px-3">Gia sư</th>
                <th className="py-2.5 px-3">Trường</th>
                <th className="py-2.5 px-3">Môn đăng ký</th>
                <th className="py-2.5 px-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-3 px-3 font-semibold text-gray-900">Phạm Bảo Trân</td>
                <td className="py-3 px-3 text-gray-600">Đại học Luật Hà Nội</td>
                <td className="py-3 px-3 text-gray-600">Toán, Tiếng Anh Cấp 1</td>
                <td className="py-3 px-3">
                  <Link
                    href="/admin/tutor-approvals"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Xem xét duyệt
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
