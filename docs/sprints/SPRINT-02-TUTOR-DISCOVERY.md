# Sprint 2 - Hồ sơ, duyệt và tìm kiếm gia sư

Sprint 2 được định nghĩa trong feature
[`002-tutor-discovery`](../../specs/002-tutor-discovery/).

## Phạm vi

- Hồ sơ chuyên môn, môn học, khu vực, lịch rảnh và khóa học của gia sư.
- Admin duyệt, yêu cầu sửa hoặc từ chối hồ sơ.
- Tìm kiếm, lọc, sắp xếp, phân trang và xem chi tiết công khai.
- Chỉ hồ sơ `APPROVED` của tài khoản `ACTIVE` được công khai.
- Không bao gồm AI gợi ý gia sư vì SRS xác định chức năng này ngoài MVP.

## Tài liệu hiện có

- [Specification](../../specs/002-tutor-discovery/spec.md)
- [Requirements checklist](../../specs/002-tutor-discovery/checklists/requirements.md)
- [Kế hoạch triển khai](../../specs/002-tutor-discovery/plan.md)

## Backlog và tiêu chí nghiệm thu

Phạm vi xác nhận ngày 2026-10-20: 11 hạng mục core; S2-10–11 hoãn sau MVP. Bảng này là bản tổng quan sprint; `spec.md` vẫn là nguồn yêu cầu, `plan.md` sở hữu thiết kế và `tasks.md` sẽ sở hữu công việc triển khai.

| ID | Hạng mục | Tiêu chí nghiệm thu | Tham chiếu spec |
|---|---|---|---|
| S2-01 | Quản lý môn học | Admin thêm/sửa/ngừng sử dụng; người không có quyền bị chặn; ngừng dùng không xóa liên kết lịch sử | FR-006 |
| S2-02 | Khu vực và trình độ | Danh mục khu vực dùng thống nhất cho nhập và lọc; kiểm tra quan hệ tỉnh–huyện; phân biệt bằng cấp gia sư với lớp/trình độ học viên | FR-001,006,015,017 |
| S2-03 | Tạo/sửa hồ sơ | Lưu draft, kiểm tra dữ liệu khi gửi duyệt; có tên hiển thị, giới thiệu, trình độ, kinh nghiệm, thành tích, giá và hình thức; chỉ chủ hồ sơ được sửa | FR-001–005 |
| S2-04 | Môn gia sư dạy | Chọn nhiều môn đang hoạt động; không trùng; lưu lớp/mức có thể dạy cho từng môn | FR-003,007; cần bổ sung tiêu chí lớp theo môn vào spec |
| S2-05 | Lịch rảnh | Thêm/sửa/xóa; bắt đầu trước kết thúc; chặn chồng lấn, kiểm tra cả khi sửa; chỉ chủ hồ sơ thao tác | FR-008 |
| S2-06 | Khóa học | Tên, môn, nội dung, số buổi, giá theo buổi, trạng thái; giữ lịch sử khi ngừng khóa học | FR-009–010; cần bổ sung số buổi và quy tắc giá vào spec |
| S2-07 | Gửi và duyệt hồ sơ | Queue chờ duyệt; approve/request changes/reject; lý do bắt buộc khi không duyệt; lưu lịch sử, thông báo và chống ghi đè quyết định | FR-004,011–013 |
| S2-08 | Công khai hồ sơ | List/detail chỉ trả APPROVED + ACTIVE; sửa core phải duyệt lại; không thể vượt kiểm tra bằng query status hoặc truy cập ID trực tiếp | FR-005,014,019 |
| S2-09 | Tìm kiếm và bộ lọc | Tên, môn, trình độ, giá, hình thức, khu vực, thời gian và số buổi; kiểm tra tổ hợp, biên và đầu vào sai | FR-015–018 |
| S2-10 | AI gợi ý | Sau MVP; không triển khai hoặc tính vào nghiệm thu Sprint 2 | Ngoài phạm vi |
| S2-11 | Giải thích gợi ý AI | Sau MVP cùng S2-10 | Ngoài phạm vi |
| S2-12 | Chi tiết gia sư | Hiện thông tin chuyên môn, môn, lịch rảnh, khóa học active; không lộ liên hệ riêng tư; hồ sơ mất điều kiện công khai trả unavailable | FR-019–021 |
| S2-13 | Phân trang và kiểm thử | Count/sort/page nhất quán, tie-breaker ổn định; loading/error/empty; kiểm thử quyền, quyền sở hữu, privacy, bộ lọc và dữ liệu mẫu | FR-018,021–022; SC-002–007 |

## Thứ tự triển khai đề xuất

1. Xác minh auth/role/CSRF từ Sprint 1; xử lý kiểm soát công khai S2-08 trước để khóa đường truy cập hồ sơ không đủ điều kiện.
2. Chuẩn hóa danh mục S2-01–02, sau đó hồ sơ và liên kết môn S2-03–04.
3. Hoàn thiện lịch và khóa học S2-05–06; gửi/duyệt và tái duyệt S2-07–08.
4. Tìm kiếm và chi tiết S2-09,12; hoàn tất phân trang, E2E và đo hiệu năng S2-13.

Phân trang và validation phải được thiết kế cùng API tìm kiếm; bước cuối là xác minh tích hợp, không trì hoãn thiết kế đến cuối sprint. Chưa ấn định thời lượng khi chưa có thông tin nhân lực và số ngày sprint.

## Những điểm cần chốt trong thiết kế

- Đơn vị giá tìm kiếm là VND/buổi; dữ liệu hiện có còn giá giờ/tháng nên cần quy tắc chuyển đổi hoặc yêu cầu nhập bổ sung, không tự quy đổi thiếu thời lượng.
- Danh mục khu vực có mã và phiên bản seed; không suy ra khu vực từ trường học hoặc phần giới thiệu.
- Đề xuất lịch tuần theo Asia/Ho_Chi_Minh và khoảng [start,end), cho phép sát biên; slot qua nửa đêm tách làm hai. Đây là lựa chọn cần được ghi trong research và contract.
- Số buổi phù hợp phải xét thời lượng mỗi buổi và giao với cửa sổ học mong muốn; hợp nhất khoảng giao trước khi đếm để tránh đếm trùng. Sprint này đánh giá lịch khai báo, chưa bảo đảm giữ chỗ hoặc trừ lịch thuê từ Sprint 3.
- Xác định đầy đủ nhóm nội dung core, trạng thái sau sửa và quy tắc hồ sơ bị ẩn trong thời gian tái duyệt.
- Danh mục ngừng dùng, khóa học có lịch sử và dữ liệu onboarding hiện hữu cần chính sách migration không mất dữ liệu.
- Thông báo kết quả duyệt phải có cơ chế lưu/phát bền vững; không phụ thuộc toàn bộ giao diện thông báo của Sprint 4.

## Điều kiện hoàn thành sprint

- Demo độc lập: tutor lưu draft → hoàn thiện môn/lịch/khóa học → gửi → admin yêu cầu sửa → tutor gửi lại → admin duyệt → khách tìm kiếm và mở chi tiết.
- Chạy thêm ca từ chối, sửa core sau duyệt, tài khoản bị khóa, truy cập ID trực tiếp, sai quyền và private-field exclusion.
- Đạt mục tiêu đặc tả: 95% tìm kiếm trang đầu trong 3 giây với 10.000 hồ sơ và 100 người dùng đồng thời; ghi môi trường đo và kết quả thực, không coi đây là kết quả đã đạt.
- Kiểm tra migration, hợp đồng API, kiểm thử phù hợp và diff; ghi bằng chứng cho từng checkpoint trước đánh dấu hoàn thành.
- S2-10–11 không phải điều kiện hoàn thành.

## Bước tiếp theo

Bản nháp plan đã tồn tại; không cần tạo lại feature. Bổ sung spec cho lớp theo môn, số buổi khóa học và các quy tắc đã chốt; tiếp tục workflow plan cho `002-tutor-discovery` để tạo research, data model, OpenAPI contracts và quickstart. Sau đó sinh tasks theo user story và kiểm tra tính nhất quán trước triển khai. Thiết kế chi tiết và tasks hiện chưa hoàn tất.

## Bộ tài liệu làm việc

- [Research](../../specs/002-tutor-discovery/research.md)
- [Data model](../../specs/002-tutor-discovery/data-model.md)
- [API contract](../../specs/002-tutor-discovery/contracts/openapi.json) và [ghi chú tương thích](../../specs/002-tutor-discovery/contracts/README.md)
- [Quickstart và kiểm chứng](../../specs/002-tutor-discovery/quickstart.md)
- [35 tasks triển khai](../../specs/002-tutor-discovery/tasks.md)

Các tài liệu đã được tạo; phần “Bước tiếp theo” phía trên mô tả workflow thiết kế. Bước thực hiện hiện tại là review contracts, bắt đầu T001 và chạy từng checkpoint; chưa có task triển khai nào được xác nhận hoàn thành.
