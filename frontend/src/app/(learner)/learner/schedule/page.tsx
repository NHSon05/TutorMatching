export default function LearnerSchedulePage() {
  const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thời Khóa Biểu Học Tập</h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi lịch học các môn trong tuần của bạn.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-bold text-gray-700 py-3">
          {days.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 min-h-[300px] divide-x divide-gray-200 p-2">
          {/* Thứ 2 */}
          <div className="p-2 space-y-2">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
              <span className="font-bold text-blue-700 block">19:00 - 21:00</span>
              <span className="text-gray-800 font-medium block">Tiếng Anh</span>
              <span className="text-gray-500 text-[11px]">GS. Phương Diệu</span>
            </div>
          </div>

          {/* Thứ 3 */}
          <div className="p-2"></div>

          {/* Thứ 4 */}
          <div className="p-2 space-y-2">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
              <span className="font-bold text-amber-700 block">18:00 - 19:30</span>
              <span className="text-gray-800 font-medium block">Toán 9 (Online)</span>
              <span className="text-gray-500 text-[11px]">GS. Trọng Hưng</span>
            </div>
          </div>

          {/* Thứ 5 */}
          <div className="p-2"></div>

          {/* Thứ 6 */}
          <div className="p-2 space-y-2">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs">
              <span className="font-bold text-blue-700 block">19:00 - 21:00</span>
              <span className="text-gray-800 font-medium block">Tiếng Anh</span>
              <span className="text-gray-500 text-[11px]">GS. Phương Diệu</span>
            </div>
          </div>

          {/* Thứ 7 */}
          <div className="p-2 space-y-2">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
              <span className="font-bold text-amber-700 block">14:00 - 15:30</span>
              <span className="text-gray-800 font-medium block">Toán 9 (Online)</span>
              <span className="text-gray-500 text-[11px]">GS. Trọng Hưng</span>
            </div>
          </div>

          {/* Chủ nhật */}
          <div className="p-2"></div>
        </div>
      </div>
    </div>
  );
}
