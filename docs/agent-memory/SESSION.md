# Current Session Handoff

Status: TUTOR ONBOARDING & PHONE DUPLICATION HANDLING COMPLETE
Updated: 2026-10-15

## Completed scope

- **Xử lý triệt để lỗi trùng số điện thoại (`ux_user_accounts_phone_number`) khi Onboarding**:
  - `TutorOnboardingService.cs`: Bổ sung kiểm tra trùng số điện thoại (`AnyAsync(u => u.Id != userId && u.PhoneNumber == trimmedPhone)`) trước khi lưu và bắt ngoại lệ `DbUpdateException` (`IsPhoneNumberUniqueViolation`), trả về `SaveDraftResult.Fail(AccountFailure.DuplicatePhoneNumber)`.
  - `TutorOnboardingController.cs`: Cập nhật `PUT /api/v1/tutor/onboarding/draft` xử lý `SaveDraftResult`, trả về mã lỗi chuẩn `409 Conflict ProblemDetails` kèm thông tin field `phoneNumber`.
  - `TutorOnboardingWizard.tsx`: Bắt lỗi `ApiError` từ backend khi lưu nháp/chuyển bước, hiển thị lỗi trực tiếp lên input số điện thoại ở Bước 1 và ngăn chặn crash/500 lỗi hệ thống.
- **Khóa hoàn toàn route authenticated đối với Gia sư chưa duyệt**:
  - Duy trì bảo vệ nghiêm ngặt qua `TutorGuard`, `LoginCard`, `GuestGuard`, `HomeClientView`, `SiteShell`.

## Verification

- `dotnet build backend/TutorMatching.slnx`: Succeeded (0 warnings, 0 errors).
- `dotnet test backend/TutorMatching.slnx`: 93 passed (75 integration tests, 18 unit tests), 0 failed.
- `npm --prefix frontend test -- --run`: 17 test files passed (148 tests), 0 failed.
- `npm --prefix frontend run lint`: 0 errors, 0 warnings.
- `npm --prefix frontend run build`: Compiled successfully without errors.
