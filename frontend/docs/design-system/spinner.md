# Spinner Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Spinner](https://www.photonix.dev/components/spinner)  
> **Đường dẫn component:** [`components/ui/spinner.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/spinner.tsx) (hoặc re-export tại [`components/spinner.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/spinner.tsx))

Component `Spinner` là vòng xoay chỉ báo tác vụ nền đang được xử lý (truy vấn danh sách gia sư, xác thực tài khoản, tải dữ liệu báo cáo), hỗ trợ 4 cấp độ kích thước và nhãn văn bản đi kèm.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `size` | `"small" \| "medium" \| "large" \| "xlarge"` | `'medium'` | Kích thước vòng xoay (16px, 24px, 32px, 48px). |
| `variant` | `"primary" \| "brand" \| "tutor" \| "white" \| "gray"` | `'brand'` | Màu sắc đường nét vòng xoay. |
| `label` | `React.ReactNode` | `-` | Dòng chữ mô tả đi kèm (ví dụ: "Đang tải dữ liệu..."). |

---

## 2. Ví dụ sử dụng

```tsx
import { Spinner } from "@/components/spinner";

export default function SpinnerDemo() {
  return (
    <div className="flex flex-col gap-4">
      <Spinner size="small" variant="brand" />
      <Spinner size="medium" variant="tutor" label="Đang cập nhật lịch dạy..." />
      <Spinner size="large" variant="primary" label="Đang đối soát hồ sơ gia sư..." />
    </div>
  );
}
```
