# TextArea Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Text Area](https://www.photonix.dev/components/text-area)  
> **Đường dẫn component:** [`components/ui/text-area.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/text-area.tsx) (hoặc re-export tại [`components/text-area.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/text-area.tsx))

Component `TextArea` phục vụ nhập văn bản nhiều dòng như: Kinh nghiệm giảng dạy của gia sư, yêu cầu đặc biệt của phụ huynh, lý do từ chối đơn thuê, hoặc nội dung phản ánh vi phạm.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `label` | `React.ReactNode` | `-` | Nhãn phía trên ô văn bản. |
| `helperText` | `React.ReactNode` | `-` | Hướng dẫn nhập liệu phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi hoặc cờ viền đỏ. |
| `rows` | `number` | `4` | Số dòng hiển thị mặc định. |
| `maxLength` | `number` | `-` | Giới hạn số ký tự tối đa. |
| `showCount` | `boolean` | `false` | Hiển thị bộ đếm số ký tự ở góc phải dưới (ví dụ `120/500`). |
| `isFullWidth` | `boolean` | `true` | Chiếm toàn bộ chiều rộng container. |
| `...props` | `React.TextareaHTMLAttributes` | `-` | Các thuộc tính chuẩn của thẻ `<textarea>`. |

---

## 2. Ví dụ sử dụng

```tsx
import { TextArea } from "@/components/text-area";
import { useState } from "react";

export default function TextAreaDemo() {
  const [bio, setBio] = useState("");

  return (
    <div className="max-w-lg">
      <TextArea
        label="Giới thiệu kinh nghiệm giảng dạy"
        placeholder="Chia sẻ về số năm kinh nghiệm, phương pháp giảng dạy, và các thành tích nổi bật của bạn..."
        rows={5}
        maxLength={500}
        showCount
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        helperText="Tối thiểu 50 ký tự để giúp phụ huynh hiểu rõ năng lực của bạn hơn."
      />
    </div>
  );
}
```
