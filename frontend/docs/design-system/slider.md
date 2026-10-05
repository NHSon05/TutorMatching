# Slider Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Slider](https://www.photonix.dev/components/slider)  
> **Đường dẫn component:** [`components/ui/slider.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/slider.tsx) (hoặc re-export tại [`components/slider.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/slider.tsx))

Component `Slider` cho phép người dùng chọn một giá trị số trong một khoảng xác định bằng cách kéo thanh trượt hoặc sử dụng phím mũi tên. Thường dùng trong bộ lọc mức học phí mong muốn, lọc số năm kinh nghiệm, hoặc thời lượng mỗi buổi học.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `undefined` | Giá trị hiện tại (Controlled). |
| `defaultValue` | `number` | `min` | Giá trị khởi tạo (Uncontrolled). |
| `min` | `number` | `0` | Giá trị tối thiểu. |
| `max` | `number` | `100` | Giá trị tối đa. |
| `step` | `number` | `1` | Bước nhảy mỗi lần tăng/giảm. |
| `onChange` | `(value: number) => void` | `-` | Callback khi giá trị thay đổi. |
| `formatValue` | `(value: number) => string` | `(v) => \`\${v}\`` | Hàm định dạng chuỗi hiển thị giá trị (ví dụ tiền tệ VNĐ). |
| `label` | `React.ReactNode` | `-` | Tiêu đề của thanh trượt. |
| `helperText` | `React.ReactNode` | `-` | Ghi chú hướng dẫn phía dưới. |
| `marks` | `Array<{ value: number, label?: string }>` | `-` | Các mốc đánh dấu giá trị trên thanh trượt. |
| `variant` | `"primary" \| "brand" \| "tutor"` | `'brand'` | Biến thể màu sắc cho đoạn trượt đang chọn. |
| `disabled` | `boolean` | `false` | Khóa thanh trượt. |

---

## 2. Ví dụ sử dụng

```tsx
import { Slider } from "@/components/slider";
import { useState } from "react";

export default function SliderDemo() {
  const [hourlyRate, setHourlyRate] = useState(250000);

  return (
    <div className="max-w-md p-4 bg-white border border-gray-200 rounded-xl">
      <Slider
        label="Mức học phí tối đa mỗi buổi"
        min={100000}
        max={1000000}
        step={50000}
        value={hourlyRate}
        onChange={setHourlyRate}
        formatValue={(val) => `${val.toLocaleString("vi-VN")} đ/buổi`}
        variant="brand"
        marks={[
          { value: 100000, label: "100k" },
          { value: 500000, label: "500k" },
          { value: 1000000, label: "1.000k" },
        ]}
        helperText="Kéo để lọc các gia sư có mức giá phù hợp với ngân sách của bạn."
      />
    </div>
  );
}
```
