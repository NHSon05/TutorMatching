import type { ApiProblemDetails } from "@/lib/api/auth";

/**
 * Độ dài mật khẩu tối thiểu và tối đa
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Các trường nhập dữ liệu trong biểu mẫu đăng ký
 */
export type RegistrationField =
  | "fullName"
  | "email"
  | "password"
  | "passwordConfirmation"
  | "role";

/**
 * Đối tượng chứa thông báo lỗi cho từng trường
 */
export type FieldErrors = Partial<Record<RegistrationField, string>>;

/**
 * Đối tượng lỗi trả về từ API đăng ký
 */
export interface RegistrationError extends Error {
  status?: number;
  errors?: ApiProblemDetails["errors"];
}

/**
 * Các vai trò người dùng có thể lựa chọn khi đăng ký
 */
export type RegisterRole = "TUTOR" | "PARENT" | "STUDENT";

/**
 * Tùy chọn vai trò cho SegmentedControl
 */
export interface RoleOption {
  value: RegisterRole | string;
  label: string;
}

/**
 * Thông tin mã quốc gia cho trường số điện thoại
 */
export interface CountryOption {
  code: string;
  flag: string;
  name: string;
}

/**
 * Thông tin bước hướng dẫn đăng ký
 */
export interface RegistrationStepItem {
  step: number;
  title: string;
  isActive?: boolean;
}

/**
 * Dữ liệu đầu vào của biểu mẫu đăng ký
 */
export interface RegisterFormData {
  role: RegisterRole | string;
  email: string;
  phoneNumber: string;
  selectedCountry: CountryOption;
  fullName: string;
  password: string;
  confirmPassword: string;
}

/**
 * Props của component RegisterCard
 */
export interface RegisterCardProps {
  className?: string;
  onSuccess?: () => void;
}

/**
 * Danh sách các mã vùng quốc gia hỗ trợ
 */
export const SUPPORTED_COUNTRIES: CountryOption[] = [
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+374", flag: "🇦🇲", name: "Armenia" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
];

/**
 * Quốc gia mặc định
 */
export const DEFAULT_COUNTRY: CountryOption = {
  code: "+84",
  flag: "🇻🇳",
  name: "Vietnam",
};

/**
 * Danh sách tùy chọn vai trò
 */
export const ROLE_OPTIONS: RoleOption[] = [
  { value: "TUTOR", label: "Gia sư" },
  { value: "PARENT", label: "Phụ Huynh" },
  { value: "STUDENT", label: "Học Sinh" },
];

/**
 * Danh sách 3 bước hướng dẫn tài khoản
 */
export const REGISTRATION_STEPS: RegistrationStepItem[] = [
  { step: 1, title: "Đăng ký tài khoản", isActive: true },
  { step: 2, title: "Cài đặt thông tin", isActive: false },
  { step: 3, title: "Xác nhận thông tin", isActive: false },
];
