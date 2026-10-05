# EventCalendar Component (Weekly Timetable)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Event Calendar](https://www.photonix.dev/components/event-calendar)  
> **Đường dẫn component:** [`components/ui/event-calendar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/event-calendar.tsx) (hoặc re-export tại [`components/event-calendar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/event-calendar.tsx))

Component `EventCalendar` là lưới thời khóa biểu hàng tuần (Weekly Timetable) chia theo các khung giờ từ sáng đến tối, hiển thị trực quan các ca dạy của gia sư hoặc ca học của học viên kèm trạng thái xác nhận.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `events` | `ScheduleEvent[]` | **Bắt buộc** | Mảng các ca học `{ id, dayOfWeek, startTime, endTime, title, subtitle?, status? }`. |
| `onEventClick` | `(event: ScheduleEvent) => void` | `-` | Callback khi click vào một ca học để xem chi tiết / đổi lịch. |
| `startHour` | `number` | `7` | Giờ bắt đầu hiển thị trên trục thời gian (ví dụ 7:00 sáng). |
| `endHour` | `number` | `22` | Giờ kết thúc hiển thị trên trục thời gian (ví dụ 22:00 đêm). |

---

## 2. Ví dụ sử dụng

```tsx
import { EventCalendar, ScheduleEvent } from "@/components/event-calendar";

export default function WeeklyScheduleDemo() {
  const scheduleEvents: ScheduleEvent[] = [
    {
      id: "c1",
      dayOfWeek: 1, // Thứ 2
      startTime: "18:00",
      endTime: "20:00",
      title: "Toán 12 - Ôn thi ĐH",
      subtitle: "Học viên: Trần Minh Đức",
      status: "confirmed",
    },
    {
      id: "c2",
      dayOfWeek: 3, // Thứ 4
      startTime: "18:00",
      endTime: "20:00",
      title: "Toán 12 - Hình học",
      subtitle: "Học viên: Trần Minh Đức",
      status: "confirmed",
    },
    {
      id: "c3",
      dayOfWeek: 5, // Thứ 6
      startTime: "19:00",
      endTime: "21:00",
      title: "Tiếng Anh IELTS",
      subtitle: "Học viên: Nguyễn Lan Anh",
      status: "pending",
    },
  ];

  return (
    <div className="w-full">
      <EventCalendar
        events={scheduleEvents}
        onEventClick={(ev) => console.log("Xem chi tiết ca học:", ev)}
      />
    </div>
  );
}
```
