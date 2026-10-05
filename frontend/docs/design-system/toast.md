# Toast Component & ToastProvider

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Toast](https://www.photonix.dev/components/toast)  
> **Đường dẫn component:** [`components/ui/toast.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/toast.tsx) (hoặc re-export tại [`components/toast.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/toast.tsx))

Hệ thống thông báo `Toast` cung cấp các pop-up thông báo ngắn nổi ở góc màn hình (Success, Error, Warning, Info) thông qua React Hook `useToast()`, tự động ẩn sau 4 giây hoặc có thể đóng thủ công.

---

## 1. Thiết lập Provider

Bọc component gốc hoặc layout bằng `<ToastProvider>`:

```tsx
import { ToastProvider } from "@/components/toast";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

---

## 2. API & Sử dụng với hook `useToast`

```tsx
import { useToast } from "@/components/toast";

export default function ExampleComponent() {
  const toast = useToast();

  const handleSave = () => {
    toast.success("Lưu thành công", "Thông tin hồ sơ gia sư đã được cập nhật.");
  };

  const handleError = () => {
    toast.error("Thao tác thất bại", "Vui lòng kiểm tra lại kết nối mạng.");
  };

  return (
    <div className="flex gap-2">
      <button onClick={handleSave}>Thành công</button>
      <button onClick={handleError}>Lỗi</button>
    </div>
  );
}
```
