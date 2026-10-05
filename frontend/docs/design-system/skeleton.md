# Skeleton Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Skeleton](https://www.photonix.dev/components/skeleton)  
> **Đường dẫn component:** [`components/ui/skeleton.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/skeleton.tsx) (hoặc re-export tại [`components/skeleton.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/skeleton.tsx))

Component `Skeleton` cung cấp các khối khung giả lập nội dung với hiệu ứng nhấp nháy (`animate-pulse`), giúp trải nghiệm người dùng mượt mà hơn trong lúc chờ tải dữ liệu từ máy chủ.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `variant` | `"text" \| "rectangular" \| "circular"` | `'rectangular'` | Kiểu hình dáng khối (Dòng chữ, Khối chữ nhật bo góc, hoặc Hình tròn avatar). |
| `animation` | `"pulse" \| "wave" \| "none"` | `'pulse'` | Hiệu ứng động khi hiển thị. |
| `width` | `string \| number` | `-` | Chiều rộng (px hoặc chuỗi CSS như `"100%"`). |
| `height` | `string \| number` | `-` | Chiều cao (px hoặc chuỗi CSS). |

---

## 2. Ví dụ sử dụng

```tsx
import { Skeleton } from "@/components/skeleton";

export default function TutorCardSkeleton() {
  return (
    <div className="p-4 border border-gray-200 rounded-2xl space-y-3 max-w-sm">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="space-y-1.5 flex-1">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={12} />
        </div>
      </div>
      <Skeleton variant="rectangular" height={80} />
      <div className="flex justify-between pt-2">
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton variant="rectangular" width={90} height={32} />
      </div>
    </div>
  );
}
```
