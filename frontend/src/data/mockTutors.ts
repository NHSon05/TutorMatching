import type { Tutor, TutorFilter } from "@/components/tutors/types";

export type * from "@/components/tutors/types";

export const mockTutors: Tutor[] = [
  {
    id: 1,
    name: "Lê Phương Diệu",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Tiếng Anh IELTS & Giao tiếp",
    rating: 5.0,
    location: "Cầu Giấy, Hà Nội",
    experience: "6 năm kinh nghiệm",
    sessionsCount: "1.200+ giờ dạy",
    tags: ["IELTS 8.5", "Giao tiếp", "Luyện thi ĐH", "+3"],
    priceFormatted: "250.000đ/h",
    pricePerHour: 250000,
    mode: "Online / Offline",
    category: "english",
    city: "hanoi",
    level: "highschool",
  },
  {
    id: 2,
    name: "Nguyễn Trọng Hưng",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Toán Chuyên & Luyện thi ĐH",
    rating: 4.8,
    location: "Thanh Xuân, Hà Nội",
    experience: "5 năm kinh nghiệm",
    sessionsCount: "950+ giờ dạy",
    tags: ["Toán 12", "Hình học", "Giải tích", "+2"],
    priceFormatted: "200.000đ/h",
    pricePerHour: 200000,
    mode: "Online",
    category: "math",
    city: "hanoi",
    level: "highschool",
  },
  {
    id: 3,
    name: "Tạ Bích Ngọc",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Ngữ Văn & Rèn chữ chuẩn",
    rating: 5.0,
    location: "Hải Châu, Đà Nẵng",
    experience: "8 năm kinh nghiệm",
    sessionsCount: "1.500+ giờ dạy",
    tags: ["Ngữ Văn 9-12", "Nghị luận", "Vào 10", "+4"],
    priceFormatted: "220.000đ/h",
    pricePerHour: 220000,
    mode: "Offline",
    category: "literature",
    city: "danang",
    level: "secondary",
  },
  {
    id: 4,
    name: "Đặng Minh Quân",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Vật Lý & Khoa học Tự nhiên",
    rating: 4.2,
    location: "Quận 1, TP. Hồ Chí Minh",
    experience: "3 năm kinh nghiệm",
    sessionsCount: "400+ giờ dạy",
    tags: ["Vật Lý 10-12", "Luyện đề", "Thí nghiệm", "+2"],
    priceFormatted: "180.000đ/h",
    pricePerHour: 180000,
    mode: "Offline",
    category: "physics",
    city: "hcm",
    level: "highschool",
  },
  {
    id: 5,
    name: "Hoàng Thùy Linh",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Hóa học & Bồi dưỡng HSG",
    rating: 5.0,
    location: "Ba Đình, Hà Nội",
    experience: "7 năm kinh nghiệm",
    sessionsCount: "1.100+ giờ dạy",
    tags: ["Hóa hữu cơ", "Hóa vô cơ", "Chuyên Hóa", "+3"],
    priceFormatted: "240.000đ/h",
    pricePerHour: 240000,
    mode: "Online / Offline",
    category: "chemistry",
    city: "hanoi",
    level: "highschool",
  },
  {
    id: 6,
    name: "Phạm Quốc Bảo",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=256",
    title: "Gia sư Tin học & Lập trình cho trẻ",
    rating: 4.7,
    location: "Quận 7, TP. Hồ Chí Minh",
    experience: "4 năm kinh nghiệm",
    sessionsCount: "650+ giờ dạy",
    tags: ["Python", "Scratch", "Tư duy Logic", "+2"],
    priceFormatted: "260.000đ/h",
    pricePerHour: 260000,
    mode: "Online / Offline",
    category: "it",
    city: "hcm",
    level: "primary",
  },
];

/**
 * Lọc danh sách gia sư dựa theo bộ lọc được cung cấp
 */
export function getMockTutors(filter?: TutorFilter): Tutor[] {
  if (!filter) return mockTutors;

  return mockTutors.filter((tutor) => {
    // 1. Lọc theo môn học
    if (filter.category && filter.category !== "all" && tutor.category !== filter.category) {
      return false;
    }
    // 2. Lọc theo thành phố
    if (filter.city && filter.city !== "all" && tutor.city !== filter.city) {
      return false;
    }
    // 3. Lọc theo cấp học
    if (filter.level && filter.level !== "all" && tutor.level !== filter.level) {
      return false;
    }
    // 4. Lọc theo hình thức học
    if (filter.mode && filter.mode !== "all") {
      if (filter.mode === "online" && !tutor.mode.includes("Online")) return false;
      if (filter.mode === "offline" && !tutor.mode.includes("Offline")) return false;
    }
    // 5. Tìm kiếm từ khóa tự do
    if (filter.search && filter.search.trim() !== "") {
      const q = filter.search.toLowerCase();
      const matchName = tutor.name.toLowerCase().includes(q);
      const matchTitle = tutor.title.toLowerCase().includes(q);
      const matchLocation = tutor.location.toLowerCase().includes(q);
      const matchTag = tutor.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchTitle && !matchLocation && !matchTag) return false;
    }

    return true;
  });
}

/**
 * Mock API mô phỏng lời gọi bất đồng bộ tới backend
 */
export async function fetchMockTutorsApi(filter?: TutorFilter): Promise<Tutor[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockTutors(filter));
    }, 100);
  });
}
