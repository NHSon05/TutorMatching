# Card Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Card](https://www.photonix.dev/components/card)  
> **Đường dẫn component:** [`components/ui/card.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/card.tsx) (hoặc re-export tại [`components/card.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/card.tsx))

Hệ thống component `Card` (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) là khung bao đóng chuẩn cho giao diện danh sách gia sư, thông tin ca học, và các khối widget thống kê trong Dashboard.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `hoverable` | `boolean` | `false` | Bật hiệu ứng đổi viền và đổ bóng khi di chuột. |
| `padding` | `"none" \| "small" \| "medium" \| "large"` | `'medium'` | Khoảng cách đệm bên trong Card. |
| `...props` | `HTMLAttributes<HTMLDivElement>` | `-` | Tất cả thuộc tính HTML `div` chuẩn. |

---

## 2. Ví dụ sử dụng

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";

export default function TutorCardDemo() {
  return (
    <Card hoverable className="max-w-sm">
      <CardHeader>
        <div className="flex justify-between items-center">
          <Badge variant="tutor" appearance="solid">Gia sư Tiếng Anh</Badge>
          <span className="text-xs font-bold text-brand">300.000 đ/buổi</span>
        </div>
        <CardTitle>Nguyễn Thùy Linh</CardTitle>
        <CardDescription>ĐH Ngoại Thương Hà Nội • IELTS 8.0</CardDescription>
      </CardHeader>

      <CardContent>
        <p className="text-xs text-gray-600 line-clamp-2">
          Hơn 3 năm kinh nghiệm gia sư luyện thi vào 10 và chứng chỉ IELTS cho học sinh cấp 2, cấp 3...
        </p>
      </CardContent>

      <CardFooter>
        <span className="text-xs text-gray-500">Q. Cầu Giấy, Hà Nội</span>
        <Button variant="brand" size="small">Mời dạy</Button>
      </CardFooter>
    </Card>
  );
}
```
