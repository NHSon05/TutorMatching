# Image Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Image](https://www.photonix.dev/components/image)  
> **Đường dẫn component:** [`components/ui/image.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/image.tsx) (hoặc re-export tại [`components/image.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/image.tsx))

Component `Image` hiển thị hình ảnh với hiệu ứng mờ nhấp nháy skeleton trong lúc tải, tự động hiển thị biểu tượng fallback hoặc ảnh dự phòng nếu liên kết bị hỏng, và hỗ trợ các tỷ lệ khung hình chuẩn (`16/9`, `1/1`, `4/3`).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | **Bắt buộc** | Đường dẫn hình ảnh. |
| `alt` | `string` | **Bắt buộc** | Mô tả hình ảnh cho trình đọc màn hình. |
| `aspectRatio` | `"1/1" \| "16/9" \| "4/3" \| "3/2" \| "auto"` | `'auto'` | Cố định tỷ lệ khung hình để chống giật bố cục (CLS). |
| `fit` | `"cover" \| "contain" \| "fill"` | `'cover'` | Kiểu scale của ảnh bên trong khung chứa. |
| `rounded` | `"none" \| "md" \| "xl" \| "2xl" \| "full"` | `'xl'` | Kiểu bo góc. |
| `fallbackSrc` | `string` | `-` | Đường dẫn ảnh thay thế khi ảnh gốc lỗi tải. |

---

## 2. Ví dụ sử dụng

```tsx
import { Image } from "@/components/image";

export default function ImageDemo() {
  return (
    <div className="max-w-md">
      <Image
        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600"
        alt="Lớp học trực tuyến"
        aspectRatio="16/9"
        rounded="2xl"
      />
    </div>
  );
}
```
