# Sprint 9 - Thanh toán học phí & Đánh giá gia sư sau khóa học

Sprint 9 được định nghĩa trong feature [`009-hire-payment-and-reviews`](../../specs/009-hire-payment-and-reviews/).

## Phạm vi

- **Thanh toán gói học phí (`VIETQR_SANDBOX`)**:
  - Tính toán tự động số buổi thanh toán theo gói khóa học (`Course.SessionCount`) hoặc gói 1 tháng (`SessionsPerWeek * 4`).
  - Sinh mã VietQR động kèm nội dung chuyển khoản chuẩn hóa và nút xác nhận Sandbox phục vụ kiểm thử/demo.
  - Bắt buộc `PaymentStatusCode == "PAID"` trước khi yêu cầu thuê (`HireRequest`) được chuyển từ `ACCEPTED` sang `COMPLETED`.
- **Đánh giá & Nhận xét gia sư sau khi kết thúc khóa học (`hire_reviews`)**:
  - Học viên đánh giá 1–5 sao và nhận xét sau khi yêu cầu thuê đạt trạng thái `COMPLETED` (tối đa 1 đánh giá / yêu cầu thuê).
  - Gia sư có thể phản hồi (reply) đánh giá của học viên.
  - Tự động cập nhật điểm trung bình (`average_rating`) và tổng số lượt đánh giá (`review_count`) trên `tutor_profiles`, hiển thị công khai trên thẻ gia sư và trang chi tiết gia sư.

## Tài liệu hiện có

- [Specification](../../specs/009-hire-payment-and-reviews/spec.md)
- [Implementation plan](../../specs/009-hire-payment-and-reviews/plan.md)
- [Data model](../../specs/009-hire-payment-and-reviews/data-model.md)
- [Implementation tasks](../../specs/009-hire-payment-and-reviews/tasks.md)

## Bước tiếp theo

Thực thi tuần tự từ **Phase 2 (T002–T004)** → **Phase 3 (T005–T009)** → **Phase 4 (T010–T014)** → **Phase 5 (T015–T016)** theo [tasks.md](../../specs/009-hire-payment-and-reviews/tasks.md).
