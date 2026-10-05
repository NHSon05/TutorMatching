# Timeline Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Timeline](https://www.photonix.dev/components/timeline)  
> **Đường dẫn component:** [`components/ui/timeline.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/timeline.tsx) (hoặc re-export tại [`components/timeline.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/timeline.tsx))

Component `Timeline` hiển thị dòng thời gian tiến trình xử lý yêu cầu (Hire Request Flow), theo dõi hành trình phê duyệt hồ sơ gia sư, hoặc nhật ký tương tác trao đổi qua các giai đoạn.

---

## 1. Component API

| Prop     | Type                                               | Default      | Description                                                                      |
| :------- | :------------------------------------------------- | :----------- | :------------------------------------------------------------------------------- |
| `items`  | `TimelineItem[]`                                   | **Bắt buộc** | Mảng các bước `{ id, title, description?, time?, status?, icon? }`.              |
| `status` | `"completed" \| "current" \| "pending" \| "error"` | `'pending'`  | Trạng thái của từng bước (Đã xong, Đang xử lý, Chờ đến lượt, hoặc Thất bại/Lỗi). |

---

## 2. Ví dụ sử dụng

```tsx
import { Timeline } from "@/components/timeline";

export default function HireRequestTimelineDemo() {
  return (
    <div className="max-w-md p-6 bg-white border border-gray-200 rounded-3xl">
      <Timeline
        items={[
          {
            id: "step-1",
            title: "Gửi yêu cầu mời dạy",
            time: "10:30, 02/10/2026",
            status: "completed",
            description:
              "Phụ huynh gửi đề nghị học kèm môn Tiếng Anh 2 buổi/tuần.",
          },
          {
            id: "step-2",
            title: "Gia sư đồng ý nhận lớp",
            time: "14:15, 02/10/2026",
            status: "completed",
            description: "Gia sư Lê Phương Diệu đã đồng ý lịch học đề xuất.",
          },
          {
            id: "step-3",
            title: "Xác nhận lịch học & học phí",
            time: "Hôm nay",
            status: "current",
            description:
              "Đang thống nhất tài liệu học tập và chuẩn bị buổi dạy đầu tiên.",
          },
          {
            id: "step-4",
            title: "Bắt đầu buổi học đầu tiên",
            time: "Dự kiến 05/10/2026",
            status: "pending",
          },
        ]}
      />
    </div>
  );
}
```
