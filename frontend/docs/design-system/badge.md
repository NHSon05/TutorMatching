# Badge Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Badge](https://www.photonix.dev/components/badge)  
> **Đường dẫn component:** [`components/ui/badge.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/badge.tsx) (hoặc re-export tại [`components/badge.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/badge.tsx))

Component `Badge` hiển thị trạng thái hồ sơ, vai trò tài khoản, thẻ môn học, hoặc các trạng thái tiến trình (Đang hoạt động, Chờ duyệt, Bị khóa, Đã xác minh), hỗ trợ 7 biến thể màu sắc, 3 phong cách (`subtle`, `solid`, `outline`), và chấm trạng thái (`dot`).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `"gray" \| "brand" \| "tutor" \| "admin" \| "success" \| "warning" \| "error"` | `'gray'` | Biến thể màu sắc ngữ nghĩa. |
| `appearance` | `"subtle" \| "solid" \| "outline"` | `'subtle'` | Phong cách hiển thị (Nền nhạt, Nền đậm đặc, hoặc Viền trong suốt). |
| `shape` | `"pill" \| "rounded"` | `'pill'` | Kiểu bo tròn hoàn toàn hoặc bo góc nhẹ. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước nhãn. |
| `dot` | `boolean` | `false` | Hiển thị chấm tròn nhỏ chỉ báo trạng thái ở đầu nhãn. |
| `icon` | `React.ReactNode` | `-` | Biểu tượng đi kèm nhãn. |

---

## 2. Ví dụ sử dụng

```tsx
import { Badge } from "@/components/badge";

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Trạng thái xác thực */}
      <Badge variant="success" dot>Đã duyệt hồ sơ</Badge>
      <Badge variant="warning" dot>Chờ phê duyệt</Badge>
      <Badge variant="error" dot>Đã từ chối</Badge>

      {/* Vai trò tài khoản */}
      <Badge variant="brand" appearance="solid">HỌC VIÊN</Badge>
      <Badge variant="tutor" appearance="solid">GIA SƯ</Badge>
      <Badge variant="admin" appearance="solid">QUẢN TRỊ VIÊN</Badge>

      {/* Nhãn môn học */}
      <Badge variant="gray" appearance="outline">Toán học</Badge>
      <Badge variant="gray" appearance="outline">Tiếng Anh 12</Badge>
    </div>
  );
}
```
