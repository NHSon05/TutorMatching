# WelcomeBanner Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Welcome Banner](https://www.photonix.dev/components/welcome-banner)  
> **Đường dẫn component:** [`components/ui/welcome-banner.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/welcome-banner.tsx) (hoặc re-export tại [`components/welcome-banner.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/welcome-banner.tsx))

Component `WelcomeBanner` là khối banner lớn đặt đầu Dashboard để chào đón người dùng (Học viên hoặc Gia sư), tóm tắt trạng thái tài khoản và cung cấp nút kêu gọi hành động (CTA) nổi bật.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `React.ReactNode` | **Bắt buộc** | Tiêu đề chào mừng. |
| `description` | `React.ReactNode` | `-` | Nội dung mô tả chi tiết. |
| `action` | `React.ReactNode` | `-` | Nút hành động CTA. |
| `illustration` | `React.ReactNode` | `-` | Hình ảnh hoặc biểu tượng minh họa ở góc phải. |
| `variant` | `"brand" \| "tutor" \| "gradient" \| "gray"` | `'brand'` | Biến thể màu nền (Xanh học viên, Vàng gia sư, Gradient tối, hoặc Xám thẻ). |
| `onDismiss` | `() => void` | `-` | Callback khi người dùng ấn nút đóng banner. |

---

## 2. Ví dụ sử dụng

```tsx
import { WelcomeBanner } from "@/components/welcome-banner";
import { Button } from "@/components/button";

export default function LearnerDashboardHeader() {
  return (
    <WelcomeBanner
      variant="brand"
      title="Chào mừng bạn quay lại, Minh An! 🎓"
      description="Bạn có 2 buổi học sắp diễn ra trong tuần này. Hãy chuẩn bị bài tập và kiểm tra kết nối mạng trước giờ học nhé."
      action={
        <Button variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 border-white">
          Xem lịch học chi tiết
        </Button>
      }
    />
  );
}
```
