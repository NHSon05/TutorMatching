# Switch Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Switch](https://www.photonix.dev/components/switch)  
> **Đường dẫn component:** [`components/ui/switch.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/switch.tsx) (hoặc re-export tại [`components/switch.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/switch.tsx))

Component `Switch` là công tắc gạt 2 trạng thái Bật/Tắt (On/Off), thường sử dụng cho cài đặt hệ thống, kích hoạt thông báo, hoặc mở trạng thái sẵn sàng nhận lớp của Gia sư.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `checked` | `boolean` | `undefined` | Trạng thái bật/tắt có kiểm soát (Controlled). |
| `defaultChecked` | `boolean` | `false` | Trạng thái mặc định (Uncontrolled). |
| `onChange` | `(checked: boolean) => void` | `-` | Callback khi gạt công tắc. |
| `label` | `React.ReactNode` | `-` | Nhãn chính hiển thị bên cạnh công tắc. |
| `helperText` | `React.ReactNode` | `-` | Ghi chú hướng dẫn phía dưới nhãn. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước công tắc. |
| `variant` | `"primary" \| "brand" \| "tutor" \| "success"` | `'primary'` | Màu sắc đường trượt khi bật. |
| `isLoading` | `boolean` | `false` | Hiển thị spinner nhỏ bên trong núm gạt khi đang cập nhật API. |
| `disabled` | `boolean` | `false` | Khóa công tắc. |

---

## 2. Ví dụ sử dụng

```tsx
import { Switch } from "@/components/switch";
import { useState } from "react";

export default function SwitchDemo() {
  const [acceptingStudents, setAcceptingStudents] = useState(true);

  return (
    <div className="space-y-4">
      <Switch
        checked={acceptingStudents}
        onChange={setAcceptingStudents}
        variant="tutor"
        label="Sẵn sàng nhận học viên mới"
        helperText="Hồ sơ của bạn sẽ hiển thị công khai trên danh sách tìm kiếm gia sư."
      />

      <Switch
        defaultChecked
        variant="brand"
        label="Nhận thông báo qua Email"
        helperText="Nhận thông báo tức thì khi phụ huynh gửi lời mời dạy mới."
      />
    </div>
  );
}
```
