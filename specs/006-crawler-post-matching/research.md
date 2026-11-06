# Phase 0: Research & Technical Decisions (006-crawler-post-matching)

Tài liệu nghiên cứu và đưa ra các quyết định kỹ thuật nền tảng cho tính năng: **Người dùng nhập yêu cầu tìm gia sư bằng ngôn ngữ tự nhiên trên trang Public, lọc trùng & chống spam qua Redis, bóc tách cấu trúc dữ liệu JSON, khớp nối gia sư hai chiều (trả kết quả ngay + bắn SSE realtime cho gia sư) và tự động dọn dẹp sau 30 ngày**.

---

## 1. Decision 1: Public Natural-Language Demand Ingestion vs. Facebook Scraping

### Problem & Context

- Phương án cào bài từ nhóm Facebook phụ thuộc vào DOM của bên thứ ba và đối mặt với rủi ro bị khóa tài khoản (Checkpoint 956/282) hoặc giới hạn pháp lý/bảo mật.
- Chuyển sang mô hình **Public Natural-Language Demand Matching**: Người dùng (học viên/phụ huynh) truy cập trực tiếp trang Public của TutorMatching và nhập nhu cầu tìm gia sư bằng câu tiếng Việt tự nhiên (ví dụ: _"Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 gần ĐH Bách Khoa, học phí 250k/buổi tuần 2 buổi"_).

### Technical Decision

Xây dựng kiến trúc **Unified Demand Ingestion & Dual Matching Pipeline**:

1. **Loại bỏ hoàn toàn sự phụ thuộc vào Facebook Crawler**: Không cần duy trì tài khoản Facebook clone hay Playwright headless browser.
2. **Bảo vệ Endpoint Public (Anti-Spam, Rate Limiting & LLM Circuit Breaker)**:
   - Áp dụng **Redis Sliding-Window Rate Limiter** theo IP / User ID (ví dụ: tối đa 10 yêu cầu / phút / IP) để chống spam làm cạn quota AI.
   - Áp dụng **Fast Regex Pre-filter**: Loại bỏ ngay các chuỗi quá ngắn ($< 10$ ký tự) hoặc vô nghĩa trước khi gọi LLM.
   - Áp dụng **Time-boxed LLM Circuit Breaker ($2.5\text{s}$ timeout)**: Nếu dịch vụ LLM bên ngoài phản hồi chậm hoặc lỗi 429, hệ thống tự động fallback tức thì về kết quả của `RegexEntityExtractor` + `VietnamLandmarkGazetteer` để người dùng trên trang Public luôn nhận được danh sách gia sư trong $< 2.5\text{s}$.

---

## 2. Decision 2: Deduplication & Result Caching via Redis + PostgreSQL Constraint

### Problem

Người dùng trên trang Public có thể:

- Bấm nút "Tìm & Khớp nối gia sư" nhiều lần liên tiếp (double-submit / refresh).
- Gửi lại cùng một nội dung yêu cầu tìm gia sư nhiều lần trong ngày, dễ dẫn đến việc gọi LLM lặp lại tốn kém và bắn thông báo SSE trùng lặp cho gia sư.

### Technical Decision

Áp dụng cơ chế **Lọc trùng 2 tầng qua Redis (Two-Tier Redis Deduplication)**:

1. **Tầng 1: Redis O(1) Idempotent / Content-Hash Check (Primary Filter)**:
   - Chuẩn hóa văn bản đầu vào (trim, lowercase, gộp khoảng trắng thừa) và tính `SHA256(normalized_content)`.
   - Kiểm tra nhanh trên Redis: `SET demand:seen:{actor_key}:{content_hash} {demand_id} EX 86400 NX` (TTL 24 giờ cho cùng người gửi, và cache kết quả bóc tách theo `content_hash` trong 30 ngày).
   - Nếu khóa đã tồn tại $\rightarrow$ trả về ngay kết quả bóc tách và danh sách gia sư đã khớp trong $< 5\text{ms}$, không gọi lại LLM và không phát lại SSE trùng lặp.
2. **Tầng 2: SimHash Near-Duplicate Detection**:
   - Tính `SimHash(normalized_content)` lưu trong Redis với TTL 48 giờ cho mỗi người gửi để phát hiện các yêu cầu chỉ sửa đổi 1–2 ký tự nhằm spam hệ thống.
   - Đánh dấu bản ghi trùng là `status = 'DUPLICATE'` và không bắn lại thông báo SSE.

---

## 3. Decision 3: Entity Extraction Service & Address Resolution Strategy

### Problem

Câu yêu cầu người dùng nhập trên trang Public có đặc thù:

- Văn phong tự do, viết tắt: vd _"Tìm gs Toán 12 Cầu Giấy 250k/b, tuần 2b"_.
- Địa chỉ ghi theo địa danh dân gian, không ghi rõ Quận/Huyện (vd: _"gần chợ Phùng Khoang"_, _"khu vực Bách Khoa"_, _"ở Hà Nội"_).

### Technical Decision

Áp dụng kiến trúc **Hybrid Extraction Pipeline (Rules + Gazetteer + LLM Structured Output)**:

1. **Quy trình bóc tách (Extraction Flow)**:
   - **Bước 1: Fast Regex & Catalog Lookup ($< 15\text{ms}$)**:
     - Môn học: Đối sánh từ khóa và bí danh môn học với bảng `subjects` hiện có.
     - Khối lớp: Regex nhận diện `"lớp 1"` đến `"lớp 12"`, `"ôn thi vào 10"` ($\rightarrow$ lớp 9), `"ôn thi ĐH"` ($\rightarrow$ lớp 12).
     - Mức học phí: Regex nhận diện `"250k"`, `"250.000đ"`, `"1tr6/tháng (8 buổi)"` $\rightarrow$ quy đổi chuẩn về số nguyên `tuition_fee_vnd` (VNĐ/buổi).
   - **Bước 2: Structured Entity Extraction (LLM JSON Schema)**:
     - Sử dụng `Gemini 2.5 Flash` (hoặc `GPT-4o-mini`) với JSON Schema ràng buộc chặt chẽ để chuẩn hóa các câu phức tạp, ghi chú lịch học và tính `confidence_score`.
2. **Chiến lược giải quyết rủi ro: Địa chỉ yêu cầu không xác định được Quận/Huyện**:
   - **Tầng 1 (Vietnam Landmark Gazetteer Lookup)**:
     - Từ điển địa danh quen thuộc (Landmarks & POIs) ánh xạ trực tiếp về mã `province_code` và `district_code` trong DB:
       - _"Bách Khoa"_, _"Kinh Tế Quốc Dân"_, _"Xây Dựng"_, _"Bạch Mai"_ $\rightarrow$ `Hai Bà Trưng, Hà Nội`.
       - _"ĐHQG"_, _"Sư Phạm"_, _"Xuân Thủy"_, _"Duy Tân"_ $\rightarrow$ `Cầu Giấy, Hà Nội`.
       - _"Keangnam"_, _"Mỹ Đình"_, _"Phùng Khoang"_ $\rightarrow$ `Nam Từ Liêm, Hà Nội`.
   - **Tầng 2 (Fuzzy String Matching)**:
     - So khớp chuỗi mờ (Levenshtein / Trigram) với bảng `districts` và `provinces` hiện có của TutorMatching.
   - **Tầng 3 (Fallback & Ambiguity Flagging)**:
     - Nếu chỉ xác định được Tỉnh/Thành phố mà không thể xác định Quận/Huyện:
       - Gán `province_code` tương ứng, `district_code = NULL`.
       - Đánh dấu `is_location_ambiguous = true` và giữ nguyên `raw_address`.
     - **Quy tắc Matching cho địa chỉ mơ hồ**:
       - Vẫn cho phép khớp với các gia sư dạy `ONLINE` hoặc gia sư có `receive_all_districts = true` trong cùng Tỉnh/Thành phố.
       - Trên giao diện Public, hiển thị gợi ý nhẹ để người dùng có thể bấm chọn bổ sung Quận/Huyện nếu muốn lọc hẹp hơn.

---

## 4. Decision 4: Dual-Direction Matching & Server-Sent Events (SSE) Delivery

### Problem

Khi người dùng gửi yêu cầu trên trang Public, hệ thống cần đáp ứng đồng thời 2 nhu cầu:

1. Người dùng cần thấy ngay danh sách các gia sư phù hợp nhất trên màn hình.
2. Các gia sư đang online trên Dashboard cần nhận được thông báo thời gian thực khi có nhu cầu học mới khớp với hồ sơ của mình.

### Technical Decision

1. **Chiều 1 - Synchronous Public Tutor Matching**:
   - `MatchingEngine` truy vấn các `TutorProfile` có `approval_status_code = 'APPROVED'` và tài khoản `status_code = 'ACTIVE'`.
   - Tính điểm tương thích `match_score` ($0.00 \rightarrow 1.00$) dựa trên trọng số: Môn học ($40\%$), Khối lớp ($20\%$), Khu vực/Hình thức ($20\%$), Mức học phí ($20\%$).
   - Trả về ngay danh sách Top gia sư phù hợp (sử dụng DTO công khai không chứa email/SĐT/ngày sinh/địa chỉ chi tiết của gia sư theo đúng quy tắc bảo mật SRS).
2. **Chiều 2 - Asynchronous Realtime SSE Delivery cho Gia sư**:
   - Song song với việc trả kết quả cho người dùng, hệ thống đối chiếu `ExtractedDemandDetail` với bảng `tutor_matching_profiles` (`is_active = true`).
   - Lưu bản ghi vào `post_match_notifications` và publish sự kiện qua Redis Pub/Sub channel `tutor:notifications:{tutor_profile_id}`.
   - Endpoint SSE độc lập `GET /api/v1/tutors/me/matched-posts/stream` (hoạt động song song và độc lập với `EventsHub` SignalR của tính năng chat) đẩy sự kiện `event: post_matched` chuẩn `text/event-stream` xuống trình duyệt gia sư kèm hỗ trợ `Last-Event-ID`.

---

## 5. Decision 5: Data Retention & Automated Cleanup Strategy (30 Days)

### Problem

Các yêu cầu tìm gia sư tự nhiên (`demand_posts`), chi tiết bóc tách (`extracted_demand_details`) và thông báo match (`post_match_notifications`) chỉ có giá trị thời sự trong 30 ngày.

### Technical Decision

Thiết kế **`RetentionCleanupWorker` (`BackgroundService`) chạy định kỳ 02:00 AM UTC+7**:

1. **Kỹ thuật xóa phân lô an toàn (Safe Batched Chunk Deletion)**:
   ```sql
   WITH doomed_posts AS (
       SELECT id FROM demand_posts
       WHERE created_at < NOW() - INTERVAL '30 days'
       LIMIT 1000
   )
   DELETE FROM demand_posts
   WHERE id IN (SELECT id FROM doomed_posts);
   ```

   - Lặp lại cho đến khi hết bản ghi quá hạn, nghỉ `100ms` giữa mỗi batch để không khóa bảng.
   - Ràng buộc `ON DELETE CASCADE` tự động xóa sạch các bản ghi con trong `extracted_demand_details` và `post_match_notifications`.
2. **Audit Logging**:
   - Ghi nhận kết quả vào bảng `retention_cleanup_logs` (`cleanup_date`, `posts_deleted_count`, `notifications_deleted_count`, `duration_ms`, `status`).

---

## 6. Decision 6: Hybrid & Vector Search Architecture (AI Applied Ready)

### Design

1. **Structured Taxonomy + Vector Embedding**:
   - Bảng `extracted_demand_details` lưu đầy đủ các trường chuẩn hóa (`subject_id`, `grade_level`, `tuition_fee_vnd`, `province_code`, `district_code`) cùng cột `embedding` (1536 chiều).
   - Abstraction port `ITextEmbeddingService` trong `TutorMatching.Application` cho phép kết hợp **Structured SQL Filtering + Vector Cosine Similarity** để xếp hạng những gia sư có kinh nghiệm/mô tả bio sát nhất với yêu cầu đặc thù của người học (ví dụ: _"cần gia sư kiên nhẫn cho học sinh mất gốc Toán"_).
