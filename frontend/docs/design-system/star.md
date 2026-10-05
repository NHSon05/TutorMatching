# Star Component (Rating)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Star](https://www.photonix.dev/components/star)  
> **Đường dẫn component:** [`components/ui/star.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/star.tsx) (hoặc re-export tại [`components/star.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/star.tsx))

Component `Star` (Rating) hỗ trợ đánh giá xếp hạng sao cho gia sư và lớp học, hỗ trợ nửa sao (half-star), xem trước khi di chuột (hover preview), chế độ chỉ đọc (`readOnly`), và hiển thị điểm số thập phân (`showScore`).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `undefined` | Điểm đánh giá hiện tại (Controlled). |
| `defaultValue` | `number` | `0` | Điểm khởi tạo (Uncontrolled). |
| `max` | `number` | `5` | Số lượng ngôi sao tối đa. |
| `allowHalf` | `boolean` | `true` | Cho phép chọn nửa sao (0.5). |
| `readOnly` | `boolean` | `false` | Chế độ chỉ đọc (dùng hiển thị điểm trung bình trên thẻ gia sư). |
| `onChange` | `(value: number) => void` | `-` | Callback khi người dùng bấm chọn số sao. |
| `showScore` | `boolean` | `false` | Hiển thị điểm số dạng số bên cạnh (ví dụ `4.8`). |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước các ngôi sao. |
| `disabled` | `boolean` | `false` | Khóa tương tác. |

---

## 2. Ví dụ sử dụng

```tsx
import { Star } from "@/components/star";
import { useState } from "react";

export default function StarDemo() {
  const [rating, setRating] = useState(4.5);

  return (
    <div className="space-y-4">
      {/* Đánh giá tương tác */}
      <div>
        <p className="text-sm font-medium mb-1">Đánh giá chất lượng buổi học:</p>
        <Star
          value={rating}
          onChange={setRating}
          showScore
          size="large"
        />
      </div>

      {/* Hiển thị điểm gia sư chỉ đọc (Readonly) */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Uy tín gia sư:</span>
        <Star
          value={4.9}
          readOnly
          showScore
          size="small"
        />
      </div>
    </div>
  );
}
```
