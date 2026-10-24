# Tasks: Sprint 2 — Tutor Discovery

Date: 2026-10-20. Implementation started; see evidence.md for executed checks. Scope: S2-01–09,12–13. AI excluded. Sources: [spec](spec.md), [plan](plan.md), [model](data-model.md), [contract](contracts/README.md). Paths naming new files are planned; existing files must be reused after targeted inspection.

## Phase 1: Setup

Checkpoint: Tài liệu và baseline được kiểm tra; chưa thay hành vi sản phẩm. T001–T002 đạt sau T003; public eligibility regression đã xanh. Xem [evidence](evidence.md).

- [x] T001 Đối chiếu contract với client onboarding hiện tại và bổ sung kiểm tra tương thích vào backend/tests/TutorMatching.Api.IntegrationTests/Tutors/OnboardingContractTests.cs; đọc frontend/AGENTS.md và design system trước UI.
- [x] T002 Viết regression cho anonymous status override, detail chưa duyệt và account inactive tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/PublicEligibilityTests.cs.

## Phase 2: Foundational: catalog, persistence and public gate

Checkpoint: Các kiểm thử chức năng Phase 2 và migration riêng đã đạt; xem evidence.md. Các lỗi đăng ký/schema cũ và contract tổng đã xử lý ngày 2026-10-21; toàn bộ backend đạt 156/156 và database local cổng 5433 đã nâng cấp.

- [x] T003 Áp dụng shared public eligibility và bỏ status override tại backend/src/TutorMatching.Api/Controllers/TutorsController.cs; không trả rating giả hoặc certificate file URLs.
- [x] T004 Tạo fixture dữ liệu legacy/mixed states và catalog mapping tường minh tại backend/tests/TutorMatching.Api.IntegrationTests/Fixtures/TutorDiscoverySeed.cs.
- [x] T005 Chuẩn hóa TeachingLevel/TutorSubjectLevel, version UUID và search name trong backend/src/TutorMatching.Domain/Tutors/ và backend/src/TutorMatching.Domain/Catalog/ theo data-model.md; giữ nguyên dữ liệu cũ.
- [x] T006 Tạo EF mappings/migration và seed versioned tại backend/src/TutorMatching.Infrastructure/Persistence/; constraints weekday 1–7, giá/số buổi 1–2147483647; backfill theo research R4/R6, audit mọi downgrade visibility.
- [x] T007 Kiểm chứng migration, idempotent seed, counts và dữ liệu unmapped tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/DiscoveryMigrationTests.cs.
- [x] T008 Định nghĩa catalog ports/use cases tại backend/src/TutorMatching.Application/Catalog/ và adapters tại backend/src/TutorMatching.Infrastructure/Catalog/; chống trùng, ngừng dùng giữ lịch sử.
- [x] T009 Triển khai public reads/admin writes catalog tại backend/src/TutorMatching.Api/Controllers/CatalogController.cs và AdminCatalogController.cs; chỉ ADMIN được ghi; district thuộc đúng province.
- [x] T010 Xây giao diện quản lý danh mục và tests tại frontend/src/components/admin/catalog/ và frontend/tests/catalog.test.tsx; tái dùng primitives và API client.

## Phase 3: US1: Build a tutor profile

Checkpoint: Đạt ngày 2026-10-21; lưu draft, môn/lớp, submit, ownership, stale version và tái duyệt được kiểm chứng. Xem evidence.md.

- [x] T011 [US1] Viết ownership/submission/core-edit tests tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/TutorProfileTests.cs; active subject và level bắt buộc trên submit.
- [x] T012 [US1] Bổ sung draft/submit/version/core lifecycle tại backend/src/TutorMatching.Application/Tutors/ và backend/src/TutorMatching.Infrastructure/Tutors/TutorOnboardingService.cs; pending edit trả 409; giá theo buổi nguyên dương; không quy đổi hourly.
- [x] T013 [US1] Mở rộng tương thích request/response trong backend/src/TutorMatching.Api/Contracts/Tutors/TutorOnboardingContracts.cs và TutorOnboardingController.cs; derive owner từ claims, giữ CSRF.
- [x] T014 [US1] Cập nhật form môn/lớp, khu vực, modes và session price tại frontend/src/components/ và frontend/src/lib/api/tutor-onboarding.ts; test trong frontend/tests/tutor-profile.test.tsx.

## Phase 4: US2: Manage availability and courses

Checkpoint: Đạt ngày 2026-10-21; lịch sát biên/chồng lấn, race, ownership và soft-delete khóa học được kiểm chứng. Xem evidence.md.

- [x] T015 [US2] Viết schedule/capacity domain tests tại backend/tests/TutorMatching.Domain.UnitTests/Tutors/AvailabilityTests.cs và race/ownership tests tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/OfferTests.cs.
- [x] T016 [US2] Triển khai WEEKLY ISO weekday 1–7, timezone Asia/Ho_Chi_Minh, start<end, half-open và serialize slot writes tại backend/src/TutorMatching.Application/Tutors/ và backend/src/TutorMatching.Infrastructure/Tutors/; dated slots chỉ giữ lịch sử.
- [x] T017 [US2] Hoàn thiện Course ACTIVE/HIDDEN và soft-delete trong backend/src/TutorMatching.Domain/Courses/Course.cs; active course yêu cầu content, sessionCount và pricePerSessionVnd nguyên 1–2147483647; subject thuộc tutor và active.
- [x] T018 [US2] Triển khai owner availability/course APIs trong backend/src/TutorMatching.Api/Controllers/TutorOffersController.cs (gom hai nhóm endpoint owner, dùng chung authorization/error mapping) theo contracts/openapi.json.
- [x] T019 [US2] Tạo editor lịch/khóa học và test tại frontend/src/components/tutors/ và frontend/tests/tutor-offers.test.tsx; hiển thị field errors, loading và conflict.

## Phase 5: US3: Review tutor profiles

Checkpoint: Ba quyết định duyệt và race đều kiểm chứng độc lập với pending fixture.

- [x] T020 [US3] Viết review transition/role/concurrency tests tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/TutorReviewTests.cs; note bắt buộc khi yêu cầu sửa/từ chối.
- [x] T021 [US3] Triển khai admin review use cases tại backend/src/TutorMatching.Application/Tutors/ và transaction adapters tại backend/src/TutorMatching.Infrastructure/Tutors/; expectedVersion UUID, history/action/audit/Notification cùng transaction.
- [x] T022 [US3] Triển khai queue/detail/decision và owner review-history API trong backend/src/TutorMatching.Api/Controllers/AdminTutorReviewsController.cs và TutorReviewsController.cs; request changes về DRAFT, reject về REJECTED.
- [x] T023 [US3] Nối API vào frontend/src/app/(admin)/admin/tutor-approvals/page.tsx và trạng thái/lý do ở form tutor; kiểm tra conflict/empty/error tại frontend/tests/tutor-reviews.test.tsx.

## Phase 6: US4: Search for suitable tutors

Checkpoint: Fixture approved/active đủ để test mọi filter và pagination, không phụ thuộc admin UI.

- [x] T024 [US4] Viết filter/price/window/frequency/paging tests tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/TutorSearchTests.cs; cùng subject-level association, AND/OR và invalid partial schedule criteria.
- [x] T025 [US4] Triển khai matching giao/union theo ngày rồi sum floor(minutes/duration), duration 30–240 và frequency 1–21 tại backend/src/TutorMatching.Application/Tutors/; unit tests trong backend/tests/TutorMatching.Domain.UnitTests/Tutors/CapacityTests.cs.
- [x] T026 [US4] Tạo search ports và query adapters tại backend/src/TutorMatching.Application/Tutors/ và backend/src/TutorMatching.Infrastructure/Tutors/; SQL filters/count/page, name normalized, sort allowlist + UUID; không materialize toàn bộ.
- [x] T027 [US4] Cập nhật backend/src/TutorMatching.Api/Contracts/Tutors/TutorListContracts.cs và TutorsController.cs; page default 1, size default 20/max100, invalid query 400, no-store.
- [x] T028 [US4] Nối bộ lọc URL/reset/sort/page và empty/error/loading tại frontend/src/components/tutors/TutorsListClient.tsx và frontend/src/lib/api/tutors.ts; test frontend/tests/tutor-search.test.tsx.

## Phase 7: US5: View public tutor detail

Checkpoint: Mở detail fixture, sau đó mất eligibility phải unavailable; không có private fields.

- [x] T029 [US5] Viết public DTO allowlist và hidden/inactive detail tests tại backend/tests/TutorMatching.Api.IntegrationTests/Tutors/TutorDetailTests.cs.
- [x] T030 [US5] Triển khai detail projection/use case trong backend/src/TutorMatching.Application/Tutors/ và backend/src/TutorMatching.Infrastructure/Tutors/; cập nhật TutorsController.cs dùng profileId, kiểm tra link userId cũ để migrate rõ ràng.
- [x] T031 [US5] Nối detail vào frontend/src/components/tutors/ và frontend/src/lib/api/tutors.ts; tests tại frontend/tests/tutor-detail.test.tsx cho môn/lịch/course active, unavailable và privacy.

## Phase 8: Polish and cross-cutting verification

Checkpoint: Toàn bộ core journeys và mục tiêu hiệu năng có evidence; AI không nằm trong gate.

- [x] T032 Tạo corpus 10.000 hồ sơ giả và load runner tại backend/tests/performance/tutor-discovery/; đo p95≤3s với 100 users, ghi query plans và môi trường vào specs/002-tutor-discovery/evidence.md.
- [x] T033 Bổ sung E2E tutor→admin→search→detail, request changes/reject, account lock, keyboard/mobile tại frontend/tests/e2e/tutor-discovery.spec.ts; kiểm tra tests folder convention trước thêm file.
- [x] T034 Kiểm tra implemented OpenAPI với specs/002-tutor-discovery/contracts/openapi.json trong backend/tests/TutorMatching.Api.IntegrationTests/Tutors/DiscoveryContractTests.cs; sửa contract/client drift và preserve onboarding compatibility.
- [x] T035 Chạy quickstart.md và checks phù hợp, ghi outcomes thực tại specs/002-tutor-discovery/evidence.md; chạy consistency analysis/converge rồi cập nhật docs/agent-memory/SESSION.md.

## Dependencies and implementation strategy

Setup → Foundation → US1 → US2 → US3 → US4 → US5 → Polish is the default execution sequence. One task or phase at a time. First demo: US1 draft/submit using foundation catalog; final sprint acceptance requires all five stories.

US2/US3 can be independently verified with seeded profiles after foundation. US4 needs the matching logic from US2; US5 shares the public query adapter with US4. Do not parallelize shared controller, migration or onboarding edits.

Parallel opportunities if staffed: within each story, test specification and UI mock states may be prepared independently of backend implementation after contract freeze. US1 form tests vs Domain validation tests; US2 schedule tests vs course UI mock; US3 admin UI mock vs transaction tests; US4 search UI mock vs filter fixtures; US5 detail UI states vs privacy fixtures. No [P] execution markers are assigned because shared file ownership has not been separated.

For every task: run the narrow relevant test; record evidence before checking it off. Tests cover failing paths as well as success. Final phase includes solution checks, migration rehearsal and performance. No estimated dates or staffing assumptions.
