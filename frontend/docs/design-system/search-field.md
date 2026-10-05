# SearchField Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Search Field](https://www.photonix.dev/components/search-field)  
> **Đường dẫn component:** [`components/ui/search-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/search-field.tsx) (hoặc re-export tại [`components/search-field.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/search-field.tsx))

Component `SearchField` là thanh tìm kiếm nâng cao với icon kính lúp, hỗ trợ phím tắt gợi ý (như `⌘K` hoặc `Ctrl K`), nút xóa nhanh, trạng thái spinner khi truy vấn API, và sự kiện `onSearch` khi ấn phím Enter.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onSearch` | `(query: string) => void` | `-` | Callback kích hoạt khi bấm Enter hoặc xác nhận tìm kiếm. |
| `onClear` | `() => void` | `-` | Callback kích hoạt khi nhấn nút xóa `x`. |
| `isLoading` | `boolean` | `false` | Hiển thị vòng xoay spinner thay thế kính lúp khi đang tải dữ liệu. |
| `shortcut` | `string` | `'⌘K'` | Nhãn phím tắt hiển thị bên phải thanh tìm kiếm. |
| `size` | `"small" \| "medium" \| "large"` | `'medium'` | Kích thước thanh tìm kiếm. |
| `isFullWidth` | `boolean` | `true` | Chiếm toàn bộ bề ngang vùng chứa. |

---

## 2. Ví dụ sử dụng

```tsx
import { SearchField } from "@/components/search-field";
import { useState } from "react";

export default function SearchFieldDemo() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = (text: string) => {
    setLoading(true);
    console.log("Searching for:", text);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="max-w-md">
      <SearchField
        placeholder="Tìm kiếm theo môn học, gia sư, trường ĐH..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        isLoading={loading}
        shortcut="Ctrl K"
      />
    </div>
  );
}
```
