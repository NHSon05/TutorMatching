# FAB Component (Floating Action Button)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - FAB](https://www.photonix.dev/components/fab)  
> **Đường dẫn component:** [`components/ui/fab.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/fab.tsx) (hoặc re-export tại [`components/fab.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/fab.tsx))

Component `FAB` (Floating Action Button) là nút hành động nổi được ghim cố định ở góc màn hình (mặc định là góc phải dưới), phục vụ các tác vụ nhanh: Nhắn tin hỗ trợ, Tạo yêu cầu tìm gia sư nhanh, hoặc Cuộn lên đầu trang.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `icon` | `React.ReactNode` | **Bắt buộc** | Biểu tượng chính trong nút. |
| `label` | `React.ReactNode` | `-` | Nhãn chữ mở rộng (Extended FAB). Nếu không có, nút sẽ có dạng tròn gọn gàng. |
| `position` | `"bottom-right" \| "bottom-left" \| "top-right" \| "top-left" \| "none"` | `'bottom-right'` | Vị trí ghim cố định trên màn hình. |
| `variant` | `"primary" \| "brand" \| "tutor" \| "success"` | `'brand'` | Biến thể màu sắc. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước nút. |

---

## 2. Ví dụ sử dụng

```tsx
import { FAB } from "@/components/fab";

export default function FABDemo() {
  return (
    <>
      {/* Extended FAB kèm chữ */}
      <FAB
        position="bottom-right"
        variant="brand"
        label="Tìm gia sư ngay"
        icon={
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        }
        onClick={() => console.log("Mở form tìm nhanh")}
      />
    </>
  );
}
```
