# Sheet Component (Slide-over Drawer)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Sheet](https://www.photonix.dev/components/sheet)  
> **Đường dẫn component:** [`components/ui/sheet.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/sheet.tsx) (hoặc re-export tại [`components/sheet.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/sheet.tsx))

Component `Sheet` là bảng trượt ra từ mép màn hình (phải, trái, dưới hoặc trên), rất lý tưởng cho bộ lọc tìm kiếm gia sư trên giao diện điện thoại (Mobile Filters), bảng xem nhanh hồ sơ gia sư, hoặc danh sách thông báo.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | **Bắt buộc** | Trạng thái mở của bảng trượt. |
| `onClose` | `() => void` | **Bắt buộc** | Callback đóng bảng trượt. |
| `side` | `"right" \| "left" \| "bottom" \| "top"` | `'right'` | Hướng trượt xuất hiện của bảng. |
| `title` | `React.ReactNode` | `-` | Tiêu đề của Sheet. |
| `description` | `React.ReactNode` | `-` | Dòng giải thích phía dưới tiêu đề. |
| `children` | `React.ReactNode` | `-` | Nội dung cuộn bên trong thân bảng. |
| `footer` | `React.ReactNode` | `-` | Vùng hành động chân trang cố định. |

---

## 2. Ví dụ sử dụng

```tsx
import { Sheet } from "@/components/sheet";
import { Button } from "@/components/button";
import { useState } from "react";

export default function MobileFilterSheetDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        Bộ lọc nâng cao
      </Button>

      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        side="right"
        title="Bộ lọc gia sư"
        description="Lọc theo môn học, khu vực, học phí và hình thức học."
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Đặt lại
            </Button>
            <Button variant="brand" onClick={() => setIsOpen(false)}>
              Áp dụng bộ lọc
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">Nội dung form bộ lọc chi tiết...</p>
        </div>
      </Sheet>
    </div>
  );
}
```
