import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs h-[75vh] flex">
      {/* Cột danh sách hội thoại */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">Hộp Thư</h2>
          <input
            type="text"
            placeholder="Tìm cuộc trò chuyện..."
            className="w-full mt-2 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          <div className="p-3.5 bg-blue-50/60 cursor-pointer flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              D
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs text-gray-900 truncate">
                  Lê Phương Diệu
                </h4>
                <span className="text-[10px] text-gray-400">10:45</span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                Em đã nhận lịch học buổi tối mai rồi ạ...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cột nội dung chat */}
      <div className="flex-1 flex flex-col justify-between bg-gray-50/30">
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-gray-900">Lê Phương Diệu</h3>
            <span className="text-xs text-green-600">● Đang trực tuyến</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 max-w-sm text-xs text-gray-800 shadow-2xs">
              Chào em, mai học lúc 19h như thường lệ nhé.
            </div>
          </div>
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white rounded-xl px-4 py-2.5 max-w-sm text-xs shadow-2xs">
              Dạ vâng ạ, em đã chuẩn bị bài tập phần thì quá khứ hoàn thành rồi ạ!
            </div>
          </div>
        </div>

        <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
          <input
            type="text"
            placeholder="Nhập nội dung tin nhắn..."
            className="flex-1 px-3.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <Button variant="brand">
            Gửi
          </Button>
        </div>
      </div>
    </div>
  );
}
