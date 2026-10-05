import Link from "next/link";

export default function MyTutorsPage() {
  const activeTutors = [
    {
      id: 1,
      name: "Lê Phương Diệu",
      subject: "Tiếng Anh Cấp 2",
      sessionsCompleted: 12,
      status: "Đang học",
      phone: "0369 xxx xxx",
    },
    {
      id: 2,
      name: "Nguyễn Trọng Hưng",
      subject: "Toán Lớp 9",
      sessionsCompleted: 6,
      status: "Đang học",
      phone: "0982 xxx xxx",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gia Sư Của Tôi</h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách gia sư hiện đang nhận dạy kèm cho bạn.
          </p>
        </div>
        <Link
          href="/tutors"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Tìm thêm gia sư →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {activeTutors.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-gray-900">{t.name}</h3>
                <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold">
                  {t.status}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-1">
                <strong>Môn học:</strong> {t.subject}
              </p>
              <p className="text-xs text-gray-600 mb-4">
                <strong>Đã học:</strong> {t.sessionsCompleted} buổi
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <Link
                href="/messages"
                className="flex-1 text-center py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Nhắn tin
              </Link>
              <Link
                href="/learner/schedule"
                className="flex-1 text-center py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Lịch học
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
