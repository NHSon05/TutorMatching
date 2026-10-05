# DateRangePicker Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Date Range Picker](https://www.photonix.dev/components/date-range-picker)  
> **Đường dẫn component:** [`components/ui/date-range-picker.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/date-range-picker.tsx) (hoặc re-export tại [`components/date-range-picker.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/date-range-picker.tsx))

Component `DateRangePicker` cho phép người dùng chọn một khoảng thời gian (Từ ngày ➔ Đến ngày) trực quan trên lưới lịch, hỗ trợ xem trước vùng chọn khi di chuột và hiển thị định dạng ngày tháng kiểu Việt Nam (`DD/MM/YYYY`).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `{ startDate: Date \| null, endDate: Date \| null }` | `undefined` | Khoảng ngày đang chọn (Controlled). |
| `defaultValue` | `DateRange` | `{ startDate: null, endDate: null }` | Giá trị mặc định (Uncontrolled). |
| `onChange` | `(range: DateRange) => void` | `-` | Callback khi hoàn tất chọn khoảng ngày. |
| `label` | `React.ReactNode` | `-` | Tiêu đề phía trên. |
| `helperText` | `React.ReactNode` | `-` | Dòng giải thích phía dưới. |
| `disabled` | `boolean` | `false` | Khóa bộ chọn. |

---

## 2. Ví dụ sử dụng

```tsx
import { DateRangePicker, DateRange } from "@/components/date-range-picker";
import { useState } from "react";

export default function DateRangePickerDemo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 9, 1),
    endDate: new Date(2026, 9, 30),
  });

  return (
    <div className="max-w-sm">
      <DateRangePicker
        label="Khoảng thời gian cần xem báo cáo học phí"
        value={range}
        onChange={setRange}
        helperText="Chọn ngày bắt đầu và kết thúc để lọc thống kê."
      />
    </div>
  );
}
```
