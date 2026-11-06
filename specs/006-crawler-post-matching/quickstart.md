# Quickstart & Verification Guide: 006-crawler-post-matching (TDD Workflow)

Tài liệu hướng dẫn thiết lập môi trường, thực thi chu trình TDD (Red-Green-Refactor) và kiểm chứng độc lập từng User Story cho luồng: **Người dùng nhập yêu cầu tự nhiên ở trang Public $\rightarrow$ Lọc trùng Redis $\rightarrow$ Bóc tách JSON $\rightarrow$ Khớp nối gia sư hai chiều (Trả kết quả ngay + Bắn SSE Realtime) $\rightarrow$ Tự động dọn dẹp sau 30 ngày**.

---

## 1. Prerequisites & Environment Setup

1. **Khởi động Docker Services (PostgreSQL + Redis + Mailpit)**:
   - Đảm bảo file `backend/compose.yaml` đã chứa dịch vụ Redis.
   - Khởi động cụm dịch vụ:
     ```bash
     docker compose --env-file backend/.env -f backend/compose.yaml up -d --wait
     ```
   - Kiểm tra Redis hoạt động:
     ```bash
     docker exec -it tutormatching-redis-1 redis-cli ping
     # Kết quả mong đợi: PONG
     ```

2. **Áp dụng Database Migration**:
   - Chạy công cụ migration để tạo các bảng mới (`demand_posts`, `extracted_demand_details`, `tutor_matching_profiles`, `post_match_notifications`, `retention_cleanup_logs`):
     ```bash
     dotnet run --project backend/tools/TutorMatching.DatabaseMigrator
     ```

---

## 2. TDD Execution Commands (Red - Green - Refactor)

Mỗi User Story bắt buộc phải chạy bộ test tương ứng trước khi implement để xác nhận trạng thái **RED**, sau đó chạy lại để xác nhận trạng thái **GREEN**.

### 2.1 Foundational Phase Tests

```bash
# Chạy Unit Tests kiểm tra Domain Invariants (DemandPost, ExtractedDemandDetail, TutorMatchingProfile)
dotnet test backend/tests/TutorMatching.Domain.UnitTests/TutorMatching.Domain.UnitTests.csproj \
  --filter "FullyQualifiedName~Content|FullyQualifiedName~Tutors"

# Chạy Integration Tests kiểm tra Migration & Ràng buộc vật lý Database
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj \
  --filter "FullyQualifiedName~DemandMatchingMigrationTests"
```

### 2.2 User Story 1 Tests (Public Demand Ingestion & Redis Deduplication)

```bash
# Unit test chuẩn hóa nội dung & lọc trùng Redis / SimHash
dotnet test backend/tests/TutorMatching.Application.UnitTests/TutorMatching.Application.UnitTests.csproj \
  --filter "FullyQualifiedName~RedisDeduplicationServiceTests|FullyQualifiedName~ContentHashNormalizerTests"

# Integration test tiếp nhận yêu cầu từ trang Public và kiểm tra deduplication hit
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj \
  --filter "FullyQualifiedName~PublicDemandIngestionTests"
```

### 2.3 User Story 2 Tests (Extraction Service & Landmark Gazetteer)

```bash
# Unit test Regex bóc tách Môn, Lớp, Học phí, Số buổi
dotnet test backend/tests/TutorMatching.Application.UnitTests/TutorMatching.Application.UnitTests.csproj \
  --filter "FullyQualifiedName~RegexEntityExtractorTests"

# Unit test từ điển Landmark Gazetteer, giải quyết địa chỉ mơ hồ & Hybrid Fallback 2.5s
dotnet test backend/tests/TutorMatching.Application.UnitTests/TutorMatching.Application.UnitTests.csproj \
  --filter "FullyQualifiedName~VietnamLandmarkGazetteerTests|FullyQualifiedName~AddressResolutionServiceTests|FullyQualifiedName~HybridExtractionServiceTests"
```

### 2.4 User Story 3 Tests (Dual Matching & Realtime SSE)

```bash
# Unit test thuật toán Matching Engine hai chiều
dotnet test backend/tests/TutorMatching.Application.UnitTests/TutorMatching.Application.UnitTests.csproj \
  --filter "FullyQualifiedName~MatchingEngineTests"

# Integration test Public Demand Match API & SSE Streaming + Last-Event-ID replay
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj \
  --filter "FullyQualifiedName~PublicTutorDemandMatchApiTests|FullyQualifiedName~TutorMatchedPostsSseTests|FullyQualifiedName~TutorMatchingProfileApiTests"

# Frontend Unit & Component Tests (Vitest)
npm --prefix frontend run test -- frontend/tests/components/PublicSmartDemandSearch.test.tsx
npm --prefix frontend run test -- frontend/tests/hooks/usePostMatchStream.test.ts
npm --prefix frontend run test -- frontend/tests/components/TutorLiveMatchedPostsFeed.test.tsx
```

### 2.5 User Story 4 Tests (30-Day Retention Cleanup)

```bash
# Unit test dọn dẹp phân lô (Batched deletion)
dotnet test backend/tests/TutorMatching.Application.UnitTests/TutorMatching.Application.UnitTests.csproj \
  --filter "FullyQualifiedName~DataRetentionServiceTests"

# Integration test worker dọn dẹp & audit log
dotnet test backend/tests/TutorMatching.Api.IntegrationTests/TutorMatching.Api.IntegrationTests.csproj \
  --filter "FullyQualifiedName~RetentionCleanupIntegrationTests|FullyQualifiedName~AdminRetentionApiTests"
```

### 2.6 Full Suite Verification

```bash
# Chạy toàn bộ test backend
dotnet test backend/TutorMatching.slnx

# Chạy toàn bộ test frontend
npm --prefix frontend run test
```

---

## 3. End-to-End User Journey Simulation

1. **Khởi động Backend & Frontend**:
   - Backend: `dotnet run --project backend/src/TutorMatching.Api`
   - Frontend: `npm --prefix frontend run dev`
2. **Mở kết nối SSE Realtime cho Gia sư qua cURL (hoặc trên Tutor Dashboard)**:
   ```bash
   curl -N -H "Accept: text/event-stream" \
        -H "Cookie: accessToken=<VALID_TUTOR_JWT>" \
        http://localhost:5000/api/v1/tutors/me/matched-posts/stream
   ```
3. **Người dùng gửi yêu cầu tìm gia sư trên trang Public**:
   ```bash
   curl -X POST http://localhost:5000/api/v1/public/tutor-demands/match \
        -H "Content-Type: application/json" \
        -d '{"queryText": "Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 gần ĐH Bách Khoa, học phí 250k/buổi tuần 2 buổi"}'
   ```

   - **Kết quả 1 (Trả về ngay cho người dùng Public)**: Nhận JSON chứa `extractedCriteria` (`subjectName: "Toán"`, `gradeLevel: 9`, `tuitionFeeVnd: 250000`, `districtName: "Hai Bà Trưng"`) và mảng `matchedTutors` đã xếp hạng theo `matchScore`.
   - **Kết quả 2 (Đẩy SSE Realtime cho Gia sư)**: Kết nối SSE ở bước 2 nhận ngay sự kiện `event: post_matched` trong vòng $< 2$ giây.
