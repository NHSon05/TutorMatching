# Accordion Component

> **Nguồn tham khảo / Clone từ:** [Photonix UI - Accordion](https://www.photonix.dev/components/accordion)  
> **Đường dẫn component:** [`components/ui/accordion.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/ui/accordion.tsx) (hoặc re-export tại [`components/accordion.tsx`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/frontend/src/components/accordion.tsx))

Component `Accordion` là các thanh xếp đóng/mở nội dung thu gọn, tối ưu hiển thị các câu hỏi thường gặp (FAQ), điều khoản quy định hợp đồng dạy học, hoặc chi tiết lộ trình học tập qua các buổi.

---

## 1. Component API

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `items` | `AccordionItemProps[]` | **Bắt buộc** | Danh sách các mục `{ id, title, children, disabled? }`. |
| `allowMultiple` | `boolean` | `false` | Cho phép mở đồng thời nhiều mục cùng lúc. |
| `defaultOpenIds` | `string[]` | `[]` | Danh sách ID các mục mở mặc định. |

---

## 2. Ví dụ sử dụng

```tsx
import { Accordion } from "@/components/accordion";

export default function FAQAccordionDemo() {
  return (
    <div className="max-w-xl">
      <Accordion
        allowMultiple={false}
        defaultOpenIds={["faq-1"]}
        items={[
          {
            id: "faq-1",
            title: "Quy trình tìm gia sư và gửi lời mời dạy diễn ra như thế nào?",
            children: "Phụ huynh/học viên tìm kiếm gia sư theo môn học, khu vực và mức giá. Sau đó gửi yêu cầu kèm lịch học mong muốn để gia sư xác nhận và trao đổi tin nhắn.",
          },
          {
            id: "faq-2",
            title: "Làm thế nào để biết gia sư đã được xác thực bằng cấp?",
            children: "Mọi gia sư có huy hiệu 'Đã duyệt hồ sơ' đều đã được Ban quản trị TutorMatching kiểm tra đối soát trực tiếp bằng cử nhân hoặc thẻ sinh viên.",
          },
          {
            id: "faq-3",
            title: "Học phí được thanh toán như thế nào?",
            children: "Trong phiên bản MVP hiện tại, học phí được thỏa thuận trực tiếp và thanh toán linh hoạt giữa phụ huynh và gia sư sau mỗi buổi hoặc theo tháng.",
          },
        ]}
      />
    </div>
  );
}
```
