/**
 * Vai trò chuẩn trong hệ thống (Persisted Roles)
 */
export type UserRole = "ADMIN" | "LEARNER" | "TUTOR";

/**
 * Trạng thái tài khoản người dùng
 */
export type AccountStatus = "ACTIVE" | "LOCKED" | "INACTIVE";

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
}
