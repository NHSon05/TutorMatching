# PromptField Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Prompt Field](https://www.photonix.dev/components/prompt-field)  
> **Đường dẫn component:** [`components/ui/prompt-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/prompt-field.tsx) (hoặc re-export tại [`components/prompt-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/prompt-field.tsx))

Component `PromptField` là khung nhập văn bản phong cách trợ lý AI và tìm kiếm ngữ nghĩa, có nút Gửi hành động ghim bên trong, hỗ trợ nút đính kèm tài liệu và phím tắt `Enter` để gửi (`Shift + Enter` để xuống dòng).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `string` | `undefined` | Giá trị văn bản (Controlled). |
| `defaultValue` | `string` | `""` | Giá trị văn bản khởi tạo (Uncontrolled). |
| `onChange` | `(value: string) => void` | `-` | Callback khi nội dung thay đổi. |
| `onSubmit` | `(value: string) => void` | `-` | Callback khi bấm nút Gửi hoặc ấn phím Enter. |
| `placeholder` | `string` | `"..."` | Văn bản gợi ý trong ô nhập. |
| `isLoading` | `boolean` | `false` | Hiển thị spinner xoay tại nút gửi khi đang chờ AI phản hồi. |
| `showAttachButton` | `boolean` | `false` | Hiển thị nút biểu tượng ghim kẹp tệp đính kèm. |
| `onAttach` | `() => void` | `-` | Callback khi click nút đính kèm. |
| `minRows` | `number` | `2` | Chiều cao dòng tối thiểu. |

---

## 2. Ví dụ sử dụng

```tsx
import { PromptField } from "@/components/prompt-field";
import { useState } from "react";

export default function PromptFieldDemo() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (text: string) => {
    setLoading(true);
    console.log("Tìm kiếm thông minh:", text);
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="max-w-xl">
      <PromptField
        value={prompt}
        onChange={setPrompt}
        onSubmit={handleSubmit}
        isLoading={loading}
        showAttachButton
        placeholder="VD: Tìm gia sư Toán 12 ôn thi ĐH Bách Khoa tại Cầu Giấy, học tối 2-4-6..."
      />
    </div>
  );
}
```
