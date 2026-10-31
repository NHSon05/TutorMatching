# Tabs Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Tabs](https://www.photonix.dev/components/tabs)  
> **Đường dẫn component:** [`components/ui/tabs.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/tabs.tsx) (hoặc re-export từ `@/components`)

Component `Tabs` là thanh điều hướng theo thẻ phân nhóm nội dung trên cùng một trang hoặc trong modal/card (ví dụ: Thông tin lớp học / Lịch dạy / Đánh giá, Lịch sử yêu cầu thuê, Thiết lập tài khoản). Hỗ trợ đầy đủ phong cách thiết kế Photonix với chuẩn WAI-ARIA, 2 kiểu hiển thị (`line`, `pill`), 4 biến thể màu sắc thương hiệu của TutorMatching (`brand`, `tutor`, `admin`, `shared`), bố cục icon xếp dọc (`stacked`), nút trượt khi tràn (`overflowControls`), và cố định (`sticky`/`elevated`).

---

## 1. Component API

### `Tabs` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tabs` | `TabOption[]` | **Bắt buộc** | Danh sách các thẻ tab hiển thị. |
| `id` | `string` | `undefined` | ID tiền tố dùng để liên kết ARIA giữa `Tabs` và `TabPanel`. |
| `activeTab` | `string` | `undefined` | ID tab đang kích hoạt (Controlled). |
| `defaultTab` | `string` | `tabs[0].id` | ID tab mặc định khi khởi tạo (Uncontrolled). |
| `onChange` | `(tabId: string) => void` | `-` | Callback khi người dùng chuyển tab. |
| `roleVariant` | `"brand" \| "tutor" \| "admin" \| "shared"` | `'brand'` | Màu sắc ngữ nghĩa theo vai trò (Học viên: Xanh dương, Gia sư: Hổ phách, Admin: Đỏ, Chung: Chàm). |
| `variant` | `"line" \| "pill"` | `'line'` | Kiểu hiển thị gạch chân chỉ báo (`line`) hoặc dạng viên thuốc phân đoạn (`pill`). |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước thẻ tab, chữ và icon. |
| `stacked` | `boolean` | `false` | Bố cục icon nằm trên nhãn chữ (xếp dọc - vertical item). |
| `elevated` | `boolean` | `false` | Thêm bóng đổ nhẹ (`shadow-xs`) và đường viền đáy ngăn cách. |
| `sticky` | `boolean` | `false` | Cố định trên đỉnh màn hình khi cuộn kèm hiệu ứng mờ (`backdrop-blur`). |
| `stuck` | `boolean` | `false` | Trạng thái hiển thị khi bị ghim cố định. |
| `padded` | `boolean \| string \| number` | `false` | Thêm padding hai bên thanh tab (`true` = 16px). |
| `overflowControls` | `"auto" \| "never"` | `'auto'` | Tự động hiển thị nút mũi tên cuộn trái/phải khi danh sách tab tràn chiều ngang. |
| `activationMode` | `"automatic" \| "manual"` | `'automatic'` | Cơ chế kích hoạt bàn phím: `'automatic'` (focus là chọn ngay) hoặc `'manual'` (cần bấm Enter/Space). |
| `className` | `string` | `""` | Class CSS tùy biến bổ sung. |
| `style` | `React.CSSProperties` | `-` | Inline style bổ sung. |

---

### `TabPanel` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `tabId` | `string` | **Bắt buộc** | ID tab tương ứng với panel này. |
| `tabsId` | `string` | `undefined` | ID tiền tố trùng với `id` của component `Tabs`. |
| `activeTab` | `string` | `undefined` | ID tab đang active (panel chỉ hiển thị khi `activeTab === tabId`). |
| `children` | `React.ReactNode` | `-` | Nội dung bên trong thẻ tab. |
| `className` | `string` | `""` | Class CSS của container panel. |

---

### `TabOption` Object

| Thuộc tính | Kiểu dữ liệu | Mặc định | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Bắt buộc** | Mã định danh duy nhất của tab. |
| `label` | `React.ReactNode` | `undefined` | Nhãn chữ của tab. |
| `icon` | `React.ReactNode` | `undefined` | Biểu tượng đi kèm tab. |
| `badge` | `React.ReactNode \| string \| number` | `undefined` | Huy hiệu số lượng hoặc trạng thái bên cạnh nhãn. |
| `disabled` | `boolean` | `false` | Vô hiệu hóa không cho click hoặc chọn tab này. |
| `showChevron` | `boolean` | `false` | Hiển thị mũi tên chỉ báo mở rộng/dropdown. |

---

## 2. Màu sắc thương hiệu (Brand Semantic Roles)

Component tự động căn chỉnh màu sắc theo Design System Tokens của dự án TutorMatching:

- **`roleVariant="brand"` (Mặc định - Học viên / Hệ thống)**:  
  Active gạch chân & viền xanh dương `#2563eb` (`--color-brand-600`), nền pill `bg-brand-50 text-brand-700`.
- **`roleVariant="tutor"` (Phân hệ Gia sư)**:  
  Active gạch chân & viền màu hổ phách ấm `#d97706` (`--color-tutor-600`), nền pill `bg-amber-50 text-amber-800`.
- **`roleVariant="admin"` (Phân hệ Quản trị viên)**:  
  Active gạch chân & viền đỏ `#dc2626` (`--color-admin-600`), nền pill `bg-red-50 text-red-800`.
- **`roleVariant="shared"` (Tin nhắn / Thương lượng)**:  
  Active gạch chân & viền tím chàm `#4f46e5` (`--color-shared-600`), nền pill `bg-indigo-50 text-indigo-800`.

---

## 3. Các ví dụ sử dụng

### 3.1. Cơ bản với TabPanel liên kết (Line Variant)

```tsx
"use client";

import { useState, useId } from "react";
import { Tabs, TabPanel } from "@/components/ui/tabs";

export default function BasicTabsDemo() {
  const tabsId = useId();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Tổng quan lớp học" },
    { id: "schedule", label: "Lịch dạy cố định" },
    { id: "reviews", label: "Đánh giá học viên", badge: 12 },
  ];

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl p-6 border border-border-default">
      <Tabs
        id={tabsId}
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="line"
      />

      <div className="pt-4">
        <TabPanel tabsId={tabsId} tabId="overview" activeTab={activeTab}>
          <p className="text-content-secondary text-sm">Nội dung chi tiết thông tin lớp học...</p>
        </TabPanel>
        <TabPanel tabsId={tabsId} tabId="schedule" activeTab={activeTab}>
          <p className="text-content-secondary text-sm">Bảng phân bổ khung giờ trong tuần...</p>
        </TabPanel>
        <TabPanel tabsId={tabsId} tabId="reviews" activeTab={activeTab}>
          <p className="text-content-secondary text-sm">Danh sách 12 đánh giá 5 sao từ phụ huynh...</p>
        </TabPanel>
      </div>
    </div>
  );
}
```

---

### 3.2. Phong cách Pill & Phân hệ Gia sư (`roleVariant="tutor"`)

```tsx
<Tabs
  variant="pill"
  roleVariant="tutor"
  activeTab={currentTab}
  onChange={setCurrentTab}
  tabs={[
    { id: "pending", label: "Chờ phản hồi", badge: 3 },
    { id: "negotiating", label: "Đang thương lượng", badge: 1 },
    { id: "accepted", label: "Đã chốt thỏa thuận" },
  ]}
/>
```

---

### 3.3. Có biểu tượng & Xếp dọc (`stacked`)

Thích hợp khi dùng làm thanh chuyển tab di động hoặc thanh công cụ có icon minh họa phía trên nhãn chữ:

```tsx
<Tabs
  stacked
  size="medium"
  activeTab={tab}
  onChange={setTab}
  tabs={[
    { id: "info", label: "Thông tin", icon: <UserIcon /> },
    { id: "calendar", label: "Lịch rảnh", icon: <CalendarIcon /> },
    { id: "settings", label: "Cài đặt", icon: <SettingsIcon />, showChevron: true },
  ]}
/>
```

---

### 3.4. Tự động thanh cuộn khi tràn (`overflowControls="auto"`)

Khi có nhiều thẻ tab vượt quá độ rộng màn hình (đặc biệt trên di động hoặc danh sách môn học dài), component sẽ tự động bổ sung nút cuộn trái/phải mượt mà:

```tsx
<div className="max-w-md">
  <Tabs
    overflowControls="auto"
    activeTab={selectedSubject}
    onChange={setSelectedSubject}
    tabs={[
      { id: "math", label: "Toán học" },
      { id: "physics", label: "Vật lý" },
      { id: "chemistry", label: "Hóa học" },
      { id: "english", label: "Tiếng Anh" },
      { id: "biology", label: "Sinh học" },
      { id: "literature", label: "Ngữ văn" },
      { id: "history", label: "Lịch sử" },
    ]}
  />
</div>
```

---

## 4. Hỗ trợ tiếp cận (Accessibility - WAI-ARIA)

Component tuân thủ nghiêm ngặt tiêu chuẩn tiếp cận W3C Tabs Pattern:
- **`role="tablist"`**: Gắn trên container các nút tab.
- **`role="tab"`**: Gắn trên từng nút tab cùng thuộc tính `aria-selected` và `aria-controls`.
- **`role="tabpanel"`**: Gắn trên container nội dung tương ứng kèm `aria-labelledby`.
- **Phím mũi tên**:
  - `ArrowLeft` / `ArrowUp`: Chuyển focus sang tab trước đó (tự động quay vòng).
  - `ArrowRight` / `ArrowDown`: Chuyển focus sang tab tiếp theo (tự động quay vòng).
  - `Home`: Nhảy nhanh về tab đầu tiên.
  - `End`: Nhảy nhanh đến tab cuối cùng.
  - `Enter` / `Space`: Kích hoạt chọn tab khi ở chế độ `activationMode="manual"`.
- Bỏ qua các tab có trạng thái `disabled`.
