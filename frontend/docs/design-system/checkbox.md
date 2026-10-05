# Checkbox Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Checkbox](https://www.photonix.dev/components/checkbox)  
> **Đường dẫn component:** [`components/ui/checkbox.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/checkbox.tsx) (hoặc re-export tại [`components/checkbox.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/checkbox.tsx))

Component `Checkbox` cho phép người dùng chọn một hoặc nhiều mục trong danh sách, hỗ trợ trạng thái chọn dở dang (`indeterminate`), nhãn chính (`label`), ghi chú phụ (`helperText`), thông báo lỗi (`error`), và 3 cấp độ kích thước.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checked` | `boolean` | `undefined` | Trạng thái chọn có kiểm soát (Controlled). |
| `defaultChecked` | `boolean` | `false` | Trạng thái chọn mặc định không kiểm soát (Uncontrolled). |
| `indeterminate` | `boolean` | `false` | Trạng thái chọn một phần (dấu gạch ngang `-`). |
| `onChange` | `(checked: boolean, event) => void` | `-` | Callback kích hoạt khi trạng thái thay đổi. |
| `label` | `React.ReactNode` | `-` | Nhãn hiển thị bên cạnh hộp chọn. |
| `helperText` | `React.ReactNode` | `-` | Dòng mô tả chi tiết dưới nhãn. |
| `error` | `string \| boolean` | `-` | Chuỗi thông báo lỗi hoặc cờ báo lỗi. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước hộp chọn (16px, 20px, 24px). |
| `variant` | `"primary" \| "brand" \| "tutor"` | `'primary'` | Biến thể màu sắc khi được chọn. |
| `disabled` | `boolean` | `false` | Vô hiệu hóa tương tác. |

---

## 2. Ví dụ sử dụng

```tsx
import { Checkbox } from "@/components/checkbox";
import { useState } from "react";

export default function CheckboxDemo() {
  const [agree, setAgree] = useState(false);

  return (
    <div className="space-y-4">
      <Checkbox
        checked={agree}
        onChange={(val) => setAgree(val)}
        label="Tôi đồng ý với Điều khoản dịch vụ và Chính sách gia sư"
        helperText="Yêu cầu bắt buộc để tạo tài khoản gia sư hoặc học viên."
        variant="brand"
      />

      <Checkbox
        indeterminate
        label="Chọn tất cả môn học"
        helperText="Đã chọn 2 trên 5 môn học."
      />

      <Checkbox
        disabled
        label="Gia sư có bằng sư phạm (Chưa xác minh)"
      />
    </div>
  );
}
```
