# DatePicker Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Date Picker](https://www.photonix.dev/components/date-picker)  
> **Đường dẫn component:** [`components/ui/date-picker.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/date-picker.tsx) (hoặc re-export tại [`components/date-picker.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/date-picker.tsx))

Component `DatePicker` là bộ chọn ngày đơn lẻ với giao diện lịch popover tiện lợi, hỗ trợ giới hạn ngày tối thiểu (`minDate`), ngày tối đa (`maxDate`), định dạng hiển thị kiểu Việt Nam (`DD/MM/YYYY`), và đánh dấu ngày hiện tại (Hôm nay).

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `value` | `Date \| string` | `undefined` | Giá trị ngày đang chọn (Controlled). |
| `defaultValue` | `Date \| string` | `undefined` | Ngày khởi tạo (Uncontrolled). |
| `onChange` | `(date: Date \| null, dateString: string) => void` | `-` | Callback khi chọn ngày mới. |
| `minDate` | `Date` | `-` | Ngày tối thiểu được phép chọn. |
| `maxDate` | `Date` | `-` | Ngày tối đa được phép chọn. |
| `placeholder` | `string` | `"Chọn ngày (DD/MM/YYYY)..."` | Văn bản giữ chỗ khi chưa chọn ngày. |
| `label` | `React.ReactNode` | `-` | Nhãn tiêu đề phía trên. |
| `helperText` | `React.ReactNode` | `-` | Dòng giải thích phía dưới. |
| `error` | `string \| boolean` | `-` | Thông báo lỗi. |
| `disabled` | `boolean` | `false` | Khóa bộ chọn ngày. |

---

## 2. Ví dụ sử dụng

```tsx
import { DatePicker } from "@/components/date-picker";
import { useState } from "react";

export default function DatePickerDemo() {
  const [startDate, setStartDate] = useState<Date | null>(new Date());

  return (
    <div className="max-w-xs">
      <DatePicker
        label="Ngày dự kiến bắt đầu học"
        value={startDate || undefined}
        onChange={(d) => setStartDate(d)}
        minDate={new Date()} // Không cho chọn ngày trong quá khứ
        helperText="Gia sư sẽ căn cứ vào ngày này để chuẩn bị giáo án mở đầu."
      />
    </div>
  );
}
```
