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

Đã review và làm rõ specification, hoàn thành kế hoạch thiết kế ngày 2026-10-28.
Đã hoàn thành Phase 1–3 (T001–T019): nền tảng và gửi yêu cầu thuê thật, retry không trùng.
Backend toàn bộ đạt 293 test; kiểm tra cuối create/security đạt 39 test. Frontend đạt 226 test; E2E gửi/retry đạt.
Tiếp theo: Phase 4 / US2 (T020–T027); xem [evidence](../../specs/003-hire-negotiation/evidence.md).
Migration mới chưa áp dụng vào database người dùng.
