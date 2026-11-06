# Implementation Plan: Public Natural-Language Tutor Demand Matching, Redis Deduplication, Entity Extraction, Realtime SSE Delivery & 30-Day Retention

**Feature Branch**: `006-crawler-post-matching`
**Feature Directory**: `specs/006-crawler-post-matching`
**Status**: Ready for Tasks (TDD)

---

## 1. Technical Context

### Existing Stack & Libraries

- **Backend**: ASP.NET Core targeting .NET 10 (C# 13), Entity Framework Core 10 (`ApplicationDbContext`), Npgsql PostgreSQL 17, FluentValidation.
- **Cache & Realtime In-Memory**: `StackExchange.Redis` (thêm mới vào `backend/compose.yaml` và `TutorMatching.Infrastructure`) cho O(1) Content-Hash / SimHash Deduplication, Rate Limiting và Redis Pub/Sub cho SSE.
- **Extraction Engine**: Hybrid Rule-Based Regex + `VietnamLandmarkGazetteer` kết hợp LLM JSON Structured Output (`Gemini 3.8 Flash`) kèm Circuit Breaker fallback ($2.5\text{s}$ timeout).
- **Frontend**: Next.js 16.3.6, React 19, TypeScript, Tailwind CSS 4, TanStack Query v5, Native browser `EventSource` cho SSE stream ở Tutor Dashboard, và giao diện ô tìm kiếm/matching tự nhiên trên trang Public (`/tutors`).

### TDD Test Harness & Infrastructure

- **Backend Testing Framework**: xUnit, FluentAssertions, NSubstitute / Moq.
- **Integration Test Environment**: `Testcontainers.PostgreSql` (đã có) kết hợp `Testcontainers.Redis` để khởi tạo các container thật dùng một lần cho từng test run, đảm bảo không phụ thuộc vào state môi trường bên ngoài.
- **Frontend Testing**: Vitest 4 + `@testing-library/react` cho component và hook tests; Playwright cho E2E end-to-end user journeys.
- **TDD Workflow**: Mọi user story tuân thủ nghiêm ngặt chu trình **Red-Green-Refactor**:
  1. **Red**: Viết Unit / Integration / Contract test mô tả yêu cầu nghiệp vụ và các edge case; chạy và xác nhận test thất bại (Failing test).
  2. **Green**: Viết code triển khai tối thiểu để tất cả test chuyển sang màu xanh (Passing test).
  3. **Refactor**: Tối ưu hóa cấu trúc code, loại bỏ duplicate, cải thiện hiệu năng (Redis pipeline, batch size) mà không làm vỡ bất kỳ test nào.

### New Infrastructure Dependencies & Module Layout

- `redis:7.2-alpine` được bổ sung vào `backend/compose.yaml` (port `6379:6379`).
- NuGet package `StackExchange.Redis` cho `TutorMatching.Infrastructure`.
- Abstraction ports mới trong `TutorMatching.Application/Abstractions/`:
  - `IRedisDeduplicationService`: Lọc trùng O(1) qua Redis Content-Hash & SimHash, cache kết quả bóc tách.
  - `IExtractionService`: Trích xuất thực thể có cấu trúc từ câu yêu cầu tự nhiên của người dùng.
  - `IMatchingEngine`: Khớp nối hai chiều (1: Tìm Top `TutorProfile` `APPROVED` trả về ngay cho người dùng trên trang Public; 2: Khớp `TutorMatchingProfile` để tạo thông báo cho gia sư).
  - `ISseNotificationPublisher`: Phát tin realtime qua Redis Pub/Sub và đẩy xuống SSE Stream của gia sư (hoạt động độc lập song song với `EventsHub` SignalR hiện có).
  - `IDataRetentionService`: Dọn dẹp an toàn theo batch dữ liệu quá 30 ngày.
  - `ITextEmbeddingService`: Sinh vector embedding phục vụ xếp hạng tương đồng ngữ nghĩa (AI Search).

---

## 2. Constitution Check

- [x] **SRS Traceability**: Nâng cấp trải nghiệm khám phá gia sư trên trang Public (`002-tutor-discovery`) và kết nối nhu cầu thực tế tới gia sư, tuân thủ đầy đủ bất biến SRS: chỉ gia sư `APPROVED` thuộc tài khoản `ACTIVE` mới xuất hiện trong kết quả công khai.
- [x] **Security & Privacy**:
  - Kết quả gia sư trả về trên trang Public tuyệt đối không chứa email, SĐT, ngày sinh, địa chỉ chi tiết của gia sư.
  - SSE stream (`/api/v1/tutors/me/matched-posts/stream`) bảo vệ bằng cookie xác thực kép và yêu cầu role `TUTOR` với trạng thái `APPROVED`.
  - Toàn bộ dữ liệu yêu cầu tìm kiếm và thông báo match tự động bị hủy (Hard Delete) sau 30 ngày.
- [x] **Layered Boundaries**:
  - `Domain`: Chứa các entity thuần C# (`DemandPost`, `ExtractedDemandDetail`, `TutorMatchingProfile`, `PostMatchNotification`, `RetentionCleanupLog`), enum `PostStatus`.
  - `Application`: Định nghĩa port và use cases (`SubmitPublicTutorDemandHandler`, `MatchingEngine`).
  - `Infrastructure`: Triển khai theo đúng cấu trúc module (`Infrastructure/Storage/`, `Infrastructure/Extraction/`, `Infrastructure/Retention/`, `Infrastructure/Persistence/Configurations/`), đăng ký DbSet vào `ApplicationDbContext`.
  - `Api`: Expose `PublicTutorDemandsController`, `TutorMatchedPostsSseController`, `TutorMatchingProfileController`, `AdminDemandsController`.
- [x] **Evidence-First**: Từng User Story có kịch bản test TDD độc lập và verification checkpoint rõ ràng trong `quickstart.md`.
- [x] **MVP Simplicity**: Không phụ thuộc vào trình duyệt cào bên thứ ba hay tài khoản mạng xã hội; luồng dữ liệu khép kín hoàn toàn trong nền tảng TutorMatching.

---

## 3. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph PublicUI ["1. Giao diện Public (Next.js /tutors)"]
        USER["Người dùng nhập yêu cầu tự nhiên\n(VD: 'Tìm gia sư Toán lớp 9 ở Cầu Giấy 250k/buổi')"]
        RESULT_UI["Hiển thị ngay:\n- Thẻ tiêu chí đã nhận diện (Môn, Lớp, Giá, Quận)\n- Danh sách Top Gia sư phù hợp nhất"]
    end

    subgraph IngestionDedup ["2. Tiếp nhận & Lọc trùng (Redis + PostgreSQL)"]
        API_PUB["POST /api/v1/public/tutor-demands/match"]
        RD[("Redis: Content-Hash, SimHash & Rate Limit")]
        PG_RAW[("PostgreSQL: demand_posts")]
        USER -->|Gửi queryText| API_PUB
        API_PUB -->|1. Check Hash & Cache < 10ms| RD
        API_PUB -->|2. Lưu yêu cầu gốc (TTL 30d)| PG_RAW
    end

    subgraph ExtractionLayer ["3. Bóc tách Thực thể (Hybrid Extraction Engine)"]
        EXT["Hybrid Extractor:\nRegex Fast Path + LLM Structured JSON\n(Circuit Breaker 2.5s Fallback)"]
        LOC["Vietnam Landmark Gazetteer & Fuzzy District Resolver"]
        PG_EXT[("PostgreSQL: extracted_demand_details\n(Lưu JSON chuẩn hóa & Vector Embedding)")]
        API_PUB -->|3. Bóc tách thực thể| EXT
        EXT <--> LOC
        EXT -->|4. Lưu chi tiết chuẩn hóa| PG_EXT
    end

    subgraph DualMatchingLayer ["4. Khớp nối Hai chiều (Dual Matching Engine)"]
        ME["Matching Engine"]
        TP[("PostgreSQL: tutor_profile\n(APPROVED + ACTIVE account)")]
        TMP[("PostgreSQL: tutor_matching_profiles")]
        NOTIF[("PostgreSQL: post_match_notifications")]
        REDIS_PUB[("Redis Pub/Sub Channel\ntutor:notifications:{tutor_id}")]
        PG_EXT --> ME
        ME <-->|Chiều 1: Tìm Top Gia sư phù hợp| TP
        ME -->|Trả danh sách gia sư ngay (< 2.5s)| RESULT_UI
        ME <-->|Chiều 2: Đối chiếu tiêu chí nhận lớp| TMP
        ME -->|Lưu thông báo| NOTIF
        ME -->|Publish sự kiện match| REDIS_PUB
    end

    subgraph DeliveryLayer ["5. SSE Realtime Delivery cho Gia sư"]
        SSE["GET /api/v1/tutors/me/matched-posts/stream"]
        TUTOR_UI["Tutor Dashboard:\n- Toast Notification nổi\n- Feed 'Yêu cầu học mới phù hợp'"]
        REDIS_PUB -->|Listen Channel| SSE
        SSE -->|Push event: post_matched (< 2s)| TUTOR_UI
    end

    subgraph RetentionLayer ["6. Dọn dẹp Tự động 30 ngày (Data Retention)"]
        RW["Retention Cleanup Worker\n(02:00 AM UTC+7 hàng ngày)"]
        LOG[("PostgreSQL: retention_cleanup_logs")]
        RW -->|Batch Delete 1.000 dòng > 30 ngày| PG_RAW
        PG_RAW -.->|ON DELETE CASCADE| PG_EXT
        PG_EXT -.->|ON DELETE CASCADE| NOTIF
        RW -->|Ghi nhật ký kiểm toán| LOG
    end
```

### Chi tiết luồng dữ liệu tuần tự (Step-by-step Execution Flow):

1. **Người dùng gửi yêu cầu (Submit)**: Người dùng tại trang Public nhập câu yêu cầu tự nhiên vào ô tìm kiếm thông minh và gửi `POST /api/v1/public/tutor-demands/match`.
2. **Lọc trùng & Chống spam tức thì (Redis Deduplication)**:
   - Chuẩn hóa văn bản và tính `content_hash = SHA256(normalized_text)`.
   - Kiểm tra Redis `demand:seen:{actor_fingerprint}:{content_hash}`. Nếu đã tồn tại, trả về ngay kết quả bóc tách và danh sách gia sư đã cache trong $< 10\text{ms}$ (`isDeduplicatedHit = true`).
   - Nếu mới: lưu bản ghi vào bảng `demand_posts` với trạng thái `PENDING` và hạn `expires_at = NOW() + 30 days`.
3. **Bóc tách thực thể & Chuẩn hóa địa danh (Extraction)**:
   - Chạy `RegexEntityExtractor` + `VietnamLandmarkGazetteer` kết hợp `LlmEntityExtractor` (có timeout $2.5\text{s}$ fallback về Regex + Gazetteer).
   - Phân giải địa chỉ: Nếu gặp địa danh (ĐH Bách Khoa, Keangnam...) $\rightarrow$ ánh xạ ra `province_code` và `district_code`. Nếu không rõ Quận/Huyện $\rightarrow$ gán `district_code = NULL`, `is_location_ambiguous = true`.
   - Lưu vào `extracted_demand_details` và cập nhật `demand_posts.status = 'EXTRACTED'`.
4. **Khớp nối hai chiều (Dual Matching)**:
   - **Chiều 1 (Trả kết quả ngay cho Người dùng trên trang Public)**: `MatchingEngine` tìm các `TutorProfile` đang `APPROVED` (tài khoản `ACTIVE`), chấm điểm tương thích (`matchScore`) theo môn, lớp, khu vực, học phí và trả về danh sách `matchedTutors` kèm `extractedCriteria` trong phản hồi HTTP.
   - **Chiều 2 (Thông báo Realtime cho Gia sư)**: `MatchingEngine` so khớp với `tutor_matching_profiles` đang active, lưu `post_match_notifications` và bắn sự kiện vào Redis Channel `tutor:notifications:{tutor_profile_id}`.
5. **Đẩy Realtime qua SSE**:
   - Gia sư đang mở Dashboard duy trì kết nối `GET /api/v1/tutors/me/matched-posts/stream`.
   - Nhận ngay sự kiện `event: post_matched` trong $< 2\text{s}$, hiển thị Toast và cập nhật feed yêu cầu mới.
6. **Dọn dẹp tự động 30 ngày (Retention)**:
   - `RetentionCleanupWorker` chạy lúc 02:00 sáng hàng ngày, xóa phân lô (`LIMIT 1000`, pause `100ms`) các bản ghi `demand_posts` quá hạn 30 ngày (cascade xóa sạch `extracted_demand_details` và `post_match_notifications`), ghi log vào `retention_cleanup_logs`.

---

## 4. Technical Risk Mitigation Strategies

### 4.1 Rủi ro: Spam Request, Prompt Injection hoặc LLM API Chậm/Timeout trên trang Public

- **Nguyên nhân**: Vì tính năng đặt ở trang Public cho phép nhập văn bản tự do, người dùng có thể bấm gửi liên tục, nhập văn bản rác, hoặc dịch vụ LLM bên ngoài bị quá tải/timeout.
- **Giải pháp dự phòng (Mitigation)**:
  1. _Redis Deduplication & Caching_: Mọi câu yêu cầu trùng `content_hash` đều được trả ngay từ Redis trong $< 10\text{ms}$ mà không gọi lại LLM.
  2. _Sliding-Window Rate Limiting_: Giới hạn tần suất gửi yêu cầu theo IP/User qua Redis.
  3. _Fast Pre-filter & Prompt Sanitization_: Kiểm tra độ dài ($10 \rightarrow 2000$ ký tự), tách biệt hoàn toàn chuỗi người dùng nhập trong khối dữ liệu của System Prompt để chống Prompt Injection.
  4. _Circuit Breaker 2.5s Fallback về Regex + Gazetteer_: `RegexEntityExtractor` và `VietnamLandmarkGazetteer` luôn chạy trước trong bộ nhớ ($< 15\text{ms}$). Nếu LLM API phản hồi quá $2.5\text{s}$ hoặc lỗi, hệ thống lập tức dùng kết quả của Regex + Gazetteer để matching và trả về danh sách gia sư ngay, đảm bảo SLA phản hồi $< 2.5\text{s}$ 100% thời gian.

### 4.2 Rủi ro: Địa chỉ yêu cầu không xác định được Quận/Huyện

- **Nguyên nhân**: Người dùng chỉ ghi tên địa danh dân gian (ví dụ: _"chợ Phùng Khoang"_, _"khu đô thị Ciputra"_, _"ngã tư Sở"_, _"gần ĐH Bách Khoa"_) hoặc chỉ ghi chung chung _"ở Hà Nội"_.
- **Giải pháp dự phòng (Mitigation)**:
  1. _Từ điển Landmark / POI (`VietnamLandmarkGazetteer`)_: Ánh xạ sẵn các địa danh phổ biến (trường đại học, khu đô thị, bến xe, ngã tư lớn) về đúng `province_code` và `district_code` trong DB.
  2. _Fuzzy String Matching_: So khớp mờ với bảng `districts` và `provinces` hiện có.
  3. _Fallback & Ambiguity Flag (`is_location_ambiguous = true`)_:
     - Nếu chỉ xác định được Tỉnh/Thành mà không rõ Quận/Huyện: lưu `district_code = NULL`, `is_location_ambiguous = true`, giữ nguyên `raw_address`.
     - Trong `MatchingEngine`: vẫn khớp với các gia sư dạy `ONLINE` hoặc có `receive_all_districts = true` trong cùng Tỉnh/Thành.
     - Trên giao diện Public & Tutor Dashboard: hiển thị badge thông báo `[Địa chỉ: Khu vực cần xác nhận Quận/Huyện]` để người dùng có thể chọn rõ Quận/Huyện hoặc gia sư dễ dàng nắm bắt.

---

## 5. AI Applied Architecture (Hybrid SQL + Vector Similarity Search)

1. **Chuẩn hóa trường ngữ nghĩa (Taxonomy Mapping)**:
   - Mọi yêu cầu tự nhiên đều được ánh xạ về danh mục chuẩn của hệ thống (`subjects`, `grade_level`, `tuition_fee_vnd`, `provinces`, `districts`).
2. **Vector Embedding & Hybrid Ranking**:
   - Cột `embedding` trong `extracted_demand_details` cùng interface `ITextEmbeddingService` hỗ trợ kết hợp lọc điều kiện cứng (SQL Filter) và xếp hạng tương đồng ngữ nghĩa (Vector Cosine Similarity) với hồ sơ gia sư.
