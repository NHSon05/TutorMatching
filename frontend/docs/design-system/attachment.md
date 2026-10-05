# Attachment Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Attachment](https://www.photonix.dev/components/attachment)  
> **Đường dẫn component:** [`components/ui/attachment.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/attachment.tsx) (hoặc re-export tại [`components/attachment.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/attachment.tsx))

Component `Attachment` dùng để hiển thị các tệp đính kèm (giáo trình, đề thi, bài tập về nhà, chứng chỉ) trong tin nhắn trao đổi hoặc hồ sơ gia sư, hỗ trợ phân loại biểu tượng theo loại tệp (PDF, DOC, IMG, ZIP), hiển thị dung lượng, và các nút thao tác Tải về / Xóa.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `fileName` | `string` | **Bắt buộc** | Tên tệp đính kèm. |
| `fileSize` | `string \| number` | `-` | Dung lượng tệp (chuỗi hoặc số byte). |
| `fileType` | `"pdf" \| "image" \| "doc" \| "archive" \| "general"` | `'general'` | Loại tệp để hiển thị huy hiệu màu tương ứng. |
| `url` | `string` | `-` | Đường dẫn tải về hoặc xem trước tệp. |
| `onDownload` | `() => void` | `-` | Callback khi bấm nút tải về. |
| `onPreview` | `() => void` | `-` | Callback khi click vào tệp để xem trước. |
| `onDelete` | `() => void` | `-` | Callback khi bấm nút xóa tệp. |
| `disabled` | `boolean` | `false` | Khóa tương tác với tệp. |

---

## 2. Ví dụ sử dụng

```tsx
import { Attachment } from "@/components/attachment";

export default function AttachmentDemo() {
  return (
    <div className="space-y-2 max-w-sm">
      <Attachment
        fileName="De_on_tap_Toan_12_chuong_1.pdf"
        fileSize={2450000}
        fileType="pdf"
        onDownload={() => console.log("Tải file")}
        onDelete={() => console.log("Xóa file")}
      />

      <Attachment
        fileName="Bang_diem_IELTS_7.5_Overall.png"
        fileSize={1200000}
        fileType="image"
        onPreview={() => console.log("Xem trước ảnh")}
      />
    </div>
  );
}
```
