# ChipBar Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Chip Bar](https://www.photonix.dev/components/chip-bar)  
> **Đường dẫn component:** [`components/ui/chip-bar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/chip-bar.tsx) (hoặc re-export tại [`components/chip-bar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/chip-bar.tsx))

Component `ChipBar` là thanh cuộn ngang chứa các thẻ chip/tag lọc nhanh danh mục môn học, trình độ, hoặc hình thức học, hỗ trợ chọn đơn (`single`) hoặc chọn nhiều (`multiple`), kèm nút cuộn nhanh mượt mà khi danh mục quá dài.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `chips` | `ChipItem[]` | **Bắt buộc** | Danh sách thẻ chip `{ id, label, icon?, count? }`. |
| `selectedIds` | `string[]` | `undefined` | Danh sách ID các chip đang chọn (Controlled). |
| `defaultSelectedIds` | `string[]` | `[]` | Danh sách ID khởi tạo (Uncontrolled). |
| `onChange` | `(selectedIds: string[]) => void` | `-` | Callback khi thay đổi các chip được chọn. |
| `mode` | `"single" \| "multiple"` | `'single'` | Chế độ chọn một mục hay nhiều mục đồng thời. |

---

## 2. Ví dụ sử dụng

```tsx
import { ChipBar } from "@/components/chip-bar";
import { useState } from "react";

export default function SubjectFilterDemo() {
  const [selectedSubject, setSelectedSubject] = useState<string[]>(["toan"]);

  return (
    <ChipBar
      mode="single"
      selectedIds={selectedSubject}
      onChange={setSelectedSubject}
      chips={[
        { id: "all", label: "Tất cả", count: 120 },
        { id: "toan", label: "Toán học", count: 45 },
        { id: "tieng-anh", label: "Tiếng Anh", count: 38 },
        { id: "vat-ly", label: "Vật lý", count: 22 },
        { id: "hoa-hoc", label: "Hóa học", count: 18 },
        { id: "sinh-hoc", label: "Sinh học", count: 9 },
        { id: "tin-hoc", label: "Tin học lập trình", count: 14 },
      ]}
    />
  );
}
```
