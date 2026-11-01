# TutorMatching — Project Architecture & Codebase Map

> **Phiên bản tài liệu**: 1.0 (Cập nhật sau Sprint 3 - Phase 7)  
> **Mục đích**: Cung cấp bức tranh toàn cảnh ( kiến trúc, cấu trúc thư mục, luồng dữ liệu, API, phân quyền, cơ sở dữ liệu và hạ tầng ) giúp nhà phát triển nắm bắt dự án nhanh chóng và chính xác.

---

## 1. Tổng quan dự án & Công nghệ (Tech Stack)

TutorMatching là nền tảng kết nối gia sư và học viên/phụ huynh, hỗ trợ tìm kiếm theo chuyên môn/địa bàn, gửi yêu cầu thuê, đàm phán lịch học/học phí theo phiên bản (versioned negotiation), quản lý tiến độ học tập và xác thực bảo mật đa tầng.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT BROWSER                                │
│          Next.js 16 (App Router) + React 19 + Tailwind CSS 4            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + Cookies (HttpOnly) + CSRF
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND API (ASP.NET Core 10)                      │
│   Clean Architecture: Api ──► Application ──► Domain ◄── Infrastructure│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     DATABASE & HẠ TẦNG DỊCH VỤ                         │
│       PostgreSQL 17 (Snake_case, UUID v4) + Mailpit (SMTP Sandbox)     │
└────────────────────────────────────────────────────────────────────────┘
```

### Chi tiết Stack

- **Backend**: C# / .NET 10, ASP.NET Core Web API, Entity Framework Core 10 (Npgsql), ASP.NET Core Identity (customized role store).
- **Frontend**: Next.js 16.3.6 (App Router), React 19.2.8, TypeScript, Tailwind CSS 4, TanStack Query v5, Axios.
- **Testing**:
  - Backend: xUnit, Testcontainers (PostgreSQL 17.6-alpine cô lập cho từng test fixture), WebApplicationFactory.
  - Frontend: Vitest, React Testing Library, Playwright E2E browser automation.
- **Hạ tầng cục bộ**: Docker Compose (`backend/compose.yaml`) chạy PostgreSQL 17 và Mailpit.

---

## 2. Bản đồ cấu trúc thư mục (Directory Structure)

```text
TutorMatching/
├── backend/
│   ├── compose.yaml                    # Docker Compose chạy PostgreSQL & Mailpit cục bộ
│   ├── TutorMatching.slnx              # Solution file định nghĩa các project .NET 10
│   ├── src/
│   │   ├── TutorMatching.Domain/       # Core nghiệp vụ, độc lập hoàn toàn (không phụ thuộc EF/Web)
│   │   │   ├── Hiring/                 # Thực thể HireRequest, Negotiation, HireTerms, FinalAgreement
│   │   │   ├── Tutors/                 # TutorProfile, AvailabilitySlot, Subject, Course
│   │   │   ├── Users/                  # ApplicationUser, AccountRole (ADMIN, LEARNER, TUTOR), AccountStatus
│   │   │   ├── Notifications/          # Notification entity
│   │   │   ├── Messaging/              # Conversation, Message entities
│   │   │   └── Catalog/                # Subject, Level, SubjectLevel entities
│   │   ├── TutorMatching.Application/  # Use cases, Ports, DTOs, Business Invariants
│   │   │   ├── Abstractions/           # Interfaces (ICurrentUser, IClock, IHireRequestStore, ITokenSessionService...)
│   │   │   ├── Authentication/         # Đăng ký, đăng nhập, cấp phiên, quản lý refresh token
│   │   │   ├── Hiring/                 # Use cases: CreateHireRequest, Respond, Negotiate, CloseHireRequest
│   │   │   ├── Tutors/                 # Use cases: Quản lý hồ sơ gia sư, lịch rảnh, môn học, tìm kiếm
│   │   │   └── Users/                  # Quản lý tài khoản, profile cá nhân
│   │   ├── TutorMatching.Infrastructure/ # Triển khai Database, EF Core, Token Store, Email
│   │   │   ├── Persistence/            # ApplicationDbContext, Model Configurations, Migrations
│   │   │   ├── Hiring/                 # HireRequestStore (quản lý transaction/lock), HireRequestQueries
│   │   │   ├── Security/               # TokenSessions, PasswordHasher, Custom UserStore
│   │   │   └── Email/                  # MailKit SMTP client & CapturedEmailSender cho tests
│   │   └── TutorMatching.Api/          # Điểm vào ứng dụng HTTP, Controllers, Middleware
│   │       ├── Controllers/            # Auth, Users, Tutors, TutorOffers, TutorReviews, HireRequests, Catalog
│   │       ├── Security/               # Cấu hình CORS, Anti-CSRF, Rate Limiter, JwtCookieTokens
│   │       ├── Errors/                 # ProblemDetails RFC 7807 Exception Filter
│   │       ├── OpenApi/                # OpenAPI 3.1 generation & custom schemas
│   │       └── Program.cs              # DI Composition Root & Web pipeline
│   ├── tests/
│   │   ├── TutorMatching.Domain.UnitTests/      # Test invariants & logic Domain thuần
│   │   ├── TutorMatching.Application.UnitTests/ # Test các use case service
│   │   ├── TutorMatching.Api.IntegrationTests/  # Test tích hợp API dùng Testcontainers PostgreSQL
│   │   └── performance/tutor-discovery/        # Harness test hiệu năng & E2E Browser runner
│   └── tools/
│       └── TutorMatching.DatabaseMigrator/     # Công cụ chuẩn hóa và migrate database độc lập
│
├── frontend/
│   ├── package.json                    # Scripts: dev, build, test, test:e2e, lint
│   ├── next.config.ts                  # Cấu hình Next.js
│   ├── src/
│   │   ├── app/                        # Next.js App Router (Pages & Layouts)
│   │   │   ├── (public)/               # Layout công khai: trang chủ, đăng nhập, tìm gia sư, learner
│   │   │   │   ├── learner/requests/   # Danh sách và chi tiết yêu cầu thuê của học viên
│   │   │   │   ├── tutors/             # Trang tìm kiếm và chi tiết hồ sơ gia sư
│   │   │   │   ├── login/, register/   # Trang xác thực người dùng
│   │   │   ├── (tutor)/                # Phân hệ Gia sư (bảo vệ bởi role TUTOR)
│   │   │   │   ├── tutor/dashboard/    # Dashboard gia sư
│   │   │   │   ├── tutor/requests/     # Danh sách & chi tiết yêu cầu thuê gửi tới gia sư
│   │   │   │   ├── tutor/offers/       # Quản lý lớp học và lịch rảnh
│   │   │   │   └── tutor/profile-edit/ # Chỉnh sửa hồ sơ, môn học giảng dạy
│   │   │   └── admin/                  # Phân hệ Quản trị viên (bảo vệ bởi role ADMIN)
│   │   │       ├── dashboard/          # Thống kê tổng quan
│   │   │       ├── tutor-approvals/    # Duyệt/từ chối hồ sơ gia sư
│   │   │       ├── catalog/            # Quản lý danh mục môn học/cấp độ
│   │   │       └── users/              # Quản lý khóa/mở tài khoản
│   │   ├── components/                 # UI Components tái sử dụng
│   │   │   ├── ui/                     # Design System Primitives: Button, Card, Badge, Dialog, Checkbox...
│   │   │   ├── hiring/                 # HireRequestList, Detail, Timeline, NegotiationPanel, CloseRequestDialog
│   │   │   ├── tutors/                 # TutorCard, HireTutorDialog, SearchFilters
│   │   │   ├── learner/                # DashboardTopBar, LearnerNavigation
│   │   │   └── navigation/             # Navbar, NavigationRail, UserNav
│   │   ├── hooks/                      # TanStack Query & React Hooks
│   │   │   ├── use-session.ts          # Theo dõi phiên đăng nhập hiện tại từ /api/v1/users/me
│   │   │   ├── use-auth.ts             # Đăng nhập, đăng ký, đăng xuất
│   │   │   ├── use-hire-requests.ts    # Queries & Mutations cho tuyển dụng / đàm phán / kết thúc
│   │   │   └── use-hire-request-list.ts# Reducer phân trang cursor & lọc trạng thái
│   │   ├── lib/
│   │   │   ├── api/                    # Axios clients giao tiếp Backend
│   │   │   │   ├── http.ts             # Axios instance tích hợp Anti-CSRF và tự động khôi phục session
│   │   │   │   ├── auth.ts, tutors.ts, hire-requests.ts, profile.ts
│   │   │   └── date-time/              # Format ngày giờ theo chuẩn múi giờ Asia/Ho_Chi_Minh
│   │   └── types/                      # TypeScript Interface / Contract DTOs
│   ├── tests/                          # Vitest & React Testing Library (38 files, 263 tests)
│   └── tests/e2e/                      # Playwright specs (hire-creation, hire-response, hire-close...)
│
├── docs/                               # Tài liệu dự án & Agent Memory
│   ├── agent-memory/                   # PROJECT.md (facts), SESSION.md (handoff), DECISIONS.md (ADRs)
│   ├── sprints/                        # Kế hoạch & kết quả từng Sprint (SPRINT-01 đến SPRINT-04)
│   ├── DatabaseSchema.md               # Thiết kế chi tiết cơ sở dữ liệu
│   └── Final_SRS_TutorMatch_PBL3.pdf   # Tài liệu yêu cầu phần mềm chuẩn (SRS)
│
└── specs/                              # Spec Kit cho các tính năng
    ├── 001-foundation-accounts/        # Đặc tả & kế hoạch Auth & Account
    ├── 002-tutor-discovery/            # Đặc tả & kế hoạch Tìm kiếm & Duyệt hồ sơ gia sư
    └── 003-hire-negotiation/           # Đặc tả, kế hoạch, task & evidence của Yêu cầu thuê & Thương lượng
```

---

## 3. Luồng dữ liệu & Cơ chế bảo mật (Security & Data Flow)

### 3.1. Xác thực & Phiên làm việc (Authentication & Dual-Cookie Session)

1. **Đăng nhập (`POST /api/v1/auth/login`)**:
   - Backend xác thực thông tin tài khoản qua ASP.NET Core Identity.
   - Khi thành công, tạo một bản ghi `token_sessions` trong PostgreSQL với row-lock để chống race condition.
   - Cấp 2 Cookie `HttpOnly`:
     - `tutormatch_session`: Chứa JWT Access Token (hạn 5 phút, scope path `/`).
     - `tutormatch_session_refresh`: Chứa Opaque Refresh Token (hạn 30 phút idle / 8 giờ tối đa, scope path `/api/v1/auth`).
2. **Khôi phục phiên tự động (`restoreSession` trong `http.ts`)**:
   - Khi frontend nhận lỗi 401 trên request có bảo vệ, frontend dùng `navigator.locks` để đồng bộ giữa các tab.
   - Gửi yêu cầu `POST /api/v1/auth/refresh` kèm CSRF token.
   - Backend kiểm tra session trong database (chưa bị thu hồi, user chưa đổi Security Stamp), cấp cặp token mới và xoay vòng refresh token (token rotation).

### 3.2. Cơ chế Anti-CSRF (Bắt buộc cho mọi unsafe request)

- Mọi request làm thay đổi dữ liệu (`POST`, `PUT`, `PATCH`, `DELETE`) tới `/api/v1/*` đều đi qua middleware kiểm tra Antiforgery:
  1. Frontend gọi `GET /api/v1/auth/csrf`: Backend set cookie `tutormatch_session_csrf` và trả về JSON `{ headerName: "X-CSRF-TOKEN", requestToken: "..." }`.
  2. Frontend đính kèm header `X-CSRF-TOKEN: <requestToken>` vào mọi request POST/PUT/DELETE.
  3. Backend Antiforgery Middleware đối chiếu token từ header với cookie `tutormatch_session_csrf`. Nếu thiếu một trong hai hoặc không khớp -> **Trả về HTTP 400 Bad Request**.

### 3.3. Cấu hình CORS (Cross-Origin Resource Sharing)

- Cấu hình tại [`backend/src/TutorMatching.Api/Security/ApiSecurityExtensions.cs`](file:///Users/nguyenhongson/Documents/Learning/TutorMatching/backend/src/TutorMatching.Api/Security/ApiSecurityExtensions.cs):
  - Đọc từ mảng cấu hình `Frontend:Origins` trong `appsettings.json` hoặc biến môi trường `Frontend__Origins__0`, `Frontend__Origins__1`.
  - Hỗ trợ thêm `Frontend:Origin` đơn lẻ (legacy).
  - Cho phép: `AllowCredentials()`, các headers: `Content-Type`, `X-CSRF-TOKEN`, `Authorization`, `Idempotency-Key`...
  - **Lưu ý Production**: Nếu frontend host trên `https://tutor-matching-psi.vercel.app`, backend host tại domain khác, cần đảm bảo Cookie được cấu hình `SameSite=None; Secure=true` để trình duyệt không chặn cookie qua cross-site.

---

## 4. Bản đồ API Endpoints (REST Contracts)

Tất cả endpoint đều có tiền tố chuẩn: `/api/v1`

| Nhóm chức năng      | Method      | Endpoint                             | Quyền hạn (Role)   | Mô tả ngắn                                                 |
| :------------------ | :---------- | :----------------------------------- | :----------------- | :--------------------------------------------------------- |
| **Xác thực**        | `GET`       | `/auth/csrf`                         | Public             | Lấy CSRF request token                                     |
|                     | `POST`      | `/auth/login`                        | Anonymous          | Đăng nhập tài khoản                                        |
|                     | `POST`      | `/auth/register`                     | Anonymous          | Đăng ký tài khoản (Learner / Tutor)                        |
|                     | `POST`      | `/auth/refresh`                      | Anonymous (Cookie) | Làm mới Access Token bằng Refresh Token                    |
|                     | `POST`      | `/auth/logout`                       | Authenticated      | Đăng xuất, hủy toàn bộ phiên làm việc                      |
| **Người dùng**      | `GET`       | `/users/me`                          | Authenticated      | Lấy thông tin tài khoản đang đăng nhập                     |
|                     | `GET`       | `/users/me/access/{role}`            | Authenticated      | Kiểm tra quyền hạn trực tiếp trong DB                      |
| **Gia sư (Public)** | `GET`       | `/tutors`                            | Public             | Tìm kiếm danh sách gia sư (lọc môn, giá, vị trí)           |
|                     | `GET`       | `/tutors/{id}`                       | Public             | Xem hồ sơ chi tiết gia sư đã duyệt                         |
| **Hồ sơ gia sư**    | `GET, PUT`  | `/tutor/profile`                     | `TUTOR`            | Xem và cập nhật thông tin hồ sơ gia sư                     |
|                     | `GET, POST` | `/tutor/availability`                | `TUTOR`            | Quản lý khung giờ rảnh trong tuần                          |
|                     | `GET, POST` | `/tutor/courses`                     | `TUTOR`            | Quản lý các khóa học/lớp học cung cấp                      |
| **Duyệt hồ sơ**     | `GET`       | `/admin/tutor-reviews`               | `ADMIN`            | Hàng đợi duyệt hồ sơ gia sư                                |
|                     | `POST`      | `/admin/tutor-reviews/{id}/decision` | `ADMIN`            | Phê duyệt hoặc từ chối hồ sơ gia sư                        |
| **Thuê & Đàm phán** | `POST`      | `/hire-requests`                     | `LEARNER`          | Gửi yêu cầu thuê gia sư (Idempotent)                       |
|                     | `GET`       | `/hire-requests`                     | `LEARNER`, `TUTOR` | Danh sách yêu cầu (phân trang Cursor, lọc trạng thái)      |
|                     | `GET`       | `/hire-requests/{id}`                | `LEARNER`, `TUTOR` | Chi tiết yêu cầu, timeline lịch sử, điều khoản chốt        |
|                     | `POST`      | `/hire-requests/{id}/accept`         | `TUTOR`, `LEARNER` | Chấp nhận yêu cầu ban đầu hoặc chấp nhận đề xuất           |
|                     | `POST`      | `/hire-requests/{id}/reject`         | `TUTOR`            | Từ chối yêu cầu (kèm lý do bắt buộc)                       |
|                     | `POST`      | `/hire-requests/{id}/proposals`      | `LEARNER`, `TUTOR` | Gửi đề xuất đàm phán giá/lịch học mới                      |
|                     | `POST`      | `/hire-requests/{id}/cancel`         | `LEARNER`, `TUTOR` | Hủy yêu cầu (bắt buộc xác nhận, cần lý do nếu đã ACCEPTED) |
|                     | `POST`      | `/hire-requests/{id}/complete`       | `LEARNER`, `TUTOR` | Hoàn tất việc học (chỉ áp dụng khi ACCEPTED)               |

---

## 5. Bản đồ Giao diện Frontend (Routes & Components)

```text
/ (Home) ──────────► Danh sách gia sư nổi bật, giới thiệu nền tảng
├── /login ────────► Form đăng nhập (chuyển hướng theo Role sau khi login)
├── /register ─────► Form đăng ký tài khoản (chọn vai trò Learner hoặc Tutor)
├── /tutors ───────► Bộ lọc tìm kiếm gia sư đa tiêu chí (môn học, mức giá, hình thức)
│   └── /[id] ─────► Xem chi tiết gia sư, khung giờ rảnh, nút mở [HireTutorDialog]
│
├── /learner/ (Dành cho Học viên - AuthGuard role="LEARNER")
│   ├── /dashboard ──► Thống kê số lớp, gia sư đang học, thông báo
│   ├── /requests ───► [HireRequestList] Danh sách yêu cầu đã gửi (lọc 6 trạng thái)
│   └── /requests/[id]► [HireRequestPage] -> [HireRequestDetail]:
│                      - [HireRequestTimeline]: Lịch sử chuyển trạng thái & các lượt đàm phán
│                      - [NegotiationPanel]: Đổi giá / lịch học khi đang thương lượng
│                      - [CloseRequestDialog]: Modal hủy yêu cầu
│
├── /tutor/ (Dành cho Gia sư - AuthGuard role="TUTOR")
│   ├── /dashboard ──► Dashboard theo dõi thu nhập, lớp học, lịch dạy
│   ├── /requests ───► Quản lý yêu cầu thuê gửi đến (Chấp nhận / Từ chối / Đàm phán)
│   ├── /offers ─────► Quản lý khung giờ rảnh (WeeklyAvailability) & Khóa học
│   └── /profile-edit► Cập nhật thông tin gia sư, học vị, chứng chỉ, giá theo buổi
│
└── /admin/ (Dành cho Quản trị viên - AuthGuard role="ADMIN")
    ├── /dashboard ──► Thống kê hệ thống
    ├── /tutor-approvals ► Hàng đợi xét duyệt hồ sơ gia sư mới nộp
    ├── /catalog ────► Quản trị danh mục Môn học (Subjects) & Cấp lớp (Levels)
    └── /users ──────► Quản lý tài khoản người dùng, khóa/mở khóa
```

---

## 6. Mô hình Dữ liệu (Database Schema Entities)

Toàn bộ bảng và cột tuân thủ chuẩn **`snake_case`**, khóa chính là **`uuid`** ngẫu nhiên.

```
                    ┌─────────────────────────┐
                    │      user_accounts      │
                    │  (id, email, role, ...) │
                    └────────────┬────────────┘
                                 │ 1:1
                                 ▼
                    ┌─────────────────────────┐
                    │      tutor_profiles     │
                    │(hourly_rate, status, ...│
                    └────────────┬────────────┘
         ┌───────────────────────┼────────────────────────┐
         │ 1:N                   │ 1:N                    │ 1:N
         ▼                       ▼                        ▼
┌──────────────────┐    ┌─────────────────┐     ┌───────────────────┐
│availability_slots│    │     courses     │     │   hire_requests   │
│ (weekly windows) │    │(sessions, price)│     │(terms, status, v) │
└──────────────────┘    └─────────────────┘     └─────────┬─────────┘
                                                          │ 1:N
                           ┌──────────────────────────────┼──────────────────────────────┐
                           ▼                              ▼                              ▼
                 ┌───────────────────┐          ┌───────────────────┐          ┌───────────────────┐
                 │   negotiations    │          │request_status_hist│          │   conversations   │
                 │(sequence, terms,v)│          │ (sequence, event) │          │  (hire_request_id)│
                 └───────────────────┘          └───────────────────┘          └───────────────────┘
```

1. **`user_accounts`**: Lưu thông tin đăng nhập, vai trò (`ADMIN`, `LEARNER`, `TUTOR`), trạng thái (`ACTIVE`, `LOCKED`), Security Stamp.
2. **`token_sessions` & `refresh_tokens`**: Quản lý phiên đăng nhập thiết bị, thời hạn session, trạng thái xoay vòng token.
3. **`tutor_profiles`**: Lưu thông tin chuyên môn gia sư, học phí/buổi, hình thức dạy (`ONLINE`, `OFFLINE`, `HYBRID`), trạng thái duyệt (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`).
4. **`availability_slots`**: Khung thời gian rảnh cố định trong tuần của gia sư (DayOfWeek 1-7, StartTime, EndTime).
5. **`hire_requests`**: Thực thể trung tâm lưu yêu cầu thuê, phiên bản (`version` Guid chống cập nhật đè), snapshot điều khoản ban đầu (`initial_terms`), điều khoản chốt (`final_agreement`), trạng thái (`PENDING`, `NEGOTIATING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`).
6. **`negotiations`**: Lưu snapshot đầy đủ các lượt đàm phán giá và đổi lịch giữa học viên và gia sư (đánh số `sequence` tăng dần, bất biến).
7. **`request_status_history`**: Audit trail toàn bộ sự kiện đổi trạng thái của yêu cầu thuê (ai đổi, lý do gì, thời điểm nào).
8. **`notifications`**: Thông báo sự kiện (inbox thông báo gửi tới đối phương khi có hành động mới).

---

## 7. Hướng dẫn Troubleshooting khi Deploy Production

### Vấn đề: `POST http://localhost:5014/api/v1/auth/login 400 (Bad Request)` trên Vercel

Khi deploy frontend lên Vercel (`https://tutor-matching-psi.vercel.app`), nếu gặp lỗi trên thì nguyên nhân là:

1. **Frontend đang gọi nhầm về `localhost:5014`**:
   - Biến `NEXT_PUBLIC_API_BASE_URL` trong file `frontend/.env` đang để giá trị mặc định là `http://localhost:5014/api/v1`.
   - **Cách sửa**: Vào **Vercel Dashboard** -> Chọn Project -> **Settings** -> **Environment Variables**, thêm biến:
     - `NEXT_PUBLIC_API_BASE_URL` = `https://<ten-domain-backend-cua-ban>/api/v1`
     - Sau đó **Redeploy** lại project trên Vercel để Next.js build lại bundle client.
2. **Tại sao trả về lỗi 400 (Bad Request)?**:
   - Khi gọi cross-origin từ `https://tutor-matching-psi.vercel.app` sang backend:
   - Backend bật middleware **Anti-CSRF**. Nếu trình duyệt không gửi kèm cookie `tutormatch_session_csrf` (do khác domain hoặc cookie bị chặn bởi SameSite), middleware sẽ từ chối và trả về **HTTP 400 (CSRF token validation failed)**.
   - **Cách sửa Backend**:
     - Cấu hình domain Vercel trong backend environment: `Frontend__Origins__0=https://tutor-matching-psi.vercel.app`.
     - Nếu Backend và Frontend ở 2 domain hoàn toàn khác nhau (ví dụ `vercel.app` và `render.com`), cookie của backend phải được set `SameSite=None` và `Secure=true` (yêu cầu cả 2 bên đều chạy HTTPS).
