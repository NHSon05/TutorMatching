# Database Schema

Tài liệu mô tả cấu trúc cơ sở dữ liệu cho hệ thống Tutor Matching.

## Entity Relationship Diagram

```dbml
title Entity Relationship Diagram

Users {
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

Users_Session {
  session_id string pk
  user_id string fk
  token_hash string unique
  expires_at datetime
  revoked_at datetime nullable
  created_at datetime
}

Password_Reset_Tokens {
  reset_token_id string pk
  user_id string fk
  token_hash string unique
  expires_at datetime
  used_at datetime nullable
  created_at datetime
}

Tutor_Profile {
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

Subjects {
  subject_id string pk
  name string unique
  description text nullable
  is_active boolean
  created_at datetime
  updated_at datetime
}

Tutor_Subjects {
  tutor_profile_id string pk fk
  subject_id string pk fk
  level_description string nullable
  created_at datetime
}

Provinces {
  province_code string pk
  province_name string unique
  is_active boolean
}

Districts {
  district_code string pk
  province_code string fk
  district_name string
  is_active boolean
}

Availability_Slots {
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

Courses {
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

Tutor_Profile_Reviews {
  review_id string pk
  tutor_profile_id string fk
  reviewer_user_id string fk
  from_status_code string
  to_status_code string
  note text nullable
  reviewed_at datetime
}

Hire_Requests {
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

Request_Schedules {
  request_schedule_id string pk
  hire_request_id string fk
  day_of_week integer
  start_time time
  end_time time
  created_at datetime
}

Negotiations {
  negotiation_id string pk
  hire_request_id string fk
  sender_user_id string fk
  proposed_price_vnd integer nullable
  note text nullable
  response_status_code string
  responded_at datetime nullable
  created_at datetime
}

Negotiation_Schedules {
  negotiation_schedule_id string pk
  negotiation_id string fk
  day_of_week integer
  start_time time
  end_time time
}

Request_Status_History {
  history_id string pk
  hire_request_id string fk
  actor_user_id string fk nullable
  from_status_code string nullable
  to_status_code string
  reason text nullable
  created_at datetime
}

Conversations {
  conversation_id string pk
  hire_request_id string fk unique
  created_at datetime
  closed_at datetime nullable
}

Messages {
  message_id string pk
  conversation_id string fk
  sender_user_id string fk
  content text
  sent_at datetime
  read_at datetime nullable
  deleted_at datetime nullable
}

Notifications {
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

Articles {
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

Audit_Logs {
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

Users.user_id < Users_Session.user_id
Users.user_id < Password_Reset_Tokens.user_id
Users.user_id - Tutor_Profile.user_id

Tutor_Profile.tutor_profile_id < Tutor_Subjects.tutor_profile_id
Subjects.subject_id < Tutor_Subjects.subject_id

Provinces.province_code < Districts.province_code

Tutor_Profile.tutor_profile_id < Availability_Slots.tutor_profile_id

Tutor_Profile.tutor_profile_id < Courses.tutor_profile_id
Subjects.subject_id < Courses.subject_id

Tutor_Profile.tutor_profile_id < Tutor_Profile_Reviews.tutor_profile_id
Users.user_id < Tutor_Profile_Reviews.reviewer_user_id

Users.user_id < Hire_Requests.requester_user_id
Tutor_Profile.tutor_profile_id < Hire_Requests.tutor_profile_id
Subjects.subject_id < Hire_Requests.subject_id
Courses.course_id < Hire_Requests.course_id

Hire_Requests.hire_request_id < Request_Schedules.hire_request_id

Hire_Requests.hire_request_id < Negotiations.hire_request_id
Users.user_id < Negotiations.sender_user_id

Negotiations.negotiation_id < Negotiation_Schedules.negotiation_id

Hire_Requests.hire_request_id < Request_Status_History.hire_request_id
Users.user_id < Request_Status_History.actor_user_id

Hire_Requests.hire_request_id - Conversations.hire_request_id

Conversations.conversation_id < Messages.conversation_id
Users.user_id < Messages.sender_user_id

Users.user_id < Notifications.user_id
Hire_Requests.hire_request_id < Notifications.hire_request_id
Messages.message_id < Notifications.message_id
Tutor_Profile.tutor_profile_id < Notifications.tutor_profile_id

Users.user_id < Articles.author_user_id

Users.user_id < Audit_Logs.actor_user_id
```

## Entity Groups

### Authentication & Users

| Table                   | Purpose                             |
| ----------------------- | ----------------------------------- |
| `Users`                 | Lưu thông tin tài khoản người dùng. |
| `Users_Session`         | Lưu session/token đăng nhập.        |
| `Password_Reset_Tokens` | Lưu token đặt lại mật khẩu.         |

### Tutor Profile & Catalog

| Table                   | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `Tutor_Profile`         | Hồ sơ gia sư, thông tin hiển thị, giá, trạng thái duyệt. |
| `Subjects`              | Danh mục môn học.                                        |
| `Tutor_Subjects`        | Bảng liên kết nhiều-nhiều giữa gia sư và môn học.        |
| `Availability_Slots`    | Lịch rảnh của gia sư.                                    |
| `Courses`               | Gói học hoặc khóa học do gia sư tạo.                     |
| `Tutor_Profile_Reviews` | Lịch sử admin/reviewer duyệt hồ sơ gia sư.               |

### Location

| Table       | Purpose                                   |
| ----------- | ----------------------------------------- |
| `Provinces` | Danh mục tỉnh/thành phố.                  |
| `Districts` | Danh mục quận/huyện thuộc tỉnh/thành phố. |

### Hiring & Negotiation

| Table                    | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `Hire_Requests`          | Yêu cầu thuê gia sư từ người học/phụ huynh.        |
| `Request_Schedules`      | Lịch học mong muốn trong yêu cầu thuê.             |
| `Negotiations`           | Lịch sử thương lượng giá/lịch học.                 |
| `Negotiation_Schedules`  | Lịch học được đề xuất trong từng lần thương lượng. |
| `Request_Status_History` | Lịch sử thay đổi trạng thái của yêu cầu thuê.      |

### Messaging & Notifications

| Table           | Purpose                                   |
| --------------- | ----------------------------------------- |
| `Conversations` | Cuộc trò chuyện gắn với một yêu cầu thuê. |
| `Messages`      | Tin nhắn trong cuộc trò chuyện.           |
| `Notifications` | Thông báo gửi đến người dùng.             |

### Content & Audit

| Table        | Purpose                                     |
| ------------ | ------------------------------------------- |
| `Articles`   | Bài viết hoặc nội dung chia sẻ.             |
| `Audit_Logs` | Nhật ký thao tác quan trọng trong hệ thống. |

## Main Relationships

| Relationship                           | Cardinality                      |
| -------------------------------------- | -------------------------------- |
| `Users` → `Users_Session`              | 1 - many                         |
| `Users` → `Password_Reset_Tokens`      | 1 - many                         |
| `Users` → `Tutor_Profile`              | 1 - 1                            |
| `Tutor_Profile` ↔ `Subjects`           | many - many via `Tutor_Subjects` |
| `Provinces` → `Districts`              | 1 - many                         |
| `Tutor_Profile` → `Availability_Slots` | 1 - many                         |
| `Tutor_Profile` → `Courses`            | 1 - many                         |
| `Subjects` → `Courses`                 | 1 - many                         |
| `Tutor_Profile` → `Hire_Requests`      | 1 - many                         |
| `Users` → `Hire_Requests`              | 1 - many as requester            |
| `Hire_Requests` → `Request_Schedules`  | 1 - many                         |
| `Hire_Requests` → `Negotiations`       | 1 - many                         |
| `Hire_Requests` → `Conversations`      | 1 - 1                            |
| `Conversations` → `Messages`           | 1 - many                         |
| `Users` → `Notifications`              | 1 - many                         |
| `Users` → `Articles`                   | 1 - many as author               |
| `Users` → `Audit_Logs`                 | 1 - many as actor                |
