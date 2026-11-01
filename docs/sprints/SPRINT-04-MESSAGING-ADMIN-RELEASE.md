# Sprint 4 - Nhắn tin, quản trị và hoàn thiện MVP

Sprint 4 được định nghĩa trong feature
[`004-messaging-admin-release`](../../specs/004-messaging-admin-release/).

## Phạm vi

- Trò chuyện theo yêu cầu thuê, lịch sử, trạng thái đã đọc và thông báo.
- Quản lý người dùng, bài viết, danh mục và theo dõi yêu cầu.
- Dashboard thống kê và nhật ký quản trị.
- Hoàn thiện giao diện, kiểm thử hệ thống/nghiệm thu, backup và bàn giao.

## Tài liệu hiện có

- [Specification](../../specs/004-messaging-admin-release/spec.md)
- [Requirements checklist](../../specs/004-messaging-admin-release/checklists/requirements.md)

- [Implementation plan](../../specs/004-messaging-admin-release/plan.md)
- [Research](../../specs/004-messaging-admin-release/research.md)
- [Data model](../../specs/004-messaging-admin-release/data-model.md)
- [API contract design](../../specs/004-messaging-admin-release/contracts/api.md)
- [Validation guide](../../specs/004-messaging-admin-release/quickstart.md)

## Trạng thái và bước tiếp theo

2026-11-01: hoàn thành bước lập plan, chưa triển khai code Sprint 4. Chạy `$speckit-tasks`
và `$speckit-analyze` cho `specs/004-messaging-admin-release`, sau đó làm từng phase.
Setup cần chốt OpenAPI 3.1 từ thiết kế interface trước khi triển khai endpoint.
Ưu tiên: nền tảng → messaging → notification → quản lý tài khoản → nội dung/monitoring
→ dashboard/audit → nghiệm thu và bàn giao.

Sprint 3 đã có lifecycle đến Phase 7; T046–T050 còn mở là điều kiện trước nghiệm thu MVP.
Không coi plan, dữ liệu mẫu hoặc các màn hình mock là bằng chứng đã hoàn tất chức năng.


## Realtime đã thống nhất (2026-11-01)

Server dùng ASP.NET Core SignalR; client dùng `@microsoft/signalr`. REST tiếp tục xử lý
lưu/gửi, đã đọc và lịch sử; SignalR đẩy sự kiện sau commit. Custom hook quản lý kết nối,
cache và đồng bộ lại qua REST khi reconnect. Quyết định thay thế thiết kế polling ban đầu.
