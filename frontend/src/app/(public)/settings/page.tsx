import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài Đặt Tài Khoản</h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý thông tin bảo mật, email và thông báo của bạn.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Email liên kết
          </label>
          <input
            type="email"
            disabled
            defaultValue="user@tutormatching.vn"
            className="w-full text-sm border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            defaultValue="0912 345 678"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div className="pt-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Đổi mật khẩu
          </label>
          <div className="space-y-2">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <Button type="button" variant="brand">
          Lưu cài đặt
        </Button>
      </div>
    </div>
  );
}
