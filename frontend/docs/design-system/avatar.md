# Avatar Component & AvatarGroup

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Avatar](https://www.photonix.dev/components/avatar)  
> **Đường dẫn component:** [`components/ui/avatar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/avatar.tsx) (hoặc re-export tại [`components/avatar.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/avatar.tsx))

Component `Avatar` hiển thị ảnh đại diện của người dùng (Gia sư, Học viên, Phụ huynh, Quản trị viên), tự động hiển thị chữ cái viết tắt (fallback initials) khi không có ảnh hoặc ảnh bị lỗi, hỗ trợ chấm trạng thái hoạt động (`online`, `offline`, `busy`, `away`) và component nhóm `AvatarGroup`.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `-` | Đường dẫn ảnh đại diện. |
| `alt` | `string` | `'Avatar'` | Văn bản thay thế mô tả ảnh. |
| `fallbackText` | `string` | `-` | Tên người dùng để tự động trích xuất 2 chữ cái đầu nếu không có ảnh. |
| `size` | `"xsmall" \| "small" \| "medium" \| "large" \| "xlarge"` | `'medium'` | Kích thước ảnh (24px, 32px, 40px, 48px, 64px). |
| `shape` | `"circle" \| "rounded"` | `'circle'` | Bo tròn hoàn toàn hoặc bo góc vuông mềm `rounded-xl`. |
| `status` | `"online" \| "offline" \| "busy" \| "away"` | `-` | Chấm trạng thái hiển thị góc dưới ảnh. |

---

## 2. Ví dụ sử dụng

```tsx
import { Avatar, AvatarGroup } from "@/components/avatar";

export default function AvatarDemo() {
  return (
    <div className="flex flex-col gap-4">
      {/* Các trạng thái Avatar */}
      <div className="flex items-center gap-3">
        <Avatar
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
          alt="Nguyễn Thùy Linh"
          status="online"
          size="large"
        />

        <Avatar
          fallbackText="Lê Phương Diệu"
          status="busy"
          size="medium"
        />

        <Avatar
          fallbackText="Trần Văn Nam"
          shape="rounded"
          size="medium"
        />
      </div>

      {/* Nhóm Avatar chồng nhau */}
      <AvatarGroup max={3}>
        <Avatar fallbackText="Toán" />
        <Avatar fallbackText="Lý" />
        <Avatar fallbackText="Hóa" />
        <Avatar fallbackText="Anh" />
        <Avatar fallbackText="Văn" />
      </AvatarGroup>
    </div>
  );
}
```
