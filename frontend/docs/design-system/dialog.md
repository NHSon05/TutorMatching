# Dialog Component (Modal)

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Dialog](https://www.photonix.dev/components/dialog)  
> **Đường dẫn component:** [`components/ui/dialog.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/dialog.tsx) (hoặc re-export tại [`components/dialog.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/dialog.tsx))

Component `Dialog` là cửa sổ hộp thoại modal nổi bật giữa màn hình, dùng cho các xác nhận quan trọng (Phê duyệt hồ sơ gia sư, Khóa tài khoản vi phạm, Xác nhận gửi đơn mời dạy). Component tự động khóa cuộn trang nền và hỗ trợ đóng bằng phím `Escape` hoặc click vào nền mờ.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `isOpen` | `boolean` | **Bắt buộc** | Trạng thái hiển thị của hộp thoại. |
| `onClose` | `() => void` | **Bắt buộc** | Callback đóng hộp thoại. |
| `title` | `React.ReactNode` | `-` | Tiêu đề của modal. |
| `description` | `React.ReactNode` | `-` | Dòng giải thích ngắn dưới tiêu đề. |
| `children` | `React.ReactNode` | `-` | Nội dung thân modal. |
| `footer` | `React.ReactNode` | `-` | Vùng chứa các nút thao tác ở chân modal. |
| `maxWidth` | `"sm" \| "md" \| "lg" \| "xl"` | `'md'` | Độ rộng tối đa của modal. |
| `closeOnBackdropClick` | `boolean` | `true` | Cho phép đóng modal khi click ra ngoài vùng nền mờ. |

---

## 2. Ví dụ sử dụng

```tsx
import { Dialog } from "@/components/dialog";
import { Button } from "@/components/button";
import { useState } from "react";

export default function DialogDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Button variant="danger" onClick={() => setIsOpen(true)}>
        Khóa tài khoản gia sư
      </Button>

      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Xác nhận khóa tài khoản"
        description="Hành động này sẽ tạm ngưng quyền truy cập và ẩn hồ sơ gia sư khỏi hệ thống."
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={() => { console.log("Locked"); setIsOpen(false); }}>
              Xác nhận khóa
            </Button>
          </>
        }
      >
        <p className="text-xs text-gray-600">
          Vui lòng nhập lý do khóa vào sổ nhật ký kiểm toán (Audit Log) theo quy định của hệ thống TutorMatching.
        </p>
      </Dialog>
    </div>
  );
}
```
