import { Button } from "@/components/ui/button";

export default function AdminTutorApprovalsPage() {
  const pendingTutors = [
    {
      id: 1,
      name: "Phạm Bảo Trân",
      school: "Đại học Luật Hà Nội",
      major: "Luật",
      subjects: "Toán, Tiếng Việt, Tiếng Anh",
      gpa: "3.6/4.0",
      status: "Chờ duyệt",
    },
    {
      id: 2,
      name: "Bùi Khánh Huyền",
      school: "Đại học Thương mại",
      major: "Logistics",
      subjects: "Tiếng Anh Cấp 1 & 2",
      gpa: "3.5/4.0",
      status: "Chờ duyệt",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Duyệt Hồ Sơ Gia Sư</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kiểm tra bằng cấp, CCCD/Thẻ SV và xác thực gia sư trước khi mở công khai trên hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Trường & Chuyên ngành</th>
                <th className="py-3 px-4">Môn dạy</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingTutors.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{t.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {t.school} ({t.major})
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{t.subjects}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Button variant="success" size="small">
                      Duyệt
                    </Button>
                    <Button variant="danger" size="small">
                      Từ chối
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
