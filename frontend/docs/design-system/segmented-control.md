# SegmentedControl Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Segmented Control](https://www.photonix.dev/components/segmented-control)  
> **Đường dẫn component:** [`components/ui/segmented-control.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/segmented-control.tsx) (hoặc re-export tại [`components/segmented-control.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/segmented-control.tsx))

Component `SegmentedControl` (Pill Tab Switcher) là thanh chuyển đổi phân đoạn trực quan, dùng để chuyển chế độ xem (Ví dụ: Lưới / Danh sách, Tuần / Tháng) hoặc lọc trạng thái duyệt hồ sơ gia sư.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `options` | `SegmentedControlOption[]` | **Bắt buộc** | Danh sách các tùy chọn `{ value, label, icon?, badge?, disabled? }`. |
| `value` | `string` | `undefined` | Giá trị đang chọn (Controlled). |
| `defaultValue` | `string` | `options[0].value` | Giá trị mặc định (Uncontrolled). |
| `onChange` | `(value: string) => void` | `-` | Callback khi chuyển tab. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước thanh chuyển đổi. |
| `isFullWidth` | `boolean` | `false` | Giãn rộng đều các tab 100% bề ngang. |
| `disabled` | `boolean` | `false` | Khóa toàn bộ thanh chuyển đổi. |

---

## 2. Ví dụ sử dụng

```tsx
import { SegmentedControl } from "@/components/segmented-control";
import { useState } from "react";

export default function SegmentedControlDemo() {
  const [tab, setTab] = useState("ALL");

  return (
    <SegmentedControl
      value={tab}
      onChange={setTab}
      options={[
        { value: "ALL", label: "Tất cả hồ sơ", badge: 45 },
        { value: "PENDING", label: "Chờ phê duyệt", badge: 5 },
        { value: "APPROVED", label: "Đã duyệt", badge: 38 },
        { value: "REJECTED", label: "Từ chối", badge: 2 },
      ]}
    />
  );
}
```
