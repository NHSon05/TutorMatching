# SelectCheck Component (Multi-Select)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Select Check](https://www.photonix.dev/components/select-check)  
> **Đường dẫn component:** [`components/ui/select-check.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/select-check.tsx) (hoặc re-export tại [`components/select-check.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/select-check.tsx))

Component `SelectCheck` cho phép người dùng chọn đồng thời nhiều giá trị từ danh sách thả xuống, có ô checkbox cho từng dòng, hiển thị tóm tắt bằng các badge tag trên thanh kích hoạt, hỗ trợ nút "Chọn tất cả" và tìm kiếm từ khóa.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `SelectCheckOption[]` | **Bắt buộc** | Danh sách `{ value, label, disabled? }`. |
| `values` | `string[]` | `undefined` | Mảng các giá trị đang chọn (Controlled). |
| `defaultValues` | `string[]` | `[]` | Mảng các giá trị khởi tạo (Uncontrolled). |
| `onChange` | `(values: string[]) => void` | `-` | Callback khi danh sách mục chọn thay đổi. |
| `placeholder` | `string` | `"Chọn các mục..."` | Văn bản hiển thị khi chưa chọn mục nào. |
| `maxDisplayedBadges` | `number` | `2` | Số lượng badge tối đa hiển thị trực tiếp (các mục còn lại gom thành `+N`). |
| `isSearchable` | `boolean` | `true` | Bật ô tìm kiếm nhanh bên trong menu. |
| `label` | `React.ReactNode` | `-` | Nhãn tiêu đề phía trên. |
| `helperText` | `React.ReactNode` | `-` | Dòng giải thích phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi. |

---

## 2. Ví dụ sử dụng

```tsx
import { SelectCheck } from "@/components/select-check";
import { useState } from "react";

export default function SelectCheckDemo() {
  const [selectedGrades, setSelectedGrades] = useState<string[]>(["GRADE_10", "GRADE_11"]);

  return (
    <div className="max-w-md">
      <SelectCheck
        label="Khối lớp nhận dạy"
        placeholder="Chọn các khối lớp..."
        values={selectedGrades}
        onChange={setSelectedGrades}
        maxDisplayedBadges={3}
        options={[
          { value: "GRADE_6", label: "Lớp 6" },
          { value: "GRADE_7", label: "Lớp 7" },
          { value: "GRADE_8", label: "Lớp 8" },
          { value: "GRADE_9", label: "Lớp 9 (Ôn thi vào 10)" },
          { value: "GRADE_10", label: "Lớp 10" },
          { value: "GRADE_11", label: "Lớp 11" },
          { value: "GRADE_12", label: "Lớp 12 (Ôn thi ĐH)" },
        ]}
        helperText="Gia sư có thể chọn nhiều khối lớp phù hợp với chuyên môn của mình."
      />
    </div>
  );
}
```
