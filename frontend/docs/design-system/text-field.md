# TextField Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Text Field](https://www.photonix.dev/components/text-field)  
> **Đường dẫn component:** [`components/ui/text-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/text-field.tsx) (hoặc re-export tại [`components/text-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/text-field.tsx))

Component `TextField` là trường nhập liệu một dòng cơ bản, hỗ trợ nhãn (`label`), biểu tượng trước/sau (`leadingIcon`, `trailingIcon`), tiền tố/hậu tố (`prefix`, `suffix`), nút xóa nhanh (`isClearable`), và thông báo lỗi.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `React.ReactNode` | `-` | Nhãn phía trên ô nhập liệu. |
| `helperText` | `React.ReactNode` | `-` | Dòng chú thích phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi hoặc cờ báo lỗi màu đỏ. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước ô nhập (36px, 44px, 48px). |
| `variant` | `"outlined" \| "filled"` | `'outlined'` | Phong cách viền hoặc nền đặc. |
| `leadingIcon` | `React.ReactNode` | `-` | Biểu tượng ở đầu ô nhập. |
| `trailingIcon` | `React.ReactNode` | `-` | Biểu tượng ở cuối ô nhập. |
| `prefix` | `React.ReactNode` | `-` | Tiền tố văn bản (ví dụ: `+84`, `https://`). |
| `suffix` | `React.ReactNode` | `-` | Hậu tố văn bản (ví dụ: `VNĐ`, `/tháng`). |
| `isClearable` | `boolean` | `false` | Hiển thị nút `x` để xóa nhanh văn bản. |
| `isFullWidth` | `boolean` | `true` | Chiếm 100% chiều rộng container. |
| `...props` | `React.InputHTMLAttributes` | `-` | Tất cả thuộc tính HTML input tiêu chuẩn. |

---

## 2. Ví dụ sử dụng

```tsx
import { TextField } from "@/components/text-field";
import { useState } from "react";

export default function TextFieldDemo() {
  const [email, setEmail] = useState("");

  return (
    <div className="max-w-sm space-y-4">
      <TextField
        label="Địa chỉ Email"
        placeholder="nhap.email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        isClearable
        onClear={() => setEmail("")}
        helperText="Chúng tôi không bao giờ chia sẻ email của bạn cho bên thứ ba."
      />

      <TextField
        label="Số điện thoại Zalo"
        prefix="+84"
        placeholder="912 345 678"
      />
    </div>
  );
}
```
