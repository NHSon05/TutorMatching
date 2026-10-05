# Calendar Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Calendar](https://www.photonix.dev/components/calendar)  
> **Đường dẫn component:** [`components/ui/calendar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/calendar.tsx) (hoặc re-export tại [`components/calendar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/calendar.tsx))

Component `Calendar` hiển thị lịch dạng tháng trực quan, hỗ trợ hiển thị các ca học, sự kiện hoặc bài kiểm tra trong từng ô ngày, chuyển đổi tháng nhanh chóng và đánh dấu ngày hôm nay.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `month` | `Date` | `undefined` | Tháng đang xem (Controlled). |
| `defaultMonth` | `Date` | `new Date()` | Tháng khởi tạo (Uncontrolled). |
| `onMonthChange` | `(month: Date) => void` | `-` | Callback khi chuyển sang tháng khác. |
| `selectedDate` | `Date \| null` | `undefined` | Ngày đang chọn (Controlled). |
| `onDateSelect` | `(date: Date) => void` | `-` | Callback khi click chọn một ô ngày. |
| `events` | `CalendarEvent[]` | `[]` | Danh sách sự kiện/ca học cần ghim lên lịch `{ id, date, title, type? }`. |

---

## 2. Ví dụ sử dụng

```tsx
import { Calendar } from "@/components/calendar";
import { useState } from "react";

export default function CalendarDemo() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  return (
    <div className="max-w-2xl">
      <Calendar
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        events={[
          { id: "e1", date: "2026-10-06", title: "Toán 12 - 19:00" },
          { id: "e2", date: "2026-10-08", title: "Tiếng Anh - 18:30" },
          { id: "e3", date: "2026-10-10", title: "Luyện đề THPT QG" },
        ]}
      />
    </div>
  );
}
```
