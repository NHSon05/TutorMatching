# Data Model: Hire Request Payment & Post-Lesson Tutor Reviews

**Feature**: `009-hire-payment-and-reviews` | **Date**: 2026-11-08

---

## 1. Entity Relationship Diagram

```mermaid
erDiagram
    user_accounts ||--o{ hire_requests : "requests"
    tutor_profiles ||--o{ hire_requests : "receives"
    courses ||--o{ hire_requests : "optional package"
    hire_requests ||--o{ hire_payments : "funded by"
    hire_requests ||--o| hire_reviews : "reviewed once"
    tutor_profiles ||--o{ hire_reviews : "aggregates rating"

    hire_requests {
        uuid id PK
        uuid requester_user_id FK
        uuid tutor_profile_id FK
        uuid course_id FK
        int sessions_per_week
        int agreed_price_vnd
        varchar status_code
        varchar payment_status_code "UNPAID | PENDING | PAID | REFUNDED"
        timestamptz paid_at
        timestamptz completed_at
    }

    hire_payments {
        uuid id PK
        uuid hire_request_id FK
        uuid payer_user_id FK
        uuid idempotency_key
        int unit_price_vnd
        int billing_sessions
        int amount_vnd
        varchar provider_code "VIETQR_SANDBOX"
        varchar transfer_reference
        varchar qr_payload
        varchar status_code "PENDING | PAID | FAILED | CANCELLED | REFUNDED"
        timestamptz paid_at
        timestamptz created_at
        timestamptz updated_at
    }

    hire_reviews {
        uuid id PK
        uuid hire_request_id PK,FK "UNIQUE (1:1 per hire_request)"
        uuid tutor_profile_id FK
        uuid reviewer_user_id FK
        int rating "1..5"
        varchar comment "nullable, max 1000"
        varchar tutor_reply "nullable, max 1000"
        timestamptz tutor_replied_at
        boolean is_visible
        timestamptz created_at
        timestamptz updated_at
    }

    tutor_profiles {
        uuid id PK
        numeric average_rating "numeric(3,2) default 0.00"
        int review_count "default 0"
    }
```

---

## 2. Physical Constraints & Indexes (`snake_case`)

### `hire_requests` (Additive Columns)

- `payment_status_code varchar(24) NOT NULL DEFAULT 'UNPAID'`
  - Check constraint `ck_hire_requests_payment_status_code`: `payment_status_code IN ('UNPAID', 'PENDING', 'PAID', 'REFUNDED')`
- `paid_at timestamptz NULL`

### `hire_payments` (New Table)

- Primary Key: `pk_hire_payments (id)`
- Foreign Keys:
  - `fk_hire_payments_hire_requests_hire_request_id` → `hire_requests(id)` (`ON DELETE CASCADE`)
  - `fk_hire_payments_user_accounts_payer_user_id` → `user_accounts(id)` (`ON DELETE RESTRICT`)
- Unique Constraints:
  - `ix_hire_payments_payer_user_id_idempotency_key` UNIQUE `(payer_user_id, idempotency_key)`
- Indexes:
  - `ix_hire_payments_hire_request_id_created_at` `(hire_request_id, created_at DESC)`
- Check Constraints:
  - `ck_hire_payments_positive_amounts`: `unit_price_vnd > 0 AND billing_sessions > 0 AND amount_vnd = unit_price_vnd * billing_sessions`
  - `ck_hire_payments_status_code`: `status_code IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')`

### `hire_reviews` (New Table)

- Primary Key: `pk_hire_reviews (id)`
- Unique Constraints:
  - `ix_hire_reviews_hire_request_id` UNIQUE `(hire_request_id)`
- Indexes:
  - `ix_hire_reviews_tutor_profile_id_is_visible_created_at` `(tutor_profile_id, is_visible, created_at DESC)`
- Check Constraints:
  - `ck_hire_reviews_rating`: `rating >= 1 AND rating <= 5`

### `tutor_profiles` (Additive Columns)

- `average_rating numeric(3,2) NOT NULL DEFAULT 0.00`
- `review_count integer NOT NULL DEFAULT 0`
