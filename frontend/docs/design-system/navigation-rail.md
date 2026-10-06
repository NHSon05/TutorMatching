# NavigationRail Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Navigation Rail](https://www.photonix.dev/components/navigation-rail)  
> **Đường dẫn component:** [`components/ui/navigation-rail.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/navigation-rail.tsx) (cung cấp bộ 3 component: `NavigationRail`, `NavGroup`, và `NavItem`)

Component `NavigationRail` (Thanh điều hướng bên) là thành phần cấu trúc cốt lõi của giao diện web application trong hệ thống **TutorMatching**. Component hỗ trợ cả hai trạng thái:

- **`expanded` (Mở rộng):** Hiển thị đầy đủ nhãn mục, nhóm phân loại (`NavGroup`), cấp mục lồng nhau (`nested items`), thanh tìm kiếm và footer profile (độ rộng mặc định `280px`).
- **`collapsed` (Thu gọn):** Tự động thu hẹp thành thanh icon thanh lịch (độ rộng `64px`), giữ lại các huy hiệu thông báo (`badge`) ở góc trên icon và tooltip khi rê chuột.

---

## 1. Component API

### 1.1. NavigationRail Props

| Prop                | Type                        | Default      | Description                                                                  |
| :------------------ | :-------------------------- | :----------- | :--------------------------------------------------------------------------- |
| `mode`              | `"expanded" \| "collapsed"` | `'expanded'` | Trạng thái hiển thị của thanh điều hướng (mở rộng hay thu nhỏ icon-only).    |
| `header`            | `React.ReactNode`           | `-`          | Khu vực đỉnh cố định (thường chứa Logo, SearchField, hoặc nút chuyển đổi).   |
| `children`          | `React.ReactNode`           | `-`          | Khu vực trung tâm cuộn được chứa các `NavGroup` và `NavItem`.                |
| `footer`            | `React.ReactNode`           | `-`          | Khu vực đáy cố định (thường chứa thông tin tài khoản, avatar, nút nâng cấp). |
| `expandedWidth`     | `number`                    | `280`        | Độ rộng thanh rail khi ở chế độ `expanded` (đơn vị pixel).                   |
| `height`            | `string \| number`          | `'100%'`     | Chiều cao của rail (mặc định chiếm trọn chiều cao container `100%`).         |
| `floating`          | `boolean`                   | `false`      | Bật hiệu ứng nổi (bo góc tròn `rounded-xl`, đổ bóng `shadow-md` và viền).    |
| `showFooterDivider` | `boolean`                   | `true`       | Bật/tắt đường kẻ phân cách phía trên vùng footer.                            |
| `className`         | `string`                    | `""`         | Lớp CSS Tailwind tùy biến bổ sung.                                           |
| `style`             | `React.CSSProperties`       | `-`          | Inline style object tùy biến.                                                |

---

### 1.2. NavGroup Props

| Prop           | Type                  | Default | Description                                                 |
| :------------- | :-------------------- | :------ | :---------------------------------------------------------- |
| `label`        | `string`              | `-`     | Tiêu đề nhóm điều hướng.                                    |
| `expanded`     | `boolean`             | `true`  | Trạng thái mở rộng danh sách mục con của nhóm.              |
| `hideChevron`  | `boolean`             | `false` | Ẩn mũi tên chevron đóng/mở nhóm.                            |
| `badge`        | `boolean`             | `false` | Hiển thị chấm tròn thông báo (dot badge) cạnh tiêu đề nhóm. |
| `children`     | `React.ReactNode`     | `-`     | Các mục `NavItem` thuộc nhóm này.                           |
| `onToggle`     | `() => void`          | `-`     | Callback khi người dùng nhấn vào tiêu đề nhóm để đóng/mở.   |
| `size`         | `"sm" \| "md"`        | `'md'`  | Kích thước tiêu đề nhóm (`sm` hoặc `md`).                   |
| `isFirstGroup` | `boolean`             | `false` | Ẩn đường kẻ phân cách phía trên nếu là nhóm đầu tiên.       |
| `className`    | `string`              | `""`    | Lớp CSS Tailwind tùy biến.                                  |
| `style`        | `React.CSSProperties` | `-`     | Inline style object tùy biến.                               |

---

### 1.3. NavItem Props

| Prop           | Type                                    | Default     | Description                                                                    |
| :------------- | :-------------------------------------- | :---------- | :----------------------------------------------------------------------------- |
| `id`           | `string`                                | `-`         | Định danh duy nhất của mục điều hướng.                                         |
| `label`        | `string`                                | `-`         | Nhãn tên hiển thị của mục.                                                     |
| `icon`         | `React.ReactNode`                       | `-`         | Icon đại diện phía trước (tự động căn giữa khi ở chế độ collapsed).            |
| `badge`        | `number`                                | `-`         | Số lượng thông báo hoặc số đếm hiển thị dạng huy hiệu.                         |
| `badgeVariant` | `"primary" \| "secondary"`              | `'primary'` | Kiểu hiển thị huy hiệu: `'primary'` nổi bật, `'secondary'` nhẹ nhàng.          |
| `badgeColor`   | `NavItemBadgeColor`                     | `'black'`   | Màu sắc của badge (`'black'`, `'red'`, `'blue'`, `'green'`, `'yellow'`, v.v.). |
| `selected`     | `boolean`                               | `false`     | Trạng thái đang được chọn (highlight nền brand xanh).                          |
| `disabled`     | `boolean`                               | `false`     | Vô hiệu hóa mục điều hướng.                                                    |
| `children`     | `NavItemChildItem[] \| React.ReactNode` | `-`         | Danh sách mục con phân cấp đa tầng (cây thư mục).                              |
| `level`        | `number`                                | `0`         | Cấp độ thụt lùi (tự động tăng dần cho các mục lồng nhau).                      |
| `size`         | `"sm" \| "md"`                          | `'md'`      | Kích thước của item (`md` cao 48px, `sm` cao 32px).                            |
| `href`         | `string`                                | `-`         | Đường dẫn URL chuyển trang (hỗ trợ thẻ liên kết HTML / Next.js).               |
| `onClick`      | `(id: string) => void`                  | `-`         | Callback khi click vào item.                                                   |
| `className`    | `string`                                | `""`        | Lớp CSS Tailwind bổ sung.                                                      |
| `style`        | `React.CSSProperties`                   | `-`         | Inline style object tùy biến.                                                  |

---

## 2. Các Biến Thể & Kịch Bản Sử Dụng

### 2.1. Thanh điều hướng cơ bản (Basic Expanded Mode)

Thanh điều hướng tiêu chuẩn với Logo TutorMatch ở header và thông tin tài khoản người dùng ở footer.

```tsx
"use client";

import {
  NavigationRail,
  NavGroup,
  NavItem,
} from "@/components/ui/navigation-rail";

export default function BasicRailDemo() {
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-950">
      <NavigationRail
        mode="expanded"
        header={
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center">
              T
            </span>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              TutorMatch
            </span>
          </div>
        }
        footer={
          <div className="flex items-center gap-3 p-1">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center">
              HS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                Nguyễn Hồng Sơn
              </span>
              <span className="text-xs text-gray-500 truncate">Học sinh</span>
            </div>
          </div>
        }
      >
        <NavGroup label="Học tập" hideChevron>
          <NavItem id="dashboard" label="Bảng điều khiển" selected />
          <NavItem id="tutors" label="Tìm gia sư" badge={12} />
          <NavItem id="requests" label="Yêu cầu thuê gia sư" badge={3} />
          <NavItem id="messages" label="Tin nhắn" badge={5} />
        </NavGroup>
      </NavigationRail>

      <main className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Nội dung chính
        </h1>
      </main>
    </div>
  );
}
```

---

### 2.2. Chế độ thu gọn (Collapsed Mode - 64px)

Khi ở chế độ `mode="collapsed"`, thanh điều hướng co lại còn 64px, các mục hiển thị icon căn giữa kèm badge nhỏ ở góc.

```tsx
"use client";

import { NavigationRail, NavItem } from "@/components/ui/navigation-rail";
import { HomeIcon, SearchIcon, MessageSquareIcon } from "lucide-react";

export default function CollapsedRailDemo() {
  return (
    <NavigationRail mode="collapsed">
      <NavItem
        id="c1"
        label="Trang chủ"
        icon={<HomeIcon className="w-5 h-5" />}
        selected
      />
      <NavItem
        id="c2"
        label="Tìm kiếm"
        icon={<SearchIcon className="w-5 h-5" />}
      />
      <NavItem
        id="c3"
        label="Tin nhắn"
        icon={<MessageSquareIcon className="w-5 h-5" />}
        badge={4}
        badgeColor="red"
      />
    </NavigationRail>
  );
}
```

---

### 2.3. Bật/Tắt thu gọn động (Application Structure với State)

Sử dụng State để người dùng linh hoạt thu nhỏ hoặc mở rộng thanh điều hướng bằng nút Collapse/Expand.

```tsx
"use client";

import * as React from "react";
import {
  NavigationRail,
  NavGroup,
  NavItem,
} from "@/components/ui/navigation-rail";
import { SearchField } from "@/components/ui/search-field";
import { Button } from "@/components/ui/button";

export default function AppRailDemo() {
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <NavigationRail
      mode={collapsed ? "collapsed" : "expanded"}
      header={
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <span className="font-bold text-brand">TutorMatch</span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600"
              title={collapsed ? "Mở rộng thanh điều hướng" : "Thu nhỏ"}
            >
              ☰
            </button>
          </div>
          {!collapsed && (
            <SearchField placeholder="Tìm nhanh..." size="small" />
          )}
        </div>
      }
      footer={
        !collapsed ? (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Nâng cấp gói Gia sư Pro
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              Tiếp cận không giới hạn học viên.
            </p>
            <Button variant="primary" size="small" isFullWidth>
              Nâng cấp
            </Button>
          </div>
        ) : null
      }
    >
      <NavGroup label="Học tập">
        <NavItem id="app1" label="Khóa học" selected />
        <NavItem id="app2" label="Lịch học" />
        <NavItem id="app3" label="Tin nhắn" badge={2} />
      </NavGroup>
    </NavigationRail>
  );
}
```

---

### 2.4. Danh mục phân cấp lồng nhau (Nested Tree Items)

Hỗ trợ cấu trúc cây phân tầng với các đường nối (`elbow branch lines`) tinh tế.

```tsx
"use client";

import {
  NavigationRail,
  NavGroup,
  NavItem,
} from "@/components/ui/navigation-rail";

export default function NestedRailDemo() {
  return (
    <NavigationRail>
      <NavGroup label="Môn học gia sư">
        <NavItem id="n1" label="Toán học" selected />
        <NavItem
          id="n2"
          label="Ngoại ngữ"
          children={[
            { id: "n2-1", label: "Tiếng Anh IELTS" },
            { id: "n2-2", label: "Tiếng Nhật JLPT" },
            { id: "n2-3", label: "Tiếng Trung HSK" },
          ]}
        />
        <NavItem id="n3" label="Tin học lập trình" />
      </NavGroup>
    </NavigationRail>
  );
}
```

---

### 2.5. Kiểu dáng nổi (Floating Style)

Bật prop `floating` giúp thanh rail tách biệt với viền nền ngoài bằng shadow và bo góc mềm mại.

```tsx
"use client";

import {
  NavigationRail,
  NavGroup,
  NavItem,
} from "@/components/ui/navigation-rail";

export default function FloatingRailDemo() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 p-3">
      <NavigationRail floating>
        <NavGroup label="Quản trị">
          <NavItem id="f1" label="Duyệt hồ sơ gia sư" selected />
          <NavItem id="f2" label="Quản lý hợp đồng" />
          <NavItem id="f3" label="Báo cáo vi phạm" badge={1} badgeColor="red" />
        </NavGroup>
      </NavigationRail>
      <div className="flex-1 p-6">Nội dung trang quản trị</div>
    </div>
  );
}
```

---

### 2.6. Kích thước nhỏ gọn (`size="sm"`)

Phù hợp cho các bảng điều khiển chuyên sâu cần mật độ hiển thị thông tin cao.

```tsx
"use client";

import {
  NavigationRail,
  NavGroup,
  NavItem,
} from "@/components/ui/navigation-rail";

export default function SmallRailDemo() {
  return (
    <NavigationRail expandedWidth={240}>
      <NavGroup label="Hệ thống" size="sm">
        <NavItem id="s1" label="Cấu hình chung" size="sm" selected />
        <NavItem id="s2" label="Phân quyền người dùng" size="sm" />
        <NavItem id="s3" label="Nhật ký kiểm toán" size="sm" disabled />
      </NavGroup>
    </NavigationRail>
  );
}
```

---

## 3. Quy chuẩn Design System

- **Màu sắc thương hiệu (`brand`):** Mục được chọn (`selected`) sử dụng màu nền `bg-blue-50 dark:bg-blue-950/40` và chữ màu `text-brand-700 dark:text-blue-300`.
- **Typography:** Kích thước chữ chuẩn là `text-base` (hoặc `text-sm` khi ở chế độ `size="sm"`), tiêu đề nhóm là `text-xs font-semibold uppercase tracking-wider`.
- **Khả năng tiếp cận (Accessibility):** Tuân thủ tiêu chuẩn WAI-ARIA với các thuộc tính `role="button"`, `aria-label`, `aria-selected`, `aria-disabled`, `aria-expanded` cùng đầy đủ điều hướng bằng bàn phím (`Enter`, `Space`).
