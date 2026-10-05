# IconButton Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - IconButton](https://www.photonix.dev/components/button)  
> **Đường dẫn component:** [`components/ui/icon-button.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/icon-button.tsx) (hoặc re-export tại [`components/icon-button.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/icon-button.tsx))

Component `IconButton` là nút bấm chuyên dụng chứa biểu tượng (icon) với tỷ lệ khung hình chuẩn 1:1 (`aspect-square`). Component tuân thủ tiêu chuẩn thiết kế của Photonix UI kết hợp hệ màu Gray và các màu vai trò (Brand, Tutor, Danger, Success) của TutorMatching, hỗ trợ đầy đủ các biến thể (variants), kích thước (sizes), hình dạng bo góc (shapes), huy hiệu thông báo (badges/notification dots), trạng thái tải (loading), vô hiệu hóa (disabled), và khả năng tiếp cận (Accessibility - A11y).

---

## 1. Component API

| Prop                      | Type                                                                                               | Default      | Description                                                                                                |
| :------------------------ | :------------------------------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------------------------- |
| `aria-label` _(Bắt buộc)_ | `string`                                                                                           | **Bắt buộc** | Nhãn mô tả hành động cho trình đọc màn hình (Screen Reader). Tối quan trọng vì nút không hiển thị văn bản. |
| `variant`                 | `"primary" \| "secondary" \| "tertiary" \| "brand" \| "tutor" \| "danger" \| "success" \| "ghost"` | `'primary'`  | Biến thể hiển thị giao diện của icon button.                                                               |
| `size`                    | `"xsmall" \| "small" \| "medium" \| "large"`                                                       | `'medium'`   | Kích thước nút (vuông tương ứng 28px, 36px, 44px, 48px).                                                   |
| `shape`                   | `"rounded" \| "circle" \| "pill"`                                                                  | `'rounded'`  | Kiểu bo góc (`rounded` bo góc chuẩn `rounded-xl`, `circle`/`pill` bo tròn hoàn toàn `rounded-full`).       |
| `icon`                    | `React.ReactNode`                                                                                  | `-`          | Phần tử Icon hiển thị trong nút (cũng có thể truyền trực tiếp qua `children`).                             |
| `badge`                   | `string \| number \| boolean`                                                                      | `-`          | Huy hiệu thông báo góc trên bên phải: `true` (chấm đỏ dot), hoặc số/chữ (ví dụ `5`, `"99+"`).              |
| `tooltip`                 | `string`                                                                                           | `-`          | Nội dung tooltip gợi ý khi di chuột (tự động gán vào thuộc tính `title`).                                  |
| `isLoading`               | `boolean`                                                                                          | `false`      | Hiển thị spinner xoay ở giữa và khóa tương tác người dùng.                                                 |
| `disabled`                | `boolean`                                                                                          | `false`      | Vô hiệu hóa nút, giảm độ mờ (opacity) và chặn thao tác click.                                              |
| `asChild`                 | `boolean`                                                                                          | `false`      | Khi `true`, truyền style, ref và hành vi sang thẻ con (hỗ trợ Next.js `<Link>`).                           |
| `className`               | `string`                                                                                           | `""`         | Tùy biến hoặc bổ sung Tailwind CSS class.                                                                  |
| `...props`                | `React.ButtonHTMLAttributes<HTMLButtonElement>`                                                    | `-`          | Toàn bộ các thuộc tính HTML button tiêu chuẩn (`onClick`, `type`, `aria-*`, v.v.).                         |

---

## 2. Variants (Các Biến Thể Giao Diện)

IconButton chia sẻ cùng bảng màu đồng bộ với component `Button`:

### 2.1 Biến thể tiêu chuẩn:

1. **`primary`** _(Mặc định)_: Nền tối nguyên khối (`bg-gray-900 text-white`), dùng cho hành động chính nổi bật nhất.
2. **`secondary`**: Nền trong suốt với đường viền mảnh xám (`border border-border-default text-content-primary hover:bg-gray-100`), dùng cho hành động phụ.
3. **`tertiary`**: Không viền, không nền tĩnh (`bg-transparent text-content-primary hover:bg-gray-100`), tương tác nhẹ nhàng.
4. **`ghost`**: Tương tự tertiary nhưng tối ưu hóa cho thanh Header, Navbar hoặc Toolbar (`text-gray-600 hover:text-gray-900 hover:bg-gray-100`).
5. **`brand`**: Nền xanh thương hiệu (`bg-brand text-white hover:bg-brand-hover`), dành cho tương tác Học viên / CTA chính.

### 2.2 Biến thể nghiệp vụ đặc thù:

6. **`tutor`**: Nền vàng hổ phách (`bg-role-tutor text-white`), dành riêng cho không gian làm việc của Gia sư.
7. **`danger`**: Nền đỏ cảnh báo (`bg-status-error text-white`), dùng cho hành động xóa, khóa tài khoản, từ chối hồ sơ.
8. **`success`**: Nền xanh lá xác nhận (`bg-status-success text-white`), dùng cho phê duyệt hồ sơ, chấp thuận đơn mời dạy.

### Ví dụ code:

```tsx
import { IconButton } from "@/components/icon-button";
import {
  SearchIcon,
  BellIcon,
  SettingsIcon,
  CheckIcon,
  TrashIcon,
  UserIcon,
} from "@/components/icons"; // hoặc lucide-react

export default function IconButtonVariantsDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton
        aria-label="Tìm kiếm"
        variant="primary"
        icon={<SearchIcon />}
      />
      <IconButton
        aria-label="Thông báo"
        variant="secondary"
        icon={<BellIcon />}
      />
      <IconButton
        aria-label="Cài đặt"
        variant="ghost"
        icon={<SettingsIcon />}
      />
      <IconButton aria-label="Học viên" variant="brand" icon={<UserIcon />} />
      <IconButton aria-label="Duyệt" variant="success" icon={<CheckIcon />} />
      <IconButton aria-label="Xóa" variant="danger" icon={<TrashIcon />} />
    </div>
  );
}
```

---

## 3. Sizes (Kích Thước)

IconButton cung cấp 4 cấp độ kích thước với tỷ lệ vuông 1:1 tuyệt đối:

| Size                      | Kích thước tổng thể (WxH)   | Kích thước Icon        | Tình huống sử dụng                                      |
| :------------------------ | :-------------------------- | :--------------------- | :------------------------------------------------------ |
| **`xsmall`**              | `28px × 28px` (`w-7 h-7`)   | `14px` (`w-3.5 h-3.5`) | Bảng dữ liệu dày đặc, bảng tag, nút đóng badge nhỏ      |
| **`small`**               | `36px × 36px` (`w-9 h-9`)   | `16px` (`w-4 h-4`)     | Bảng quản trị, thanh điều hướng phụ, hàng danh sách     |
| **`medium`** _(Mặc định)_ | `44px × 44px` (`w-11 h-11`) | `20px` (`w-5 h-5`)     | Kích thước tiêu chuẩn cho Navbar, Header, Thanh công cụ |
| **`large`**               | `48px × 48px` (`w-12 h-12`) | `24px` (`w-6 h-6`)     | Nút thao tác nổi (Floating Action Button), Banner CTA   |

### Ví dụ code:

```tsx
<IconButton aria-label="Thu nhỏ" size="xsmall" icon={<MinusIcon />} />
<IconButton aria-label="Đóng" size="small" icon={<CloseIcon />} />
<IconButton aria-label="Mặc định" size="medium" icon={<FilterIcon />} />
<IconButton aria-label="Nổi bật" size="large" icon={<PlusIcon />} />
```

---

## 4. Shapes (Bo Góc)

- **`rounded`** _(Mặc định)_: Bo góc hiện đại `rounded-xl` (hoặc tỷ lệ thích ứng), phù hợp với layout Card, Form.
- **`circle`** (hoặc **`pill`**): Bo tròn hoàn toàn 360° `rounded-full`, rất phù hợp cho nút đóng Modal, Avatar Action, Chuông thông báo.

### Ví dụ code:

```tsx
<IconButton aria-label="Vuông bo góc" shape="rounded" icon={<BookmarkIcon />} />
<IconButton aria-label="Tròn hoàn toàn" shape="circle" icon={<BellIcon />} />
```

---

## 5. Badges & Notification Dots (Huy Hiệu & Chấm Đỏ)

IconButton hỗ trợ ghim chỉ báo thông báo tự động ở góc trên bên phải mà không làm ảnh hưởng đến căn giữa của Icon:

- **Chấm thông báo (Dot):** Truyền `badge={true}` để hiển thị chấm đỏ 10px với viền trắng tương phản.
- **Số đếm thông báo (Count):** Truyền `badge={3}` hoặc `badge="9+"` để hiển thị nhãn số đếm nhỏ.

### Ví dụ code:

```tsx
{
  /* Chấm đỏ thông báo chưa đọc */
}
<IconButton
  aria-label="Thông báo mới"
  variant="secondary"
  shape="circle"
  badge={true}
  icon={<BellIcon />}
/>;

{
  /* Số lượng tin nhắn chưa đọc */
}
<IconButton
  aria-label="Tin nhắn chưa đọc"
  variant="ghost"
  badge={5}
  icon={<ChatIcon />}
/>;
```

---

## 6. Loading & Disabled (Trạng Thái Tải & Khóa)

- **`isLoading`**: Ẩn tạm thời Icon và hiển thị Spinner xoay tương ứng kích thước, tự động thiết lập `aria-busy="true"` và ngăn chặn người dùng bấm lặp lại.
- **`disabled`**: Giảm độ mờ xuống 50%, chuyển con trỏ chuột sang `cursor-not-allowed` và chặn mọi sự kiện click.

### Ví dụ code:

```tsx
<IconButton
  aria-label="Đang tải dữ liệu"
  isLoading
  variant="brand"
/>

<IconButton
  aria-label="Không khả dụng"
  disabled
  variant="secondary"
  icon={<EditIcon />}
/>
```

---

## 7. Next.js Link Hỗ Trợ (`asChild`)

Khi cần nút icon đóng vai trò là một đường liên kết chuyển trang (`<Link href="...">`), sử dụng thuộc tính `asChild={true}`. Component sẽ clone phần tử con và kế thừa toàn bộ style, ref cũng như các thuộc tính trợ năng:

### Ví dụ code:

```tsx
import Link from "next/link";
import { IconButton } from "@/components/icon-button";
import { SettingsIcon } from "@/components/icons";

export default function SettingsLinkButton() {
  return (
    <IconButton
      asChild
      aria-label="Đi đến Cài đặt"
      variant="ghost"
      shape="circle"
    >
      <Link href="/settings">
        <SettingsIcon />
      </Link>
    </IconButton>
  );
}
```

---

## 8. Quy Chuẩn Tiếp Cận (Accessibility - A11y Guidelines)

> [!IMPORTANT]
> **Quy định bắt buộc:** Vì `IconButton` không có văn bản trực quan bên trong nút, bạn **BẮT BUỘC** phải cung cấp thuộc tính `aria-label` có ý nghĩa rõ ràng (ví dụ `"Đóng cửa sổ"`, `"Tìm kiếm gia sư"`, `"Mở thông báo"` thay vì viết tắt hoặc để trống).

1. **Tooltip:** Bạn có thể truyền prop `tooltip="Cài đặt tài khoản"`. IconButton sẽ tự động gán vào thuộc tính `title` để hiển thị gợi ý khi di chuột trên mọi trình duyệt.
2. **Focus Visible:** Mọi nút đều có vòng sáng nét đứt tương phản cao (`focus-visible:ring-2 focus-visible:ring-offset-2`) hỗ trợ điều hướng bằng bàn phím (phím `Tab` và `Enter`/`Space`).
3. **Screen Reader Live State:** Khi bật `isLoading`, thuộc tính `aria-busy="true"` sẽ thông báo cho thiết bị trợ năng biết tác vụ đang được xử lý.
