# TopNavigation (TopBar) Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Top Navigation](https://www.photonix.dev/components/top-navigation)  
> **Đường dẫn component:** [`components/ui/top-navigation.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/top-navigation.tsx) (hỗ trợ alias `TopBar` tại [`components/ui/top-navigation.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/top-navigation.tsx))

Component `TopNavigation` (hoặc `TopBar`) là thanh điều hướng tiêu chuẩn nằm ở đỉnh trang của hệ thống **TutorMatching**. Component được thiết kế theo cấu trúc 3 khu vực linh hoạt (Trái - Giữa - Phải), hỗ trợ chế độ ghim (`sticky`), tự động ẩn khi cuộn xuống (`hide-on-scroll`), và chế độ nền trong suốt (`transparent`) dành cho trang chủ / Landing Page.

---

## 1. Component API

| Prop              | Type                                       | Default           | Description                                                                                                                                     |
| :---------------- | :----------------------------------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------------------- |
| `logo`            | `React.ReactNode`                          | `Logo TutorMatch` | Phần tử Logo tùy biến ở góc trái. Mặc định hiển thị Logo gradient và tên nền tảng `TutorMatch`.                                                 |
| `centerContent`   | `React.ReactNode`                          | `-`               | Nội dung phần trung tâm (Thanh tìm kiếm `SearchField`, `Tabs`, Menu liên kết điều hướng).                                                       |
| `rightContent`    | `React.ReactNode`                          | `-`               | Nội dung phần bên phải (các nút `IconButton` thông báo, cài đặt, nút `Button` CTA, hoặc `Avatar`).                                              |
| `hideLeftSection` | `boolean`                                  | `false`           | Ẩn khu vực bên trái (logo). Hữu ích khi kết hợp với thanh Sidebar mở rộng.                                                                      |
| `showDivider`     | `boolean`                                  | `true`            | Hiển thị đường kẻ viền phân cách phía dưới thanh điều hướng.                                                                                    |
| `hugLogo`         | `boolean`                                  | `false`           | Nếu `true`, độ rộng khu vực logo bên trái sẽ tự động co giãn theo nội dung thay vì cố định `248px`.                                             |
| `behavior`        | `"static" \| "sticky" \| "hide-on-scroll"` | `'static'`        | Hành vi điều hướng khi cuộn trang: `'static'` (bình thường), `'sticky'` (luôn ghim), `'hide-on-scroll'` (ẩn khi cuộn xuống, hiện khi cuộn lên). |
| `transparent`     | `boolean`                                  | `false`           | Nếu `true`, thanh điều hướng sẽ có nền trong suốt (phù hợp đặt trên Hero Banner gradient).                                                      |
| `forceBackground` | `boolean`                                  | `false`           | Buộc hiển thị nền ngay cả khi đang bật `transparent` (ví dụ khi người dùng mở Menu Dropdown).                                                   |
| `className`       | `string`                                   | `""`              | Lớp CSS Tailwind tùy biến bổ sung.                                                                                                              |
| `style`           | `React.CSSProperties`                      | `-`               | Style inline tùy biến.                                                                                                                          |

---

## 2. Các Biến Thể Phổ Biến (Variants)

### 2.1. Thanh điều hướng cơ bản (Default / Static)

Thường dùng cho trang Landing Page hoặc trang công khai với nút Đăng nhập / Đăng ký.

```tsx
import { TopNavigation } from "@/components/ui/top-navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PublicTopNavDemo() {
  return (
    <TopNavigation
      showDivider
      behavior="sticky"
      centerContent={
        <nav className="flex items-center gap-6 text-base font-medium text-gray-700">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Trang chủ
          </Link>
          <Link
            href="/tutors"
            className="hover:text-blue-600 transition-colors"
          >
            Gia sư
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition-colors">
            Giới thiệu
          </Link>
        </nav>
      }
      rightContent={
        <div className="flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="secondary" size="small" shape="pill">
              Đăng nhập
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="brand" size="small" shape="pill">
              Đăng ký ngay
            </Button>
          </Link>
        </div>
      }
    />
  );
}
```

---

### 2.2. Kèm thanh tìm kiếm trung tâm (With SearchField)

Phù hợp cho trang khám phá danh sách gia sư (`/tutors`) hoặc màn hình làm việc của Học viên.

```tsx
import { TopNavigation } from "@/components/ui/top-navigation";
import { SearchField } from "@/components/ui/search-field";
import { IconButton } from "@/components/ui/icon-button";
import { Avatar } from "@/components/ui/avatar";

export default function SearchTopNavDemo() {
  return (
    <TopNavigation
      behavior="sticky"
      centerContent={
        <div className="w-full max-w-md">
          <SearchField
            placeholder="Tìm kiếm theo môn học, gia sư, trường ĐH..."
            size="small"
          />
        </div>
      }
      rightContent={
        <div className="flex items-center gap-2">
          <IconButton
            variant="tertiary"
            size="medium"
            aria-label="Thông báo"
            badge="3"
            icon={<span>🔔</span>}
          />
          <IconButton
            variant="tertiary"
            size="medium"
            aria-label="Cài đặt"
            icon={<span>⚙️</span>}
          />
          <Avatar
            size="medium"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"
            fallbackText="Lê Diệu"
            shape="circle"
          />
        </div>
      }
    />
  );
}
```

---

### 2.3. Tự động ẩn khi cuộn xuống (Hide on Scroll)

Thanh điều hướng tự động biến mất khi cuộn xuống để tăng tối đa không gian đọc nội dung, và trượt xuống êm ái khi cuộn ngược lên.

```tsx
import { TopNavigation } from "@/components/ui/top-navigation";

export default function HideOnScrollDemo() {
  return (
    <TopNavigation
      behavior="hide-on-scroll"
      hugLogo
      showDivider
      centerContent={
        <span className="text-base font-semibold">
          Tự động ẩn khi cuộn xuống
        </span>
      }
    />
  );
}
```

---

### 2.4. Nền trong suốt trên Hero Banner (Transparent)

Dùng trên đầu các trang có banner gradient hoặc hình ảnh full-bleed lớn.

```tsx
import { TopNavigation } from "@/components/ui/top-navigation";
import { Button } from "@/components/ui/button";

export default function TransparentTopNavDemo() {
  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-800 to-sky-700 min-h-[300px] text-white">
      <TopNavigation
        transparent
        showDivider={false}
        rightContent={
          <Button
            variant="secondary"
            size="small"
            shape="pill"
            className="text-white border-white/30"
          >
            Liên hệ hỗ trợ
          </Button>
        }
      />
      <div className="p-8">
        <h1 className="text-3xl font-extrabold">
          Chào mừng đến với TutorMatching
        </h1>
      </div>
    </div>
  );
}
```

---

## 3. Quy Chuẩn Thiết Kế & Khả Năng Tiếp Cận

- **Chiều cao tiêu chuẩn:** `64px` (`h-16`) chuẩn tỷ lệ công thái học của Photonix UI.
- **Màu sắc & Phông nền:** Hỗ trợ đầy đủ Dark Mode (`dark:bg-gray-900`, `dark:border-gray-800`), nền kính mờ `backdrop-blur-md` tạo chiều sâu khi cuộn nội dung phía dưới.
- **Độ tương phản:** Đạt chuẩn WCAG 2.1 AA cho tất cả các nút icon và liên kết điều hướng.
