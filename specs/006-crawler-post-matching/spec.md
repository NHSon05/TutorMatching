# Feature Specification: Public Natural-Language Tutor Demand Matching, Redis Deduplication, Entity Extraction, Realtime SSE Delivery & 30-Day Retention

**Feature Branch**: `006-crawler-post-matching`
**Created**: 2026-11-04
**Updated**: 2026-11-06
**Status**: Ready for Implementation (TDD)
**Input**: Thay đổi luồng: Bỏ phần cào Facebook, tập trung vào luồng người dùng nhập yêu cầu tìm gia sư bằng ngôn ngữ tự nhiên ở trang Public -> Lọc trùng/chống spam qua Redis -> Bóc tách cấu trúc dữ liệu JSON (môn, lớp, tiền, địa điểm) -> Vừa hiển thị ngay Top gia sư phù hợp trên màn hình cho người dùng, vừa lưu yêu cầu (30 ngày) và bắn thông báo SSE realtime cho các gia sư khớp tiêu chí -> Tự động dọn dẹp sau 30 ngày.

---

## 1. Executive Summary & Sprint Scope

Sprint 6 xây dựng hệ thống **Tìm kiếm & Khớp nối Gia sư Thông minh hai chiều (Dual-Direction Smart Tutor Matching)** ngay từ trang Public theo chu trình khép kín:

1. **Tiếp nhận Yêu cầu Tự nhiên & Lọc trùng qua Redis (Public Demand Ingestion & Redis Deduplication)**: Người dùng ở trang Public nhập yêu cầu tìm gia sư bằng văn bản tự nhiên (ví dụ: _"Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi"_). Hệ thống kiểm tra trùng lặp và chống spam tức thì qua Redis (Content Hash / SimHash + Rate Limit) trong $< 10\text{ms}$ trước khi lưu trữ.
2. **Bóc tách Thực thể Thông minh (Entity Extraction Service)**: Chuyển đổi văn bản yêu cầu phi cấu trúc (tiếng Việt tự do, viết tắt, địa danh dân gian) thành dữ liệu JSON chuẩn hóa (môn học, khối lớp, mức học phí/buổi, hình thức học, tỉnh/thành, quận/huyện, lịch học dự kiến).
3. **Khớp nối Hai chiều & Thông báo Thời gian thực (Dual Matching & SSE Delivery)**:
   - **Chiều cho Người dùng (Synchronous trên trang Public)**: Đối sánh dữ liệu vừa bóc tách với các hồ sơ gia sư `APPROVED` (tài khoản `ACTIVE`) và hiển thị ngay danh sách **Top Gia sư phù hợp nhất** kèm điểm tương thích (`matchScore`).
   - **Chiều cho Gia sư (Asynchronous qua SSE Stream)**: Lưu yêu cầu có hiệu lực 30 ngày, đối sánh với cấu hình nhận lớp của gia sư (`tutor_matching_profiles`) và đẩy thông báo tức thì qua **Server-Sent Events (SSE)** đến giao diện Dashboard của các gia sư phù hợp.
4. **Quản trị Vòng đời Dữ liệu (30-Day Data Retention)**: Tự động quét và xóa phân lô (batch deletion) các yêu cầu, dữ liệu bóc tách và thông báo đã quá hạn 30 ngày vào khung giờ thấp điểm (02:00 AM UTC+7) để giải phóng dung lượng đĩa và tối ưu hiệu năng DB.
5. **Nền tảng AI Applied (Hybrid & Vector Search Ready)**: Lưu trữ cấu trúc dữ liệu chuẩn hóa kết hợp cột vector `embedding`, sẵn sàng cho tìm kiếm ngữ nghĩa chuyên sâu (RAG / Vector Similarity).

### Tiêu chuẩn kỹ thuật TDD (Test-Driven Development)

Toàn bộ quá trình thực hiện Sprint tuân thủ triệt để phương pháp **Test-Driven Development (TDD)** theo chu trình **Red $\rightarrow$ Green $\rightarrow$ Refactor**:

- **Pha Red**: Mỗi User Story bắt buộc phải viết toàn bộ các kiểm thử (Unit Test cho Domain Invariants, Unit Test cho Services/Extractors, Integration Test với Testcontainers, Contract Test API và Vitest Component/Hook Test trên Frontend) **trước khi viết code thực thi**. Các bài test này phải được chạy và xác nhận thất bại với lý do chính đáng.
- **Pha Green**: Lập trình viên chỉ viết lượng mã nguồn tối thiểu (Entities, Handlers, Controllers, Adapters) để các bài test chuyển sang màu xanh (Pass).
- **Pha Refactor**: Chuẩn hóa, làm sạch mã nguồn, tối ưu hóa hiệu năng (Redis pipeline, batch size, cancellation tokens) trong khi đảm bảo 100% test vẫn duy trì trạng thái xanh. Không task nào được đánh dấu hoàn thành nếu thiếu bằng chứng kiểm thử tự động.

---

## 2. User Scenarios & Testing (Sprint Backlog Stories)

### User Story 1 - Tiếp nhận yêu cầu từ trang Public và lọc trùng qua Redis (Public Ingestion & Deduplication) (Priority: P1) 🎯 MVP

**Mô tả**: Là hệ thống tiếp nhận trên trang Public, khi người dùng gửi một yêu cầu tìm gia sư bằng văn bản tự nhiên, tôi cần kiểm tra lọc trùng và chống spam qua Redis trước khi lưu trữ để không xử lý lặp lại cùng một yêu cầu nhiều lần và bảo vệ tài nguyên hệ thống.

**Tại sao ưu tiên P1**: Đây là điểm chạm đầu vào của toàn bộ luồng nghiệp vụ. Đảm bảo dữ liệu đầu vào sạch, không bị trùng lặp do bấm đúp (double-submit) hoặc spam request.

**Independent Test**:

- Gửi 20 request yêu cầu tìm gia sư từ trang Public (trong đó có 5 request trùng hệt mã định danh/fingerprint do bấm đúp và 3 request có nội dung tương đương trong cùng phiên), hệ thống nhận diện chính xác các request duy nhất, trả về kết quả đã cache cho các request trùng lặp qua Redis trong $< 10\text{ms}$ mà không tạo bản ghi thừa trong database.

**Acceptance Scenarios**:

1. **Given** người dùng trên trang Public nhập yêu cầu mới có `content_hash` chưa tồn tại trong Redis Deduplication Filter, **When** gửi request lên hệ thống, **Then** hệ thống lưu yêu cầu gốc vào bảng `demand_posts` với trạng thái `PENDING`, lưu khóa lọc trùng vào Redis (`demand:seen:{actor_fingerprint}:{content_hash}`) và chuyển tiếp ngay sang bước bóc tách thực thể.
2. **Given** người dùng bấm gửi lặp lại cùng một nội dung yêu cầu trong khoảng thời gian ngắn, **When** khóa `content_hash` của phiên đó đã tồn tại trong Redis, **Then** hệ thống trả về ngay kết quả của yêu cầu đã tạo trước đó trong $< 10\text{ms}$ mà không gọi lại bộ bóc tách LLM hay ghi trùng vào DB.
3. **Given** một nội dung đăng tìm gia sư trùng lặp với một bài đăng còn hiệu lực của cùng người dùng trong vòng 48 giờ (kiểm tra qua SimHash), **When** hệ thống đối chiếu SimHash trên Redis, **Then** hệ thống đánh dấu trạng thái `DUPLICATE` và tái sử dụng bản ghi hiện có thay vì phát lại thông báo SSE trùng lặp cho gia sư.

---

### User Story 2 - Bóc tách thực thể và chuẩn hóa dữ liệu từ yêu cầu tự nhiên (Extraction Service) (Priority: P2)

**Mô tả**: Là dịch vụ xử lý ngôn ngữ (Extraction Service), tôi cần nhận đoạn văn bản yêu cầu tự do của người dùng và chuyển đổi thành dạng JSON có cấu trúc gồm: môn học, khối lớp, mức học phí/buổi, hình thức học (`ONLINE`/`OFFLINE`/`HYBRID`), địa điểm (Tỉnh/Thành, Quận/Huyện) và số buổi/tuần.

**Tại sao ưu tiên P2**: Người dùng ở trang Public nhập yêu cầu theo văn phong tự nhiên hoặc viết tắt (ví dụ: _"Tìm gs Toán 12 Cầu Giấy 250k/b"_). Bóc tách chuẩn hóa là điều kiện tiên quyết để hệ thống hiểu đúng nhu cầu và so khớp với hồ sơ gia sư.

**Independent Test**:

- Gửi 10 mẫu câu yêu cầu tìm gia sư với văn phong đa dạng vào `ExtractionService`, hệ thống trích xuất thành công ít nhất 90% các trường: Môn học (`subject_id`), Khối lớp (`grade_level`), Học phí (`tuition_fee_vnd`), Tỉnh/Thành phố (`province_code`), Quận/Huyện (`district_code`) và ghi vào bảng `extracted_demand_details`.

**Acceptance Scenarios**:

1. **Given** người dùng nhập yêu cầu `"Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 tại Quận Cầu Giấy, học phí 250k/buổi tuần 2 buổi"`, **When** `ExtractionService` xử lý, **Then** kết quả trích xuất gồm: `subject = "Toán"`, `grade_level = 9`, `tuition_fee_vnd = 250000`, `province = "Hà Nội"`, `district = "Cầu Giấy"`, `sessions_per_week = 2`, trạng thái bài chuyển thành `EXTRACTED` với `confidence_score >= 0.85`.
2. **Given** người dùng chỉ nhập địa chỉ theo địa danh quen thuộc `"Dạy tại nhà khu vực gần trường ĐH Bách Khoa"`, **When** `AddressResolutionService` phân tích địa danh qua từ điển Landmark Gazetteer, **Then** hệ thống ánh xạ chính xác sang `province = "Hà Nội"`, `district = "Hai Bà Trưng"`. Nếu chỉ ghi `"ở Hà Nội"` không rõ quận, hệ thống gán `district_code = NULL` và đánh dấu `is_location_ambiguous = true`.
3. **Given** người dùng nhập nội dung vô nghĩa hoặc không liên quan đến tìm gia sư (ví dụ: `"abc xyz test 123"`), **When** `ExtractionService` phát hiện `confidence_score < 0.40` và không có môn học/khối lớp, **Then** bản ghi được gắn trạng thái `REJECTED` và trả về thông báo hướng dẫn người dùng nhập rõ môn học/khối lớp cần tìm.

---

### User Story 3 - Khớp nối Gia sư trên trang Public & Thông báo SSE Thời gian thực (Dual Matching & SSE Delivery) (Priority: P3)

**Mô tả**:

- **Với Người dùng ở trang Public**: Tôi muốn nhìn thấy ngay danh sách các gia sư phù hợp nhất với yêu cầu vừa nhập (kèm các thẻ tiêu chí đã nhận diện được) để có thể xem hồ sơ và gửi yêu cầu thuê ngay.
- **Với Gia sư**: Tôi muốn nhận được thông báo ngay lập tức trên giao diện làm việc (Dashboard) qua kết nối Server-Sent Events (SSE) khi có người dùng vừa đăng yêu cầu phù hợp với cấu hình nhận lớp của tôi.

**Tại sao ưu tiên P3**: Kết nối trực tiếp cung và cầu theo thời gian thực: người học tìm được gia sư ngay lập tức, còn gia sư nhận được thông báo cơ hội lớp dạy mới trong vòng dưới 2 giây.

**Independent Test**:

- Thiết lập Gia sư A (`APPROVED`, tài khoản `ACTIVE`) có hồ sơ và `TutorMatchingProfile`: Môn Toán, Lớp 9–12, Quận Cầu Giấy, học phí từ 200.000 VNĐ. Khi người dùng trên trang Public nhập yêu cầu _"Tìm gia sư Toán lớp 9 ở Cầu Giấy 250k/buổi"_:
  1. Phản hồi HTTP trên trang Public trả về danh sách có chứa Gia sư A kèm `matchScore` và các tag tiêu chí đã bóc tách.
  2. Kết nối SSE của Gia sư A nhận được sự kiện `event: post_matched` trong vòng $< 2$ giây.

**Acceptance Scenarios**:

1. **Given** người dùng nhập yêu cầu hợp lệ trên trang Public, **When** quá trình bóc tách hoàn tất, **Then** `MatchingEngine` truy vấn các hồ sơ gia sư `APPROVED` (thuộc tài khoản `ACTIVE`), chấm điểm tương thích và trả về danh sách Top gia sư phù hợp ngay trên giao diện Public (không làm lộ email, SĐT, ngày sinh hay địa chỉ chi tiết của gia sư theo đúng quy tắc bảo mật SRS).
2. **Given** Gia sư B đang mở Dashboard và kết nối tới kênh SSE `/api/v1/tutors/me/matched-posts/stream`, **When** có yêu cầu mới từ trang Public khớp với `TutorMatchingProfile` của Gia sư B, **Then** máy chủ tạo bản ghi `post_match_notifications` và đẩy sự kiện `event: post_matched` qua SSE; giao diện Gia sư B hiển thị thông báo Toast nổi và cập nhật danh sách "Yêu cầu tìm gia sư mới phù hợp" mà không cần tải lại trang.
3. **Given** Gia sư bị ngắt kết nối mạng tạm thời và tự động kết nối lại SSE kèm header `Last-Event-ID`, **When** kết nối được thiết lập lại, **Then** hệ thống tự động phát bù các thông báo khớp trong 15 phút gần nhất mà gia sư chưa nhận được.

---

### User Story 4 - Tự động dọn dẹp và thu hồi dữ liệu quá hạn (30-Day Data Retention) (Priority: P4)

**Mô tả**: Là quản trị viên hệ thống (System Administrator), tôi muốn các yêu cầu tìm gia sư trên trang Public, dữ liệu bóc tách và thông báo match cũ hơn 30 ngày tự động được dọn dẹp định kỳ vào khung giờ thấp điểm để giải phóng dung lượng đĩa và tối ưu hiệu năng database.

**Tại sao ưu tiên P4**: Yêu cầu tìm gia sư sau 30 ngày đã hết tính thời sự. Tự động dọn dẹp giúp bảo vệ dung lượng lưu trữ và giữ cho các bảng tìm kiếm/thông báo luôn nhẹ, nhanh.

**Independent Test**:

- Chèn vào database 100 bản ghi yêu cầu và thông báo có `created_at` cách đây 35 ngày và 50 bản ghi cách đây 10 ngày. Kích hoạt `RetentionCleanupWorker`. Kết quả: 100 bản ghi cũ bị xóa hoàn toàn theo lô (batch deletion), 50 bản ghi mới được giữ nguyên, và bảng `retention_cleanup_logs` ghi nhận chính xác số lượng bản ghi đã xóa.

**Acceptance Scenarios**:

1. **Given** lịch chạy tự động định kỳ vào 02:00 sáng hàng ngày (UTC+7), **When** `RetentionCleanupWorker` được kích hoạt, **Then** worker xóa các bản ghi trong `demand_posts`, `extracted_demand_details` và `post_match_notifications` có `created_at < NOW() - INTERVAL '30 days'`.
2. **Given** số lượng bản ghi quá hạn lớn, **When** worker thực thi dọn dẹp, **Then** quá trình xóa được chia thành từng lô (`batch size = 1000` dòng) kết hợp nghỉ ngắn (`100ms`) giữa các lô để không gây khóa bảng (table lock) ảnh hưởng tới người dùng đang truy cập.
3. **Given** job dọn dẹp kết thúc, **When** hoàn tất giao dịch, **Then** một bản ghi kiểm toán được lưu vào `retention_cleanup_logs` gồm ngày chạy, số lượng yêu cầu đã xóa, số lượng thông báo đã xóa, thời gian thực thi (ms) và trạng thái (`SUCCESS`/`FAILED`).

---

## 3. Edge Cases & Resilience Scenarios

1. **LLM API Chậm / Timeout hoặc Vượt Rate Limit khi người dùng đang chờ ở trang Public**:
   - _Tình huống_: Nhà cung cấp LLM bên ngoài phản hồi quá 3 giây hoặc trả lỗi 429 khi lượng truy cập trang Public tăng cao.
   - _Xử lý_: Áp dụng **Circuit Breaker & Fast Fallback**: Hệ thống luôn chạy tầng `RegexEntityExtractor` + `VietnamLandmarkGazetteer` trước (chỉ mất $< 15\text{ms}$). Nếu LLM quá hạn 2.5 giây hoặc lỗi, hệ thống lập tức dùng kết quả của Regex + Gazetteer để thực hiện matching và trả kết quả ngay cho người dùng mà không làm gián đoạn trải nghiệm.
2. **Địa chỉ người dùng nhập mơ hồ, không xác định được Quận/Huyện**:
   - _Tình huống_: Người dùng chỉ nhập _"gần bến xe Giáp Bát"_ hoặc _"khu vực Hà Nội"_.
   - _Xử lý_: Tra cứu từ điển Landmark/POI Gazetteer để suy ra Quận/Huyện tương ứng. Nếu vẫn không xác định được Quận, lưu `district_code = NULL`, gắn cờ `is_location_ambiguous = true`, vẫn cho phép khớp với các gia sư dạy `ONLINE` hoặc có bật tùy chọn `receive_all_districts = true` trong cùng Tỉnh/Thành phố, đồng thời hiển thị gợi ý trên giao diện để người dùng có thể chọn bổ sung Quận/Huyện.
3. **Cách viết mức học phí đa dạng**:
   - _Tình huống_: Người dùng viết _"250k/b"_, _"1tr6/tháng (8 buổi)"_, _"200 cành"_, hoặc _"thỏa thuận"_.
   - _Xử lý_: Bộ bóc tách quy đổi thống nhất về đơn vị chuẩn整数 `tuition_fee_vnd` (VNĐ/buổi). Nếu ghi _"thỏa thuận"_, đặt `is_fee_negotiable = true` và `tuition_fee_vnd = 0`.
4. **Mất kết nối mạng / SSE Connection Dropped**:
   - _Tình huống_: Trình duyệt gia sư bị rớt mạng tạm thời khi đang mở tab Dashboard.
   - _Xử lý_: Hook `usePostMatchStream` tự động kết nối lại theo Exponential Backoff (1s, 2s, 4s, 8s, tối đa 30s) kèm `Last-Event-ID` để nhận bù các sự kiện bị nhỡ từ Redis cache.

---

## 4. Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp giao diện và API công khai (`POST /api/v1/public/tutor-demands/match`) cho phép người dùng nhập yêu cầu tìm gia sư bằng ngôn ngữ tự nhiên.
- **FR-002**: Hệ thống PHẢI kiểm tra tính trùng lặp và chống spam của yêu cầu bằng Redis (Content Hash & SimHash) trong thời gian $< 10\text{ms}$ trước khi xử lý bóc tách và lưu trữ vào PostgreSQL.
- **FR-003**: Hệ thống PHẢI lưu trữ yêu cầu gốc (`raw_content`, `content_hash`, `requester_user_id` nếu đã đăng nhập, `status`, `expires_at`) vào bảng `demand_posts` với các trạng thái chuẩn: `PENDING`, `EXTRACTED`, `FAILED`, `DUPLICATE`, `REJECTED`.
- **FR-004**: Hệ thống PHẢI cung cấp module bóc tách thực thể trích xuất được: Môn học, Khối lớp (1–12), Mức học phí/buổi (VNĐ), Hình thức học (`ONLINE`/`OFFLINE`/`HYBRID`), Tỉnh/Thành phố, Quận/Huyện và Ghi chú lịch học.
- **FR-005**: Hệ thống PHẢI chuẩn hóa địa chỉ khớp với danh mục hành chính (`provinces` và `districts`) hiện có trong hệ thống TutorMatching thông qua từ điển địa danh (Gazetteer) và so khớp mờ (Fuzzy Matching).
- **FR-006**: Hệ thống PHẢI gắn cờ `is_location_ambiguous = true` khi địa chỉ không thể xác định rõ cấp Quận/Huyện.
- **FR-007**: Hệ thống PHẢI trả về ngay danh sách các gia sư phù hợp nhất (chỉ bao gồm hồ sơ `APPROVED` thuộc tài khoản `ACTIVE`, ẩn toàn bộ thông tin nhạy cảm theo SRS) cho người dùng trên trang Public sau khi bóc tách yêu cầu.
- **FR-008**: Hệ thống PHẢI cho phép gia sư thiết lập cấu hình nhận thông báo yêu cầu mới (`tutor_matching_profiles`) gồm: Danh sách môn học, khối lớp, mức học phí tối thiểu/tối đa, khu vực nhận dạy và hình thức dạy.
- **FR-009**: Hệ thống PHẢI cung cấp endpoint Server-Sent Events (SSE) `/api/v1/tutors/me/matched-posts/stream` sử dụng cơ chế xác thực cookie kép hiện có và yêu cầu quyền `TUTOR` đã `APPROVED`.
- **FR-010**: Hệ thống PHẢI đẩy sự kiện yêu cầu phù hợp (`event: post_matched`) qua SSE tới trình duyệt của các gia sư khớp tiêu chí trong vòng không quá 2 giây kể từ khi bóc tách hoàn tất.
- **FR-011**: Hệ thống PHẢI cung cấp background job chạy tự động hàng ngày (02:00 AM UTC+7) để xóa các bản ghi yêu cầu, dữ liệu bóc tách và thông báo đã tồn tại quá 30 ngày.
- **FR-012**: Job dọn dẹp PHẢI thực hiện xóa theo từng lô (`batch size = 1000` dòng, nghỉ `100ms` giữa các lô) và ghi lại nhật ký vào bảng `retention_cleanup_logs`.
- **FR-013**: Hệ thống PHẢI thiết kế sẵn cột `embedding` và abstraction port `ITextEmbeddingService` để sẵn sàng kết hợp tìm kiếm tương đồng ngữ nghĩa (Vector Search).
- **FR-014**: Hệ thống PHẢI có cơ chế Fallback tự động về bộ trích xuất Regex + Gazetteer nội bộ khi dịch vụ LLM bên ngoài phản hồi chậm ($> 2.5\text{s}$) hoặc gặp sự cố.

---

## 5. Key Entities

- **`DemandPost`**: Đại diện cho yêu cầu tìm gia sư bằng ngôn ngữ tự nhiên do người dùng gửi từ trang Public. Lưu nội dung gốc, mã băm nội dung (`content_hash`), người tạo (nullable nếu khách vãng lai), trạng thái xử lý (`PENDING`, `EXTRACTED`, `FAILED`, `DUPLICATE`, `REJECTED`) và thời điểm hết hạn (`expires_at = created_at + 30 days`).
- **`ExtractedDemandDetail`**: Dữ liệu có cấu trúc sau khi bóc tách từ `DemandPost` (quan hệ 1-1). Gồm môn học (`subject_id`), khối lớp (`grade_level`), học phí chuẩn hóa (`tuition_fee_vnd`), hình thức học (`teaching_mode`), tỉnh/thành (`province_code`), quận/huyện (`district_code`), địa chỉ gốc (`raw_address`), cờ địa chỉ mơ hồ (`is_location_ambiguous`), độ tin cậy (`confidence_score`), JSON trích xuất và vector `embedding`.
- **`TutorMatchingProfile`**: Bộ tiêu chí nhận thông báo yêu cầu mới do gia sư cấu hình (quan hệ 1-1 với `TutorProfile`). Gồm danh sách môn học, khối lớp, học phí tối thiểu/tối đa, tỉnh/thành, danh sách quận/huyện, cờ nhận toàn bộ quận (`receive_all_districts`), hình thức dạy và trạng thái bật/tắt (`is_active`).
- **`PostMatchNotification`**: Bản ghi thông báo khi một yêu cầu tìm gia sư khớp với hồ sơ của gia sư. Lưu điểm tương thích (`match_score`), trạng thái đã đọc (`is_read`), thời điểm gửi SSE (`sent_at`) và thời điểm đọc (`read_at`).
- **`RetentionCleanupLog`**: Nhật ký kiểm toán mỗi lần chạy dọn dẹp tự động dữ liệu quá hạn 30 ngày (ngày chạy, số yêu cầu đã xóa, số thông báo đã xóa, thời gian thực thi, trạng thái).

---

## 6. Success Criteria

- **SC-001**: Tỷ lệ lọc trùng đạt 100% đối với các yêu cầu trùng nội dung trong cùng phiên và thời gian kiểm tra qua Redis đạt dưới $10\text{ms}$.
- **SC-002**: Độ chính xác trích xuất thông tin (Môn học, Khối lớp, Học phí, Khu vực) từ câu yêu cầu tiếng Việt tự nhiên đạt từ 90% trở lên.
- **SC-003**: Thời gian phản hồi danh sách gia sư phù hợp cho người dùng trên trang Public đạt dưới $2.500\text{ms}$ (kể cả khi LLM fallback về Regex + Gazetteer).
- **SC-004**: Độ trễ từ lúc bóc tách hoàn tất đến khi gia sư nhận được thông báo qua SSE trên giao diện Dashboard đạt dưới $2.000\text{ms}$.
- **SC-005**: 100% dữ liệu yêu cầu và thông báo cũ hơn 30 ngày được thu hồi tự động theo lô mà không làm gián đoạn các truy vấn hiện hành của hệ thống.
- **SC-006**: 100% kết quả gia sư trả về trên trang Public tuân thủ bất biến SRS: chỉ hiển thị gia sư `APPROVED` thuộc tài khoản `ACTIVE` và không rò rỉ dữ liệu cá nhân nhạy cảm (email, SĐT, ngày sinh, địa chỉ chi tiết).

---

## 7. Assumptions & Constraints

- Trang Public cho phép cả người dùng chưa đăng nhập (Guest) và người học đã đăng nhập (`LEARNER`) nhập yêu cầu tìm kiếm & matching gia sư; khi người dùng bấm "Gửi yêu cầu thuê" (`HireRequest`) tới một gia sư cụ thể sẽ chuyển tiếp vào luồng thuê gia sư hiện có của Sprint 3.
- Dữ liệu môn học và địa giới hành chính liên kết trực tiếp với bảng `subjects`, `provinces`, `districts` hiện có trong [`ApplicationDbContext`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/backend/src/TutorMatching.Infrastructure/Persistence/ApplicationDbContext.cs).
- Kết nối SSE của gia sư dùng chung hạ tầng xác thực cookie kép (`accessToken`, `refreshToken`) đã hoàn thiện ở Sprint 1.
- Redis được triển khai qua Docker Compose nội bộ đi kèm cụm backend.
