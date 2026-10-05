export default function TutorTeachingClassesPage() {
  const classes = [
    {
      id: 1,
      name: "Lớp Tiếng Anh 8 (Em Hoàng Nam)",
      location: "Offline tại nhà (Cầu Giấy)",
      schedule: "Thứ 2 & Thứ 6 (19:00 - 21:00)",
      rate: "220.000đ / buổi",
      status: "Đang dạy",
    },
    {
      id: 2,
      name: "Lớp Tiếng Anh Giao tiếp (Chị Mai)",
      location: "Online",
      schedule: "Chủ nhật (15:00 - 17:00)",
      rate: "250.000đ / buổi",
      status: "Đang dạy",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Danh Sách Lớp Đang Dạy</h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi lịch trình và học phí các lớp bạn đang đảm nhiệm.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900">{c.name}</h3>
              <span className="text-xs px-2.5 py-0.5 bg-green-100 text-green-800 rounded-full font-semibold">
                {c.status}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p>📍 <strong>Hình thức:</strong> {c.location}</p>
              <p>⏰ <strong>Lịch học:</strong> {c.schedule}</p>
              <p>💰 <strong>Học phí:</strong> <span className="text-amber-700 font-bold">{c.rate}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
