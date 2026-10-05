# GanttChart Component (Study Roadmap)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Gantt Chart](https://www.photonix.dev/components/gantt-chart)  
> **Đường dẫn component:** [`components/ui/gantt-chart.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/gantt-chart.tsx) (hoặc re-export tại [`components/gantt-chart.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/gantt-chart.tsx))

Component `GanttChart` hiển thị biểu đồ tiến độ lộ trình học tập, kế hoạch luyện thi theo các tuần, giúp học viên và phụ huynh dễ dàng nắm bắt các chuyên đề đã học xong (`completed`), đang học (`in-progress`), hoặc theo kế hoạch (`planned`).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tasks` | `GanttTask[]` | **Bắt buộc** | Mảng các mục lộ trình `{ id, name, category?, startWeek, durationWeeks, progress?, status? }`. |
| `totalWeeks` | `number` | `8` | Tổng số tuần hiển thị trên trục thời gian. |
| `title` | `string` | `"Lộ trình ôn tập & Kế hoạch học tập"` | Tiêu đề biểu đồ. |

---

## 2. Ví dụ sử dụng

```tsx
import { GanttChart, GanttTask } from "@/components/gantt-chart";

export default function StudyPlanDemo() {
  const tasks: GanttTask[] = [
    {
      id: "t1",
      name: "Chuyên đề 1: Hàm số và Đạo hàm",
      category: "Toán 12 Đại số",
      startWeek: 1,
      durationWeeks: 2,
      progress: 100,
      status: "completed",
    },
    {
      id: "t2",
      name: "Chuyên đề 2: Khối đa diện & Thể tích",
      category: "Toán 12 Hình học",
      startWeek: 2,
      durationWeeks: 2,
      progress: 60,
      status: "in-progress",
    },
    {
      id: "t3",
      name: "Chuyên đề 3: Mũ và Logarit",
      category: "Toán 12 Đại số",
      startWeek: 4,
      durationWeeks: 2,
      progress: 0,
      status: "planned",
    },
    {
      id: "t4",
      name: "Luyện đề thi thử THPT Quốc Gia",
      category: "Tổng ôn",
      startWeek: 6,
      durationWeeks: 3,
      progress: 0,
      status: "planned",
    },
  ];

  return (
    <div className="w-full">
      <GanttChart tasks={tasks} totalWeeks={8} />
    </div>
  );
}
```
