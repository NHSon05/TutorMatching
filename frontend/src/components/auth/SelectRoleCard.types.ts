export type RoleId = "TUTOR" | "PARENT" | "STUDENT";

export interface RoleCardOption {
  id: RoleId;
  title: "Gia sư" | "Phụ Huynh" | "Học Sinh";
  badge: string;
  icon: string;
  description: string;
  highlights: string[];
}

export interface SelectRoleCardProps {
  className?: string;
  onRoleSelected?: (role: RoleId) => void;
}

export const ROLE_CARD_OPTIONS: RoleCardOption[] = [
  {
    id: "TUTOR",
    title: "Gia sư",
    badge: "Người dạy",
    icon: "👨‍🏫",
    description: "Chia sẻ tri thức, tạo nguồn thu nhập linh hoạt và xây dựng thương hiệu gia sư uy tín.",
    highlights: ["Tạo hồ sơ chuyên môn", "Nhận lớp học phù hợp", "Thu nhập minh bạch"],
  },
  {
    id: "PARENT",
    title: "Phụ Huynh",
    badge: "Gia đình",
    icon: "👨‍👩‍👧",
    description: "Tìm kiếm gia sư chất lượng cao, giám sát tiến độ học tập và đồng hành cùng sự tiến bộ của con.",
    highlights: ["Gia sư được kiểm duyệt", "Theo dõi lịch học", "Hỗ trợ học phí an toàn"],
  },
  {
    id: "STUDENT",
    title: "Học Sinh",
    badge: "Người học",
    icon: "🎓",
    description: "Kết nối gia sư tận tâm, giải đáp kiến thức kịp thời và nâng cao thành tích học tập vượt bậc.",
    highlights: ["Học 1-kèm-1 theo nhu cầu", "Lộ trình cá nhân hóa", "Kho tài liệu phong phú"],
  },
];

export const roleOptions = ROLE_CARD_OPTIONS;
