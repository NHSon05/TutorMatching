/**
 * Vai trò chuẩn trong hệ thống (Persisted Roles)
 */
export type UserRole = "ADMIN" | "LEARNER" | "TUTOR";

/**
 * Trạng thái tài khoản người dùng
 */
export type AccountStatus = "ACTIVE" | "LOCKED" | "INACTIVE";

/**
 * Trạng thái hồ sơ gia sư trong quy trình onboarding/xét duyệt
 */
export type TutorProfileStatus = "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

/**
 * Thông tin tài khoản người dùng cơ bản
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  avatarUrl?: string;
  phoneNumber?: string;
  tutorProfileStatus?: TutorProfileStatus | null;
}
