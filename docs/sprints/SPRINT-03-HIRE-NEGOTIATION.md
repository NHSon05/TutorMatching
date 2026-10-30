# Sprint 3 - Yêu cầu thuê và thương lượng

Sprint 3 được định nghĩa trong feature
[`003-hire-negotiation`](../../specs/003-hire-negotiation/).

## Phạm vi

- Tạo yêu cầu thuê hợp lệ, nguyên tử và không trùng khi gửi lại.
- Danh sách, chi tiết, lịch sử trạng thái và kiểm soát quyền sở hữu.
- Chấp nhận, từ chối và thương lượng giá/lịch theo phiên bản.
- Hủy, hoàn thành và ngăn cập nhật đồng thời ghi đè trạng thái mới.

## Tài liệu hiện có

- [Specification](../../specs/003-hire-negotiation/spec.md)
- [Requirements checklist](../../specs/003-hire-negotiation/checklists/requirements.md)
- [Implementation plan](../../specs/003-hire-negotiation/plan.md)
- [Research](../../specs/003-hire-negotiation/research.md)
- [Data model](../../specs/003-hire-negotiation/data-model.md)
- [API contract](../../specs/003-hire-negotiation/contracts/openapi.json)
- [Validation guide](../../specs/003-hire-negotiation/quickstart.md)

- [Implementation tasks](../../specs/003-hire-negotiation/tasks.md)

## Bước tiếp theo

Đã hoàn thành Phase 1–7 (T001–T045): gửi yêu cầu, phản hồi, thương lượng giá/lịch, theo dõi trạng thái/lịch sử và hủy/hoàn tất yêu cầu theo đúng thẩm quyền. Toàn bộ kiểm thử domain, API integration, UI component và E2E browser Playwright đều đã pass và được ghi nhận trong [evidence](../../specs/003-hire-negotiation/evidence.md).
Tiếp theo: Phase 8 (T046–T050) — kiểm tra chéo bảo mật OpenAPI, kiểm thử tải 100 người dùng đồng thời và nghiệm thu feature-wide.
