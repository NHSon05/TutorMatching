import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TutorsPage() {
  const sampleTutors = [
    {
      id: 1,
      name: "Lê Phương Diệu",
      school: "Đại học Luật Hà Nội",
      subjects: "Tiếng Anh (Cấp 1, Cấp 2, Cấp 3)",
      area: "Cầu Giấy, Ba Đình, Đống Đa",
      rate: "200.000đ - 250.000đ/buổi",
    },
    {
      id: 2,
      name: "Nguyễn Trọng Hưng",
      school: "Đại học Kinh Tế Quốc Dân",
      subjects: "Toán, Tiếng Anh (Luyện thi vào 10)",
      area: "Thanh Xuân, Hai Bà Trưng",
      rate: "180.000đ - 220.000đ/buổi",
    },
    {
      id: 3,
      name: "Tạ Bích Ngọc",
      school: "ĐH Ngoại ngữ - ĐHQGHN",
      subjects: "Tiếng Anh, Luyện thi IELTS",
      area: "Cầu Giấy, Nam Từ Liêm",
      rate: "250.000đ - 300.000đ/buổi",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Danh Sách Gia Sư</h1>
          <p className="text-sm text-gray-500 mt-1">
            Tìm kiếm gia sư theo môn học, khu vực và cấp học
          </p>
        </div>

        {/* Search quick filter */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm theo môn, quận huyện..."
            className="text-sm px-3.5 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 w-64"
          />
          <Button variant="brand" size="small">
            Tìm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleTutors.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                  {tutor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{tutor.name}</h3>
                  <p className="text-xs text-gray-500">{tutor.school}</p>
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-1.5 mb-4">
                <p>
                  <strong className="text-gray-700">Môn dạy:</strong> {tutor.subjects}
                </p>
                <p>
                  <strong className="text-gray-700">Khu vực:</strong> {tutor.area}
                </p>
                <p>
                  <strong className="text-gray-700">Học phí:</strong>{" "}
                  <span className="text-blue-600 font-semibold">{tutor.rate}</span>
                </p>
              </div>
            </div>

            <Button asChild variant="secondary" size="small" isFullWidth>
              <Link href="/login">Đăng nhập để mời dạy</Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
