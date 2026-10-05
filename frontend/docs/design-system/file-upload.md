# FileUpload Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - File Upload](https://www.photonix.dev/components/file-upload)  
> **Đường dẫn component:** [`components/ui/file-upload.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/file-upload.tsx) (hoặc re-export tại [`components/file-upload.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/file-upload.tsx))

Component `FileUpload` là vùng tải tệp kéo thả (Drag & Drop), phục vụ quá trình gia sư tải lên Bằng cấp chứng chỉ, Thẻ sinh viên, và Giấy tờ xác thực danh tính để quản trị viên phê duyệt.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `accept` | `string` | `"image/*,.pdf"` | Các định dạng tệp được chấp nhận. |
| `maxSizeMB` | `number` | `5` | Dung lượng tối đa mỗi tệp (MB). |
| `multiple` | `boolean` | `false` | Cho phép tải lên nhiều tệp cùng lúc. |
| `onFilesChange` | `(files: File[]) => void` | `-` | Callback trả về danh sách các tệp hợp lệ sau khi chọn/xóa. |
| `label` | `React.ReactNode` | `-` | Tiêu đề phía trên. |
| `helperText` | `React.ReactNode` | `-` | Dòng giải thích phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi. |
| `disabled` | `boolean` | `false` | Khóa vùng tải tệp. |

---

## 2. Ví dụ sử dụng

```tsx
import { FileUpload } from "@/components/file-upload";
import { useState } from "react";

export default function FileUploadDemo() {
  const [certFiles, setCertFiles] = useState<File[]>([]);

  return (
    <div className="max-w-md">
      <FileUpload
        label="Tải lên Bằng cấp / Chứng chỉ Sư phạm / Thẻ SV"
        helperText="Chụp ảnh rõ nét hai mặt thẻ sinh viên hoặc bằng cử nhân sư phạm."
        multiple
        maxSizeMB={5}
        accept="image/jpeg,image/png,application/pdf"
        onFilesChange={setCertFiles}
      />
    </div>
  );
}
```
