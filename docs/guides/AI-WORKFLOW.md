# AI Workflow for TutorMatching

Tài liệu này áp dụng cho toàn bộ dự án. SRS, Spec Kit artifacts, code và test là nguồn sự thật; AI
chỉ hỗ trợ phân tích, triển khai và kiểm tra.

## 1. Chọn đúng workflow

- Thay đổi một dòng hoặc câu hỏi ngắn: dùng prompt thường.
- Feature mới hoặc thay đổi hành vi: dùng Spec Kit theo thứ tự
  `$speckit-specify` -> `$speckit-clarify` khi cần -> `$speckit-plan` ->
  `$speckit-checklist` -> `$speckit-tasks` -> `$speckit-analyze` ->
  `$speckit-implement` -> `$speckit-converge`.
- Công việc dài, có đích đo được và cần tự tiếp tục: dùng Codex Goal sau khi spec/plan/tasks đã ổn định.
- Bug nhỏ đã có reproduction rõ ràng: mô tả reproduction, expected/actual, phạm vi và test hồi quy;
  không cần tạo feature Spec Kit mới nếu overhead lớn hơn giá trị.

Spec Kit chính thức: <https://github.com/github/spec-kit>.

## 2. Chia context theo progressive disclosure

1. Bắt đầu từ `AGENTS.md`.
2. Nêu feature/task ID cụ thể, ví dụ `001-foundation-accounts/T018`.
3. AI chỉ đọc phần liên quan trong `spec.md`, `plan.md`, `tasks.md` và target files.
4. Chỉ mở `research.md`, `data-model.md` hoặc contract khi task phụ thuộc vào chúng.
5. Không dán toàn bộ SRS, transcript, log hoặc source tree vào prompt.
6. Sau task, ghi evidence vào test/PR/task; chỉ cập nhật project memory khi có sự thật ổn định mới.

## 3. Công thức prompt triển khai

```text
Thực hiện task <Txxx> của feature <feature-id>.

Nguồn sự thật:
- specs/<feature-id>/spec.md: <user story/requirement>
- specs/<feature-id>/plan.md: <section liên quan>
- specs/<feature-id>/tasks.md: <task ID>
- specs/<feature-id>/contracts/<contract nếu cần>

Phạm vi:
- <file/module được phép thay đổi>

Không làm:
- <ngoài task hoặc ngoài sprint>

Hoàn thành khi:
- <test/build/acceptance evidence>

Trước khi sửa, kiểm tra implementation hiện tại và nêu mọi xung đột với spec.
Sau khi sửa, chạy kiểm tra liên quan, review diff và báo file đổi, kết quả, giả định, blocker.
```

## 4. Prompt mẫu cho Sprint 1

```text
Thực hiện T018 của feature 001-foundation-accounts.

Chỉ tạo application tests cho đăng ký tài khoản. Đọc US1/FR-001..FR-005 trong spec.md,
các quyết định role/auth trong research.md và task T018. Không implement endpoint hoặc UI.

Test phải bao phủ role LEARNER/TUTOR, từ chối ADMIN, password confirmation, tối thiểu 8 ký tự
và duplicate normalized email. Chạy test project liên quan; ở bước test-first, xác nhận test fail
vì behavior chưa tồn tại chứ không phải lỗi compile/setup ngoài phạm vi. Báo evidence và blocker.
```

## 5. Prompt review

```text
Review thay đổi cho <task/PR> so với spec, constitution và contract. Chỉ review, chưa sửa.

Ưu tiên:
1. sai requirement hoặc thiếu acceptance path;
2. auth/authorization, account enumeration, secret/PII;
3. data integrity, transaction, migration và concurrency;
4. API compatibility và error contract;
5. test giả xanh hoặc thiếu failure path.

Mỗi phát hiện phải có mức độ, file/dòng, tình huống cụ thể, tác động và cách khắc phục.
Không báo lỗi chỉ dựa trên suy đoán; ghi rõ evidence còn thiếu.
```

## 6. Nguyên tắc an toàn và chất lượng

- Không gửi API key, mật khẩu, cookie, token, file `.env`, dữ liệu cá nhân thật hoặc production dump.
- Không để AI tự mở rộng scope, thêm dependency, đổi schema/API hoặc chọn một requirement mơ hồ mà
  không ghi quyết định.
- Validation và authorization bắt buộc ở backend; UI guard chỉ là UX.
- Yêu cầu test failure path, quyền truy cập và dữ liệu cạnh biên, không chỉ happy path.
- Chạy kiểm tra hẹp trước; chạy build/test rộng khi thay đổi vượt module hoặc trước bàn giao.
- Không đánh dấu task `[x]` vì AI nói “đã xong”; cần command output/evidence mới nhất.
- Review migration, OpenAPI, cấu hình, log và diff như code do thành viên mới viết.
- Nếu AI bị chặn, yêu cầu nó dừng với evidence, blocker và input tối thiểu cần con người cung cấp.

## 7. Checklist trước khi chấp nhận output AI

- [ ] Đúng feature, task, user story và requirement ID.
- [ ] Không sửa file hoặc behavior ngoài phạm vi.
- [ ] Không tự thay đổi contract/schema/dependency chưa được duyệt.
- [ ] Không lộ secret hoặc PII trong source, response, log, test fixture hay screenshot.
- [ ] Authorization được kiểm tra phía server.
- [ ] Tests kiểm tra happy path, failure path và quyền liên quan.
- [ ] Lệnh xác minh đã thực sự chạy và kết quả được ghi rõ.
- [ ] Diff không chứa file sinh tự động, debug code hoặc dữ liệu demo thật.
- [ ] Spec/plan/tasks/contract được cập nhật nếu hành vi hoặc quyết định thay đổi.
- [ ] Task chỉ được đánh dấu hoàn thành sau khi evidence tồn tại.
