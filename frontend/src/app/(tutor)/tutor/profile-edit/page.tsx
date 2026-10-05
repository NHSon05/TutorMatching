import { Button } from "@/components/ui/button";

export default function TutorProfileEditPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hồ Sơ Giảng Dạy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cập nhật thông tin học vấn, chuyên môn dạy và khu vực nhận lớp.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-2xs space-y-5">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Trường đại học / Cơ quan công tác
          </label>
          <input
            type="text"
            defaultValue="Trường Đại học Luật Hà Nội"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Chuyên ngành
          </label>
          <input
            type="text"
            defaultValue="Luật - Khoa luật quốc tế"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Môn học nhận dạy
          </label>
          <input
            type="text"
            defaultValue="Tiếng Anh (Cấp 1, Cấp 2, Cấp 3)"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Khu vực nhận dạy
          </label>
          <input
            type="text"
            defaultValue="Q. Ba Đình, Q. Tây Hồ, Q. Cầu Giấy, Q. Đống Đa [Hà Nội]"
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Thành tích & Kinh nghiệm giảng dạy
          </label>
          <textarea
            rows={4}
            defaultValue="12 năm học sinh giỏi, TOEIC 880 điểm (tương đương 7.0 IELTS), 2 năm gia sư tiếng Anh..."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          ></textarea>
        </div>

        <Button type="button" variant="tutor">
          Lưu thay đổi hồ sơ
        </Button>
      </div>
    </div>
  );
}
