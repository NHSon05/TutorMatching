# Database Schema

Tài liệu mô tả cấu trúc cơ sở dữ liệu cho hệ thống Tutor Matching.

## Quy ước tên vật lý

Tất cả bảng, cột, khóa, index và sequence dùng lowercase `snake_case`.
C# property và JSON contract giữ quy ước riêng; giá trị role/status không đổi.
Migration cũ giữ nguyên tên lịch sử để replay được; migration mới đổi tên schema hiện có.

Schema foundation đã triển khai gồm `user_accounts`, `audit_events`, `token_sessions`,
`session_refresh_tokens`, `asp_net_roles`, `asp_net_role_claims`, `asp_net_user_roles`,
`asp_net_user_claims`, `asp_net_user_logins`, `asp_net_user_tokens` và `ef_migrations_history`.
Lịch sử migration dùng `migration_id`, `product_version`.

Trạng thái token chỉ lưu bằng `token_sessions.revoked_at` và
`session_refresh_tokens.consumed_at` (nullable `timestamptz`); không còn `is_revoked`/`is_used`.
`NULL` nghĩa là chưa thu hồi/chưa dùng, không đồng nghĩa còn hiệu lực (vẫn kiểm tra hạn dùng,
tài khoản, security stamp và role hiện tại). Giá trị `-infinity` chỉ dành cho trạng thái cũ
đã thu hồi/đã dùng nhưng không biết thời điểm; không hiển thị nó như thời điểm sự kiện thực tế.
Timestamp cũ đã biết được giữ nguyên. Runtime ghi UTC thực tế cho các chuyển trạng thái mới.
Role trong session là snapshot lúc đăng nhập, phải khớp role hiện tại khi validate/refresh.

Sơ đồ bên dưới là **đề xuất logical cho toàn sản phẩm**, không phải danh sách bảng đã triển khai:
`users` tương ứng tài khoản trong `user_accounts`; session hiện dùng hai bảng token;
audit hiện nằm trong `audit_events`.

Nâng cấp: dừng API cũ, chạy `dotnet run --project backend/tools/TutorMatching.DatabaseMigrator`
từ repository root rồi khởi động API mới. Lệnh xử lý đổi tên lịch sử migration trước khi EF
tìm migration còn thiếu. Không xóa database hoặc lịch sử migration.
Xem [hướng dẫn kiểm chứng](../specs/005-database-snake-case/quickstart.md).

## Entity Relationship Diagram

```dbml
title Entity Relationship Diagram

users {
  user_id string pk
  email string unique
  password_hash string
  full_name string
  phone string nullable unique
  date_of_birth date nullable
  avatar_url string nullable
  role_code string
  status_code string
  last_login_at datetime nullable
  created_at datetime
  updated_at datetime
  deleted_at datetime nullable
}

users_session {
  session_id string pk
  user_id string fk
  token_hash string unique
  expires_at datetime
  revoked_at datetime nullable
  created_at datetime
}

password_reset_tokens {
  reset_token_id string pk
  user_id string fk
  token_hash string unique
  expires_at datetime
  used_at datetime nullable
  created_at datetime
}

tutor_profile {
  tutor_profile_id string pk
  user_id string fk unique
  display_name string
  bio text nullable
  qualification text nullable
  experience_summary text nullable
  achievements text nullable
  listed_price_vnd integer
  is_negotiable boolean
  teaching_mode_code string
  province_code string nullable
  district_code string nullable
  approval_status_code string
  submitted_at datetime nullable
  approved_at datetime nullable
  created_at datetime
  updated_at datetime
}

subjects {
  subject_id string pk
  name string unique
  description text nullable
  is_active boolean
  created_at datetime
  updated_at datetime
}

tutor_subjects {
  tutor_profile_id string pk fk
  subject_id string pk fk
  level_description string nullable
  created_at datetime
}

provinces {
  province_code string pk
  province_name string unique
  is_active boolean
}

districts {
  district_code string pk
  province_code string fk
  district_name string
  is_active boolean
}

availability_slots {
  availability_id string pk
  tutor_profile_id string fk
  availability_type string
  day_of_week integer nullable
  specific_date date nullable
  start_time time
  end_time time
  is_active boolean
  created_at datetime
  updated_at datetime
}

courses {
  course_id string pk
  tutor_profile_id string fk
  subject_id string fk
  name string
  description text nullable
  session_count integer nullable
  price_per_session_vnd integer nullable
  status_code string
  created_at datetime
  updated_at datetime
  deleted_at datetime nullable
}

tutor_profile_reviews {
  review_id string pk
  tutor_profile_id string fk
  reviewer_user_id string fk
  from_status_code string
  to_status_code string
  note text nullable
  reviewed_at datetime
}

hire_requests {
  hire_request_id string pk
  requester_user_id string fk
  tutor_profile_id string fk
  subject_id string fk
  course_id string fk nullable
  start_date date
  sessions_per_week integer
  duration_minutes integer
  teaching_mode_code string
  province_code string nullable
  district_code string nullable
  location_detail string nullable
  proposed_price_vnd integer
  agreed_price_vnd integer nullable
  status_code string
  note text nullable
  cancel_reason text nullable
  accepted_at datetime nullable
  completed_at datetime nullable
  created_at datetime
  updated_at datetime
}

request_schedules {
  request_schedule_id string pk
  hire_request_id string fk
  day_of_week integer
  start_time time
  end_time time
  created_at datetime
}

negotiations {
  negotiation_id string pk
  hire_request_id string fk
  sender_user_id string fk
  proposed_price_vnd integer nullable
  note text nullable
  response_status_code string
  responded_at datetime nullable
  created_at datetime
}

negotiation_schedules {
  negotiation_schedule_id string pk
  negotiation_id string fk
  day_of_week integer
  start_time time
  end_time time
}

request_status_history {
  history_id string pk
  hire_request_id string fk
  actor_user_id string fk nullable
  from_status_code string nullable
  to_status_code string
  reason text nullable
  created_at datetime
}

conversations {
  conversation_id string pk
  hire_request_id string fk unique
  created_at datetime
  closed_at datetime nullable
}

messages {
  message_id string pk
  conversation_id string fk
  sender_user_id string fk
  content text
  sent_at datetime
  read_at datetime nullable
  deleted_at datetime nullable
}

notifications {
  notification_id string pk
  user_id string fk
  type_code string
  title string
  body text nullable
  hire_request_id string fk nullable
  message_id string fk nullable
  tutor_profile_id string fk nullable
  is_read boolean
  read_at datetime nullable
  created_at datetime
}

articles {
  article_id string pk
  author_user_id string fk
  title string
  slug string unique
  summary text nullable
  content text
  status_code string
  published_at datetime nullable
  created_at datetime
  updated_at datetime
}

audit_logs {
  audit_log_id string pk
  actor_user_id string fk nullable
  action_code string
  entity_type string
  entity_id string
  old_value_summary text nullable
  new_value_summary text nullable
  ip_address string nullable
  created_at datetime
}

notation crows-feet
typeface clean

users.user_id < users_session.user_id
users.user_id < password_reset_tokens.user_id
users.user_id - tutor_profile.user_id

tutor_profile.tutor_profile_id < tutor_subjects.tutor_profile_id
subjects.subject_id < tutor_subjects.subject_id

provinces.province_code < districts.province_code

tutor_profile.tutor_profile_id < availability_slots.tutor_profile_id

tutor_profile.tutor_profile_id < courses.tutor_profile_id
subjects.subject_id < courses.subject_id

tutor_profile.tutor_profile_id < tutor_profile_reviews.tutor_profile_id
users.user_id < tutor_profile_reviews.reviewer_user_id

users.user_id < hire_requests.requester_user_id
tutor_profile.tutor_profile_id < hire_requests.tutor_profile_id
subjects.subject_id < hire_requests.subject_id
courses.course_id < hire_requests.course_id

hire_requests.hire_request_id < request_schedules.hire_request_id

hire_requests.hire_request_id < negotiations.hire_request_id
users.user_id < negotiations.sender_user_id

negotiations.negotiation_id < negotiation_schedules.negotiation_id

hire_requests.hire_request_id < request_status_history.hire_request_id
users.user_id < request_status_history.actor_user_id

hire_requests.hire_request_id - conversations.hire_request_id

conversations.conversation_id < messages.conversation_id
users.user_id < messages.sender_user_id

users.user_id < notifications.user_id
hire_requests.hire_request_id < notifications.hire_request_id
messages.message_id < notifications.message_id
tutor_profile.tutor_profile_id < notifications.tutor_profile_id

users.user_id < articles.author_user_id

users.user_id < audit_logs.actor_user_id
```

## Entity Groups

### Authentication & users

| Table                   | Purpose                             |
| ----------------------- | ----------------------------------- |
| `users`                 | Lưu thông tin tài khoản người dùng. |
| `users_session`         | Lưu session/token đăng nhập.        |
| `password_reset_tokens` | Lưu token đặt lại mật khẩu.         |

### Tutor Profile & Catalog

| Table                   | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `tutor_profile`         | Hồ sơ gia sư, thông tin hiển thị, giá, trạng thái duyệt. |
| `subjects`              | Danh mục môn học.                                        |
| `tutor_subjects`        | Bảng liên kết nhiều-nhiều giữa gia sư và môn học.        |
| `availability_slots`    | Lịch rảnh của gia sư.                                    |
| `courses`               | Gói học hoặc khóa học do gia sư tạo.                     |
| `tutor_profile_reviews` | Lịch sử admin/reviewer duyệt hồ sơ gia sư.               |

### Location

| Table       | Purpose                                   |
| ----------- | ----------------------------------------- |
| `provinces` | Danh mục tỉnh/thành phố.                  |
| `districts` | Danh mục quận/huyện thuộc tỉnh/thành phố. |

### Hiring & Negotiation

| Table                    | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `hire_requests`          | Yêu cầu thuê gia sư từ người học/phụ huynh.        |
| `request_schedules`      | Lịch học mong muốn trong yêu cầu thuê.             |
| `negotiations`           | Lịch sử thương lượng giá/lịch học.                 |
| `negotiation_schedules`  | Lịch học được đề xuất trong từng lần thương lượng. |
| `request_status_history` | Lịch sử thay đổi trạng thái của yêu cầu thuê.      |

### Messaging & notifications

| Table           | Purpose                                   |
| --------------- | ----------------------------------------- |
| `conversations` | Cuộc trò chuyện gắn với một yêu cầu thuê. |
| `messages`      | Tin nhắn trong cuộc trò chuyện.           |
| `notifications` | Thông báo gửi đến người dùng.             |

### Content & Audit

| Table        | Purpose                                     |
| ------------ | ------------------------------------------- |
| `articles`   | Bài viết hoặc nội dung chia sẻ.             |
| `audit_logs` | Nhật ký thao tác quan trọng trong hệ thống. |

## Main Relationships

| Relationship                           | Cardinality                      |
| -------------------------------------- | -------------------------------- |
| `users` → `users_session`              | 1 - many                         |
| `users` → `password_reset_tokens`      | 1 - many                         |
| `users` → `tutor_profile`              | 1 - 1                            |
| `tutor_profile` ↔ `subjects`           | many - many via `tutor_subjects` |
| `provinces` → `districts`              | 1 - many                         |
| `tutor_profile` → `availability_slots` | 1 - many                         |
| `tutor_profile` → `courses`            | 1 - many                         |
| `subjects` → `courses`                 | 1 - many                         |
| `tutor_profile` → `hire_requests`      | 1 - many                         |
| `users` → `hire_requests`              | 1 - many as requester            |
| `hire_requests` → `request_schedules`  | 1 - many                         |
| `hire_requests` → `negotiations`       | 1 - many                         |
| `hire_requests` → `conversations`      | 1 - 1                            |
| `conversations` → `messages`           | 1 - many                         |
| `users` → `notifications`              | 1 - many                         |
| `users` → `articles`                   | 1 - many as author               |
| `users` → `audit_logs`                 | 1 - many as actor                |
