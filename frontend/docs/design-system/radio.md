# Radio Component & RadioGroup

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Radio](https://www.photonix.dev/components/radio)  
> **Đường dẫn component:** [`components/ui/radio.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/radio.tsx) (hoặc re-export tại [`components/radio.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/radio.tsx))

Bộ đôi `Radio` và `RadioGroup` cho phép người dùng chọn duy nhất 1 tùy chọn trong một tập hợp các giá trị loại trừ lẫn nhau (Mutual Exclusion), hỗ trợ sắp xếp theo chiều dọc hoặc ngang, thông báo lỗi nhóm, và nhãn phụ.

---

## 1. RadioGroup API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | `auto-generated` | Tên của nhóm input radio. |
| `value` | `string` | `undefined` | Giá trị đang chọn (Controlled). |
| `defaultValue` | `string` | `undefined` | Giá trị mặc định (Uncontrolled). |
| `onChange` | `(value: string) => void` | `-` | Callback khi thay đổi mục chọn. |
| `orientation` | `"vertical" \| "horizontal"` | `'vertical'` | Hướng hiển thị danh sách các mục. |
| `label` | `React.ReactNode` | `-` | Tiêu đề chung của nhóm (`<legend>`). |
| `helperText` | `React.ReactNode` | `-` | Dòng giải thích phía dưới nhóm. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi của nhóm. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước đồng bộ cho toàn bộ radio bên trong. |
| `variant` | `"primary" \| "brand" \| "tutor"` | `'primary'` | Biến thể màu đồng bộ. |
| `disabled` | `boolean` | `false` | Khóa toàn bộ các radio trong nhóm. |

---

## 2. Ví dụ sử dụng

```tsx
import { RadioGroup, Radio } from "@/components/radio";
import { useState } from "react";

export default function RadioDemo() {
  const [learningMode, setLearningMode] = useState("ONLINE");

  return (
    <RadioGroup
      label="Hình thức học mong muốn"
      helperText="Hình thức học sẽ áp dụng cho tất cả các buổi trong tuần."
      value={learningMode}
      onChange={setLearningMode}
      variant="brand"
      orientation="vertical"
    >
      <Radio
        value="ONLINE"
        label="Học Trực tuyến (Online)"
        helperText="Học qua Google Meet / Zoom với bảng tương tác."
      />
      <Radio
        value="OFFLINE"
        label="Học Trực tiếp tại nhà (Offline)"
        helperText="Gia sư đến dạy tận nơi theo địa chỉ bạn cung cấp."
      />
      <Radio
        value="HYBRID"
        label="Kết hợp (Hybrid)"
        helperText="Linh hoạt luân phiên giữa học online và gặp trực tiếp."
      />
    </RadioGroup>
  );
}
```
