# Dropdown Component (Select)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Dropdown](https://www.photonix.dev/components/dropdown)  
> **Đường dẫn component:** [`components/ui/dropdown.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/dropdown.tsx) (hoặc re-export tại [`components/dropdown.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/dropdown.tsx))

Component `Dropdown` là menu thả xuống chọn 1 mục (Single-Select) có hỗ trợ tìm kiếm từ khóa (`isSearchable`), icon minh họa, mô tả phụ cho từng tùy chọn, và thông báo lỗi.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `DropdownOption[]` | **Bắt buộc** | Danh sách `{ value, label, icon?, description?, disabled? }`. |
| `value` | `string` | `undefined` | Giá trị đang chọn (Controlled). |
| `defaultValue` | `string` | `""` | Giá trị mặc định (Uncontrolled). |
| `onChange` | `(value: string) => void` | `-` | Callback khi chọn một mục. |
| `placeholder` | `string` | `"Chọn một tùy chọn..."` | Văn bản hiển thị khi chưa chọn mục nào. |
| `label` | `React.ReactNode` | `-` | Nhãn tiêu đề phía trên. |
| `helperText` | `React.ReactNode` | `-` | Chú thích phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi. |
| `isSearchable` | `boolean` | `false` | Bật thanh tìm kiếm bên trong danh sách thả xuống. |
| `isFullWidth` | `boolean` | `true` | Chiếm 100% chiều rộng vùng chứa. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước menu. |

---

## 2. Ví dụ sử dụng

```tsx
import { Dropdown } from "@/components/dropdown";
import { useState } from "react";

export default function DropdownDemo() {
  const [subject, setSubject] = useState("");

  return (
    <div className="max-w-sm">
      <Dropdown
        label="Môn học cần tìm gia sư"
        placeholder="Chọn môn học..."
        value={subject}
        onChange={setSubject}
        isSearchable
        searchPlaceholder="Nhập tên môn học..."
        options={[
          { value: "MATH", label: "Toán học", description: "Đại số & Hình học Cấp 1, 2, 3" },
          { value: "PHYSICS", label: "Vật lý", description: "Lý thuyết & Luyện đề THPT QG" },
          { value: "CHEMISTRY", label: "Hóa học", description: "Vô cơ & Hữu cơ" },
          { value: "ENGLISH", label: "Tiếng Anh", description: "IELTS, TOEIC & Giao tiếp" },
          { value: "LITERATURE", label: "Ngữ văn", description: "Văn nghị luận & Tác phẩm" },
        ]}
      />
    </div>
  );
}
```
