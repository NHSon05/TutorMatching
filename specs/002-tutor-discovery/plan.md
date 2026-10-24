# Implementation Plan: Sprint 2 — Tutor Discovery

**Date**: 2026-10-20 | **Spec**: [spec.md](spec.md)
**Status**: Phases 1–7 implemented and verified; Phase 8 pending.

## Summary

Sprint overview và bảng nghiệm thu theo S2-ID: [SPRINT-02-TUTOR-DISCOVERY.md](../../docs/sprints/SPRINT-02-TUTOR-DISCOVERY.md).

Hoàn thiện hành trình danh mục → hồ sơ → lịch/khóa học → duyệt → tìm kiếm → chi tiết. Theo xác nhận ngày 2026-10-20, S2-10–11 được giữ làm phần mở rộng sau MVP và không thuộc phạm vi nghiệm thu Sprint 2. Đặc tả hiện tại tiếp tục loại AI khỏi MVP.

## Technical Context

- Backend: .NET 10, ASP.NET Core, EF Core 10/Npgsql, PostgreSQL 17.
- Frontend: Next.js 16, React 19, TypeScript, TanStack Query, shared Axios client.
- Giữ Domain → Application abstractions → Infrastructure adapters; API chỉ điều phối HTTP.
- Migration phải giữ snake_case, dữ liệu onboarding và các liên kết lịch sử.
- Kiểm tra bằng Domain/Application/API tests, frontend component tests và Playwright journeys.
- Mục tiêu hiện có: p95 tìm kiếm ≤3 giây trên 10.000 hồ sơ, 100 người dùng đồng thời; dùng dữ liệu giả lập, ghi cấu hình máy và kết quả đo.

## Constitution Check

- Traceability: S2-01–09,12–13 ánh xạ FR-001–022 trong spec; S2-10–11 được hoãn sau MVP, phù hợp nguyên tắc I/V và Assumptions hiện tại.
- **Gate phạm vi đã giải quyết**: giữ AI ngoài MVP theo xác nhận của người dùng. Không cần sửa constitution hoặc mở rộng SRS; thiết kế chi tiết core có thể tiếp tục.
- Security: backend kiểm tra role/ownership; public chỉ APPROVED + ACTIVE, DTO allowlist, không email/điện thoại/ngày sinh/địa chỉ chính xác.
- Evidence: mỗi nhóm bên dưới có checkpoint; không đánh dấu hoàn thành chỉ vì đã có UI.
- Post-design check: core phù hợp scope, layered boundaries, privacy và evidence; contracts/research/model/tasks đã được tạo. Kiểm chứng implementation chỉ thực hiện khi triển khai.

## Current implementation and gaps

- Đã có TutorOnboardingController cho đọc hồ sơ, lưu draft, submit và upload; frontend có professional form. Tái sử dụng, bổ sung kiểm thử thay vì viết luồng trùng.
- TutorsController hiện cho anonymous truyền status/all; detail không áp dụng điều kiện public và list thiếu ACTIVE gate. S2-08 cần ưu tiên trước khi mở rộng discovery.
- List hiện tải toàn bộ rồi lọc môn/khu vực trong bộ nhớ; khu vực suy đoán từ trường/bio. Thay bằng khóa danh mục và truy vấn DB trước count/pagination.
- Giá hiện gồm hourly/session/monthly; phải thống nhất sessionRateVnd cho tìm kiếm theo buổi, không tự quy đổi giá giờ khi thiếu thời lượng.
- Rating đang cố định 5.0: bỏ hoặc hiển thị chưa có đánh giá, không dùng làm điểm xếp hạng.
- Sprint 1 còn E2E hồ sơ và password reset theo handoff; xác minh auth/role/CSRF thực tế trước checkpoint Sprint 2.

## Delivery phases and checkpoints

| Thứ tự  | Backlog  | Nội dung và phụ thuộc                                                               | Checkpoint độc lập                                                                                                               |
| ------- | -------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 0       | S2-08    | Chặn rò hồ sơ ở list/detail, tách endpoint quản trị; phụ thuộc auth Sprint 1        | Anonymous không xem được bất kỳ trạng thái ngoài APPROVED hoặc tài khoản ngoài ACTIVE, kể cả status=all và truy cập ID trực tiếp |
| 1       | S2-01–02 | Admin danh mục môn và khu vực; chuẩn hóa qualification và teaching level riêng biệt | Thêm/sửa/ngừng dùng, chống trùng; khóa ngoại lịch sử giữ nguyên; khu vực con thuộc đúng cha                                      |
| 2       | S2-03–04 | Tái sử dụng onboarding; liên kết nhiều môn và lớp/mức dạy theo từng môn             | Lưu draft thiếu dữ liệu được; submit thiếu dữ liệu bị chặn; ownership và danh mục inactive được kiểm tra                         |
| 3       | S2-05–06 | Lịch tuần và khóa học; phụ thuộc hồ sơ + môn                                        | Chặn giờ đảo/chồng lấn, cho phép sát biên; khóa học có số buổi và giá hợp lệ; ẩn thay xóa khi có lịch sử                         |
| 4       | S2-07–08 | Queue admin, approve/request-changes/reject, audit và thông báo quyết định          | Note bắt buộc khi yêu cầu sửa/từ chối; hai admin không ghi đè; sửa core ẩn hồ sơ và cần duyệt lại                                |
| 5       | S2-09,12 | Query kết hợp điều kiện, trang chi tiết, state loading/error/empty                  | Từng nhóm lọc và tổ hợp trả đúng; detail không lộ private fields và chỉ có khóa học active                                       |
| Sau MVP | S2-10–11 | Backlog mở rộng AI, không nằm trong Sprint 2                                        | Chỉ lập kế hoạch triển khai khi có yêu cầu mở rộng riêng                                                                         |
| 6       | S2-13    | Tích hợp phân trang/sort, E2E và benchmark                                          | Không trùng khi sort bằng nhau, boundary/empty page đúng, có bằng chứng hiệu năng                                                |

Không ấn định ngày công khi chưa biết nhân lực và độ dài sprint. MVP demo đầu tiên: danh mục → draft → gửi/duyệt → tìm kiếm → chi tiết. Lịch và khóa học phải hoàn tất trước nghiệm thu core Sprint 2; AI không phải điều kiện nghiệm thu Sprint 2.

## Proposed business rules to validate in research

1. Khu vực dùng province/district theo đặc tả dự án, không coi đây là khẳng định về dữ liệu hành chính hiện hành. Chọn bộ seed có phiên bản; không suy đoán từ bio. Qualification là bằng cấp của gia sư; teaching level là lớp/trình độ học viên và gắn với môn.
2. Lịch MVP lặp hàng tuần theo Asia/Ho_Chi_Minh, khoảng [start,end), không qua nửa đêm; muốn qua ngày phải tách slot. Ghi rõ timezone trong hợp đồng, không diễn giải local time thành UTC tùy ý.
3. Điều kiện số buổi: đầu vào sessionsPerWeek 1–21 + durationMinutes 30–240 + các cửa sổ tuần mong muốn. Lấy giao lịch rảnh với cửa sổ, hợp nhất giao chồng nhau, đếm tổng floor(độ dài giao/thời lượng) và yêu cầu đủ số buổi. Không chỉ đếm số slot; chưa trừ lịch đã chốt vì thuộc sprint hiring. UI nói rõ đây là khả năng đáp ứng lịch đã khai báo.
4. Course có name, subjectId, content, sessionCount nguyên dương, sessionPriceVnd nguyên dương và status. Chỉ môn đang dạy mới được liên kết; ngừng dùng danh mục không làm mất lịch sử.
5. Core gồm tên hiển thị, bio, trình độ, kinh nghiệm, thành tích, môn/lớp, giá, hình thức và khu vực. Sửa core trên APPROVED chuyển PENDING_REVIEW nếu hợp lệ; bản sửa chưa đủ điều kiện chuyển DRAFT. Cả hai đều ẩn công khai, không phục vụ snapshot cũ trong MVP. Chỉnh lịch/khóa học không tự duyệt lại nhưng vẫn kiểm tra ownership/validation.
6. Review dùng version token và transaction; stale update trả conflict. Audit ghi actor/time/from/to/note trong cùng transaction; cơ chế thông báo bền vững cần xác định trong research để tránh phụ thuộc UI Sprint 4.
7. Tìm kiếm: AND giữa các nhóm; nhiều lựa chọn trong một nhóm dùng OR. Giá theo buổi; min/max dương, min≤max. OFFLINE/HYBRID yêu cầu province+district. Sort allowlist kèm id làm tie-breaker; page≥1, pageSize 1–100; lọc/count/page tại DB.

## AI extension proposal — deferred until after MVP

Các ý dưới đây chỉ là ghi chú ý tưởng chưa được phê duyệt thiết kế; không tạo phụ thuộc hoặc công việc triển khai cho Sprint 2.

- Hard filters dùng chung với core search và áp dụng trước scoring; kiểm tra lại public eligibility khi trả kết quả.
- Chỉ embedding dữ liệu chuyên môn đã duyệt. Không gửi PII hoặc mục tiêu học tập vào log. Nhà cung cấp, chi phí, model và retention chưa chọn; cần research riêng sau scope gate.
- Phác thảo điểm: 70% semantic similarity chuẩn hóa + 30% lịch phù hợp; trọng số là giả định để đánh giá bằng bộ nhu cầu mẫu, không phải chất lượng đã kiểm chứng. Giá/môn/khu vực/hình thức là ràng buộc bắt buộc.
- Embedding gắn profileVersion/modelVersion; thay đổi core hoặc khóa tài khoản khiến bản cũ không đủ điều kiện. Worker phải idempotent, có retry giới hạn và trạng thái failed.
- Giải thích theo template từ bằng chứng thực: môn/lớp trùng, giá nằm trong khoảng, lịch giao nhau; ghi rõ thiếu dữ liệu và điểm ngữ nghĩa chỉ là gợi ý. Không suy diễn chứng chỉ/chất lượng/đảm bảo kết quả học tập.
- Fallback xác định khi provider lỗi/timeout; báo kết quả theo bộ lọc và không giả điểm AI. Test fake adapter và corpus cố định; benchmark AI tách khỏi mục tiêu core 3 giây.

## Project Structure and next planning artifacts

Tái sử dụng backend/src/TutorMatching.{Domain,Application,Infrastructure,Api}, backend/tests/, frontend/src/components/tutors/, frontend/src/lib/api/ và frontend/tests/. Frontend triển khai phải đọc frontend/AGENTS.md và design system trước sửa UI.

Với phạm vi core đã được xác nhận: đối chiếu và cập nhật spec theo S2-01–09,12–13 → research.md (danh mục, migration dữ liệu onboarding, trạng thái, thông báo, matching) → data-model.md → contracts/\*.yaml (OpenAPI versioned, errors, concurrency, DTO allowlist) → quickstart.md → tasks.md theo user story → consistency analysis. Chỉ sinh tasks cho core; không đưa S2-10–11 vào tasks Sprint 2.

## Verification strategy

- Regression security trước: status override, inactive account, direct detail, privacy và ownership.
- Domain: lifecycle, giá/số buổi, lịch sát biên/chồng lấn và số buổi có thể bố trí.
- Integration: migration giữ dữ liệu hiện có; query thực PostgreSQL; race duyệt/sửa; inactive catalogs; audit/thông báo.
- Contract/UI: public DTO không chứa trường riêng tư, form validation, bộ lọc kết hợp, pagination, keyboard/mobile và unavailable detail.
- Release: chạy checks phù hợp theo PROJECT.md; ghi kết quả thực trong quickstart khi triển khai. Chưa có kiểm thử sản phẩm nào được chạy trong lần lập draft này.

## Working artifacts

- [Research](research.md): decisions R1–R8 and alternatives.
- [Data model](data-model.md): existing entity changes, validation, migration and lifecycle.
- [API contract](contracts/openapi.json) and [contract notes](contracts/README.md): planned interface delta; preserve existing onboarding compatibility.
- [Quickstart](quickstart.md): independent scenarios and performance verification.
- [Tasks](tasks.md): 35 tasks across setup, foundation, US1–US5 and verification; T001–T031 complete.

Research decisions supersede the earlier proposed rules where more specific. No AI implementation is included. Current branch is main; no branch or commit was created for this documentation work.
