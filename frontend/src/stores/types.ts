import type { UserProfile, UserRole } from "@/types/user";
import type { AccountResponse } from "@/lib/api/auth";

export interface AuthState {
  /**
   * Thông tin hồ sơ người dùng hiện tại (null nếu chưa đăng nhập)
   */
  user: UserProfile | null;

  /**
   * Vai trò chính của người dùng (LEARNER | TUTOR | ADMIN)
   */
  role: UserRole | null;

  /**
   * Danh sách vai trò của người dùng (hỗ trợ mở rộng đa vai trò)
   */
  roles: UserRole[];

  /**
   * Trạng thái đã xác thực hay chưa
   */
  isAuthenticated: boolean;

  /**
   * Token truy cập API (nếu được client lưu trữ/sử dụng)
   */
  accessToken: string | null;

  /**
   * Thiết lập đầy đủ thông tin xác thực sau khi login/fetch session
   */
  setAuth: (payload: {
    user: UserProfile | AccountResponse;
    accessToken?: string | null;
  }) => void;

  /**
   * Cập nhật thông tin user profile
   */
  setUser: (user: UserProfile | AccountResponse | null) => void;

  /**
   * Cập nhật access token
   */
  setAccessToken: (token: string | null) => void;

  /**
   * Cập nhật một phần thông tin profile (ví dụ fullName, avatarUrl, phoneNumber)
   */
  updateProfile: (partial: Partial<UserProfile>) => void;

  /**
   * Xóa toàn bộ thông tin xác thực (khi logout hoặc phiên hết hạn)
   */
  clearAuth: () => void;
}
