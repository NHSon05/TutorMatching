import { Button } from "@/components/ui/button";

export default function AdminUsersPage() {
  const users = [
    { id: 1, name: "Nguyễn Văn Phụ Huynh", email: "parent1@gmail.com", role: "LEARNER", status: "Hoạt động" },
    { id: 2, name: "Lê Phương Diệu", email: "dieulp@gmail.com", role: "TUTOR", status: "Hoạt động" },
    { id: 3, name: "Admin Quản Trị", email: "admin@tutormatching.vn", role: "ADMIN", status: "Hoạt động" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản Lý Tài Khoản</h1>
        <p className="text-sm text-gray-500 mt-1">
          Danh sách toàn bộ tài khoản Học viên, Gia sư và Quản trị viên trong hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="py-3.5 px-4 font-semibold text-gray-900">{u.name}</td>
                  <td className="py-3.5 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs text-green-700 font-medium">● {u.status}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button variant="danger" size="small">
                      Khóa
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
