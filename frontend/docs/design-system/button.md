# Button Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Button](https://www.photonix.dev/components/button)  
> **Đường dẫn component:** [`components/button.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/button.tsx)

Component `Button` cung cấp các nút tương tác tiêu chuẩn của hệ thống thiết kế (Design System), tuân thủ chặt chẽ API và phong cách trực quan của Photonix UI, hỗ trợ nhiều biến thể (variants), kích thước (sizes), hình dạng (shapes), biểu tượng (icons), huy hiệu số lượng (badges), cùng trạng thái tải (loading) và vô hiệu hóa (disabled).

---

## 1. Component API

| Prop           | Type                                                                                    | Default     | Description                                                                        |
| :------------- | :-------------------------------------------------------------------------------------- | :---------- | :--------------------------------------------------------------------------------- |
| `variant`      | `"primary" \| "secondary" \| "tertiary" \| "brand"`                                     | `'primary'` | Biến thể hiển thị của button.                                                      |
| Prop           | Type                                                                                    | Default     | Description                                                                        |
| :---           | :---                                                                                    | :---        | :---                                                                               |
| `variant`      | `"primary" \| "secondary" \| "tertiary" \| "brand" \| "tutor" \| "danger" \| "success"` | `'primary'` | Biến thể hiển thị của button.                                                      |
| `size`         | `"small" \| "medium" \| "large"`                                                        | `'medium'`  | Kích thước button (chiều cao tương ứng 36px, 44px, 48px).                          |
| `shape`        | `"rounded" \| "pill"`                                                                   | `'rounded'` | Kiểu bo góc của button (`rounded` bo góc chuẩn, `pill` bo tròn hoàn toàn).         |
| `isFullWidth`  | `boolean`                                                                               | `false`     | Khi bật, button sẽ chiếm 100% chiều rộng container (`w-full`).                     |
| `leadingIcon`  | `React.ReactNode`                                                                       | `-`         | Icon hiển thị phía trước văn bản button.                                           |
| `trailingIcon` | `React.ReactNode`                                                                       | `-`         | Icon hiển thị phía sau văn bản button.                                             |
| `badge`        | `string \| number`                                                                      | `-`         | Huy hiệu số lượng hoặc nhãn phụ hiển thị sau văn bản.                              |
| `isLoading`    | `boolean`                                                                               | `false`     | Hiển thị spinner xoay và khóa tương tác của người dùng.                            |
| `disabled`     | `boolean`                                                                               | `false`     | Vô hiệu hóa button, giảm độ mờ và chặn các sự kiện click.                          |
| `asChild`      | `boolean`                                                                               | `false`     | Khi `true`, truyền style, ref và hành vi sang thẻ con (hỗ trợ Next.js `<Link>`).   |
| `className`    | `string`                                                                                | `""`        | Tùy biến hoặc bổ sung Tailwind CSS class.                                          |
| `...props`     | `React.ButtonHTMLAttributes<HTMLButtonElement>`                                         | `-`         | Toàn bộ các thuộc tính HTML button tiêu chuẩn (`onClick`, `type`, `aria-*`, v.v.). |

---

## 2. Variants (Các Biến Thể)

Button hỗ trợ các biến thể chuẩn Photonix cùng các biến thể mở rộng theo vai trò nghiệp vụ:

### Biến thể cơ bản (Photonix Standard):

1. **`primary`** _(Mặc định)_: Nền tối nguyên khối (`bg-gray-900 text-white`), sử dụng cho hành động chính quan trọng nhất.
2. **`secondary`**: Nền trong suốt với đường viền mảnh (`border border-border-default text-content-primary`), dùng cho hành động phụ.
3. **`tertiary`**: Không viền, không nền tĩnh (`bg-transparent text-content-primary`), hiệu ứng hover nhẹ nhàng.
4. **`brand`**: Nền xanh thương hiệu theo Design System (`bg-brand text-white`), dùng cho CTA Học viên / Khám phá.

### Biến thể nghiệp vụ mở rộng (TutorMatching Specific):

5. **`tutor`**: Nền vàng hổ phách (`bg-role-tutor text-white`), dành riêng cho các hành động trong Workspace Gia sư (Lưu hồ sơ, Đăng lịch dạy).
6. **`danger`**: Nền đỏ thẫm cảnh báo (`bg-status-error text-white`), dùng cho Quản trị viên (Khóa tài khoản, Từ chối hồ sơ, Hủy đơn thuê).
7. **`success`**: Nền xanh lá xác nhận (`bg-status-success text-white`), dùng cho phê duyệt hồ sơ gia sư hoặc chấp nhận đơn thuê.

### Ví dụ code:

```tsx
import { Button } from "@/components/button";

export default function ButtonVariantsExample() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="brand">Brand (Learner)</Button>
      <Button variant="tutor">Tutor Action</Button>
      <Button variant="success">Duyệt hồ sơ</Button>
      <Button variant="danger">Khóa tài khoản</Button>
    </div>
  );
}
```

---

## 3. Shapes (Hình Dạng Bo Góc)

- **`rounded`** _(Mặc định)_: Bo góc hiện đại `rounded-xl`, phù hợp với hầu hết các giao diện dashboard, form biểu mẫu.
- **`pill`**: Bo tròn hoàn toàn `rounded-full` hình viên con nhộng, thường dùng cho Call To Action nổi bật, thẻ lọc, hoặc nút điều hướng đầu trang.

### Ví dụ code:

```tsx
import { Button } from "@/components/button";

export default function ButtonShapesExample() {
  return (
    <div className="flex gap-3">
      <Button shape="rounded">Rounded</Button>
      <Button shape="pill">Pill Shape</Button>
    </div>
  );
}
```

---

## 4. Full Width (Toàn Chiều Rộng)

Thuộc tính `isFullWidth` cho phép button giãn rộng 100% không gian vùng chứa, tối ưu cho giao diện di động hoặc các biểu mẫu đăng nhập, đăng ký thanh toán.

### Ví dụ code:

```tsx
import { Button } from "@/components/button";

export default function ButtonFullWidthExample() {
  return (
    <div className="w-full max-w-sm space-y-2">
      <Button isFullWidth variant="brand">
        Đăng nhập vào hệ thống
      </Button>
      <Button isFullWidth variant="secondary">
        Tạo tài khoản mới
      </Button>
    </div>
  );
}
```

---

## 5. Icons & Badges (Biểu Tượng & Huy Hiệu)

- **`leadingIcon`**: Hiển thị icon trước text (ví dụ: dấu cộng `+`, biểu tượng kính lúp tìm kiếm).
- **`trailingIcon`**: Hiển thị icon sau text (ví dụ: mũi tên `->`, icon mở liên kết ngoài).
- **`badge`**: Hiển thị số đếm thông báo hoặc bộ lọc bên cạnh nhãn button (tự động đổi màu tương phản theo từng variant).

### Ví dụ code:

```tsx
import { Button } from "@/components/button";
import { Plus, ArrowRight, Bell } from "lucide-react"; // Hoặc icon SVG bất kỳ

export default function ButtonIconsAndBadgesExample() {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Leading Icon */}
      <Button leadingIcon={<Plus className="w-4 h-4" />}>
        Tạo hồ sơ gia sư
      </Button>

      {/* Trailing Icon */}
      <Button trailingIcon={<ArrowRight className="w-4 h-4" />}>
        Tiếp tục
      </Button>

      {/* Badge số lượng */}
      <Button
        variant="secondary"
        badge={5}
        leadingIcon={<Bell className="w-4 h-4" />}
      >
        Thông báo
      </Button>
    </div>
  );
}
```

---

## 6. Loading & Disabled (Trạng Thái Tải & Vô Hiệu Hóa)

- **`isLoading`**: Hiển thị spinner hoạt họa, ẩn icon trước (nếu có), đồng thời gán `aria-busy="true"`, `aria-disabled="true"`, đổi con trỏ chuột sang `cursor-wait` và khóa click để chống submit trùng lặp.
- **`disabled`**: Làm mờ button (`opacity-50`), đổi con trỏ chuột sang `cursor-not-allowed` và chặn mọi thao tác tương tác.

### Ví dụ code:

```tsx
import { Button } from "@/components/button";

export default function ButtonStatesExample() {
  return (
    <div className="flex gap-3">
      {/* Đang xử lý */}
      <Button isLoading>Đang lưu...</Button>

      {/* Vô hiệu hóa */}
      <Button disabled variant="secondary">
        Không khả dụng
      </Button>
    </div>
  );
}
```

---

## 7. Sizes (Kích Thước)

| Size                      | Chiều cao       | Padding ngang | Kích thước chữ | Icon gợi ý         |
| :------------------------ | :-------------- | :------------ | :------------- | :----------------- |
| **`small`**               | `36px` (`h-9`)  | `px-3.5`      | `text-xs`      | `16px` (`w-4 h-4`) |
| **`medium`** _(Mặc định)_ | `44px` (`h-11`) | `px-4`        | `text-sm`      | `20px` (`w-5 h-5`) |
| **`large`**               | `48px` (`h-12`) | `px-5`        | `text-base`    | `20px` (`w-5 h-5`) |

---

## 8. Hỗ Trợ Next.js Link (`asChild`)

Khi muốn dùng button như một đường link điều hướng của Next.js để giữ nguyên SEO và prefetching:

```tsx
import Link from "next/link";
import { Button } from "@/components/button";

export default function NavigationButtonExample() {
  return (
    <Button asChild variant="brand" shape="pill">
      <Link href="/tutors">Tìm gia sư ngay</Link>
    </Button>
  );
}
```
