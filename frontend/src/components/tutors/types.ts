/**
 * Danh mục bộ môn gia sư
 */
export type TutorCategory =
  | "math"
  | "english"
  | "physics"
  | "chemistry"
  | "literature"
  | "it";

/**
 * Thành phố / khu vực
 */
export type TutorCity = "hanoi" | "danang" | "hcm";

/**
 * Cấp bậc giảng dạy
 */
export type TutorLevel =
  | "primary"
  | "secondary"
  | "highschool"
  | "university";

/**
 * Hình thức dạy học
 */
export type TutorMode = "Online" | "Offline" | "Online / Offline";

/**
 * Thực thể hồ sơ gia sư trên giao diện danh sách
 */
export interface Tutor {
  id: number;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  location: string;
  experience: string;
  sessionsCount: string;
  tags: string[];
  priceFormatted: string;
  pricePerHour: number;
  mode: TutorMode;
  category: TutorCategory;
  city: TutorCity;
  level: TutorLevel;
}

/**
 * Bộ lọc tìm kiếm gia sư
 */
export interface TutorFilter {
  category?: string;
  city?: string;
  level?: string;
  mode?: string;
  search?: string;
}

/**
 * Props cho component client danh sách gia sư
 */
export interface TutorsListClientProps {
  initialTutors: Tutor[];
}
