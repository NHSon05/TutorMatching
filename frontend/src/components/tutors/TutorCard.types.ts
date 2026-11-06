import type { TutorListItemResponse } from "@/lib/api/tutors";

/**
 * Props cho component TutorCard hiển thị dữ liệu hồ sơ gia sư thực tế từ API /api/v1/tutors
 */
export interface TutorCardProps {
  /**
   * Dữ liệu hồ sơ gia sư từ cơ sở dữ liệu thực tế (API /api/v1/tutors)
   */
  tutor: TutorListItemResponse;

  /**
   * CSS class bổ sung cho container thẻ
   */
  className?: string;

  /**
   * Callback khi người dùng nhấn đặt lịch / xem chi tiết
   */
  onBookTrial?: (tutorId: string) => void;

  /**
   * Callback khi người dùng nhấn nhắn tin cho gia sư
   */
  onSendMessage?: (tutorId: string) => void;

  /**
   * Callback khi người dùng toggle trạng thái yêu thích
   */
  onToggleFavorite?: (tutorId: string, isFavorite: boolean) => void;

  /**
   * Điểm số mức độ phù hợp (0..1 hoặc 0..100) khi hiển thị từ kết quả AI Matching
   */
  matchScore?: number;

  /**
   * Danh sách các tiêu chí khớp nổi bật từ AI Matching
   */
  matchHighlights?: string[];
}
