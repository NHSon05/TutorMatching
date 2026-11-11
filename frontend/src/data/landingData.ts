export const PARTNER_SCHOOLS = [
  "ĐH Bách Khoa Hà Nội",
  "ĐH Ngoại Thương (FTU)",
  "ĐH Quốc Gia Hà Nội",
  "ĐH Sư Phạm Hà Nội",
  "THPT Chuyên Hà Nội - Amsterdam",
  "THPT Chuyên Khoa Học Tự Nhiên",
  "ĐH Quốc Gia TP.HCM",
  "THPT Chuyên Lê Hồng Phong",
];

export const PLATFORM_PORTRAITS = [
  {
    id: "tutors",
    title: "Đội ngũ Gia sư Tinh hoa",
    description:
      "100% gia sư trải qua quy trình kiểm duyệt hồ sơ, bằng cấp đại học và phỏng vấn năng lực sư phạm nghiêm ngặt trước khi nhận lớp.",
    ctaLabel: "Khám phá đội ngũ Gia sư",
    ctaHref: "/tutors",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=900&auto=format&fit=crop",
    badgeTitle: "ThS. Hoàng Minh Đức",
    badgeSubtitle: "Gia sư Toán Chuyên · ĐH Sư Phạm",
    badgeMetric: "9.9/10 Đánh giá",
  },
  {
    id: "tuition",
    title: "Học phí Minh bạch & Hiệu quả",
    description:
      "Tối ưu ngân sách học tập của gia đình với gợi ý học phí chuẩn xác theo khu vực, cấp học và cam kết chất lượng học thử 1-1.",
    ctaLabel: "Xem lộ trình & Học phí",
    ctaHref: "/tutors",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=900&auto=format&fit=crop",
    badgeTitle: "Nguyễn Hải Đăng",
    badgeSubtitle: "Học sinh Lớp 9 · Quận Cầu Giấy",
    badgeMetric: "+2.4 Điểm TB Học kỳ",
  },
  {
    id: "ai-agents",
    title: "Trợ lý AI Ghép nối Tức thì",
    description:
      "Trí tuệ nhân tạo phân tích mục tiêu, lịch rảnh và phong cách học tập để đề xuất gia sư phù hợp nhất chỉ trong 30 giây.",
    ctaLabel: "Trải nghiệm Trợ lý AI",
    ctaHref: "#ai-concierge",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=900&auto=format&fit=crop",
    badgeTitle: "TutorMatch AI Agent",
    badgeSubtitle: "Độ tương thích chuyên môn 99.4%",
    badgeMetric: "Khớp lệnh trong 30s",
  },
];

export const PERSONA_TABS = [
  {
    id: "parents",
    label: "Học sinh & Phụ huynh",
    eyebrow: "DÀNH CHO GIA ĐÌNH & HỌC VIÊN",
    title: "Tìm đúng người thầy truyền cảm hứng chỉ sau một câu mô tả.",
    description:
      "Không còn mất hàng tuần tìm kiếm trên các hội nhóm. Trợ lý AI của TutorMatch đối chiếu mục tiêu điểm số, tính cách của con và ngân sách gia đình để chọn ra 3 gia sư xuất sắc nhất.",
    bullets: [
      "Hồ sơ bằng cấp và căn cước được xác thực 100%",
      "Học thử 2 buổi đầu tiên để đánh giá mức độ phù hợp",
      "Báo cáo tiến độ và nhận xét sau từng buổi học",
    ],
    ctaLabel: "Tìm gia sư cho con ngay",
    ctaHref: "/tutors",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000&auto=format&fit=crop",
    overlayHeader: "Đề xuất Gia sư Toán Lớp 9 — Cầu Giấy",
    overlayItems: [
      {
        name: "Nguyễn Tuấn Anh",
        role: "ĐH Bách Khoa · 4 năm KN",
        score: "99% Phù hợp",
      },
      {
        name: "Trần Thu Hà",
        role: "ĐH Sư Phạm · Giải Nhất HSG",
        score: "97% Phù hợp",
      },
    ],
  },
  {
    id: "tutors",
    label: "Gia sư Tài năng",
    eyebrow: "DÀNH CHO GIÁO VIÊN & SINH VIÊN GIỎI",
    title: "Phát triển sự nghiệp giảng dạy 1-1 chuyên nghiệp, không lo phí ẩn.",
    description:
      "Hệ thống tự động thông báo các lớp học đúng chuyên môn, khu vực và mức học phí kỳ vọng của bạn. Tập trung 100% vào giảng dạy, mọi thủ tục quản lý lịch học đã có AI hỗ trợ.",
    bullets: [
      "Nhận lớp đúng chuyên môn và khu vực ưu tiên",
      "Công cụ giao bài tập, chấm điểm và lưu trữ giáo án",
      "Xây dựng thương hiệu cá nhân với hồ sơ đánh giá thực tế",
    ],
    ctaLabel: "Đăng ký làm Gia sư",
    ctaHref: "/register",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop",
    overlayHeader: "Lớp mới phù hợp với Hồ sơ của bạn",
    overlayItems: [
      {
        name: "Toán 12 Luyện thi ĐH",
        role: "Quận Đống Đa · 300k/buổi",
        score: "Mới đăng 5 phút",
      },
      {
        name: "Tư duy Logic AMC8",
        role: "Học Online · 280k/buổi",
        score: "Ưu tiên cao",
      },
    ],
  },
  {
    id: "exam-prep",
    label: "Luyện thi & Quốc tế",
    eyebrow: "ÔN THI CHUYÊN, ĐẠI HỌC & IELTS / SAT",
    title: "Lộ trình tăng tốc điểm số cùng các Thủ khoa & Thạc sĩ.",
    description:
      "Chinh phục kỳ thi vào lớp 10 Chuyên, Đánh giá năng lực ĐHQG, IELTS 7.5+ và SAT 1500+ với giáo trình cá nhân hóa theo từng giai đoạn nước rút.",
    bullets: [
      "Ngân hàng đề thi thử chuẩn cấu trúc mới nhất 2026",
      "Phân tích lỗi sai chi tiết bằng AI sau mỗi bài kiểm tra",
      "Cam kết đầu ra bằng hợp đồng đào tạo minh bạch",
    ],
    ctaLabel: "Khám phá lộ trình luyện thi",
    ctaHref: "/tutors",
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop",
    overlayHeader: "Lộ trình Nước rút 12 Tuần — IELTS & Chuyên",
    overlayItems: [
      {
        name: "IELTS Writing & Speaking",
        role: "Mục tiêu 7.5+ · GV 8.5 IELTS",
        score: "+1.5 Band",
      },
      {
        name: "Toán Chuyên vào Lớp 10",
        role: "Chuyên KHTN & Ams",
        score: "Top 5% Điểm thi",
      },
    ],
  },
  {
    id: "management",
    label: "Quản lý & Theo dõi",
    eyebrow: "ĐỒNG BỘ LỊCH HỌC & HỌC LIỆU",
    title: "Mọi tương tác giữa Gia đình và Gia sư trong một không gian số.",
    description:
      "Theo dõi chuyên cần, nội dung từng buổi học, nhận xét của gia sư và biểu đồ điểm số theo thời gian thực ngay trên điện thoại hoặc máy tính.",
    bullets: [
      "Lịch học tự động nhắc hẹn qua thông báo thông minh",
      "Kho bài tập về nhà và tài liệu PDF lưu trữ trọn đời",
      "Đổi lịch hoặc học bù linh hoạt chỉ với 1 chạm",
    ],
    ctaLabel: "Trải nghiệm Bảng điều khiển",
    ctaHref: "#workflow",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
    overlayHeader: "Báo cáo Học tập Tháng 11",
    overlayItems: [
      {
        name: "Chuyên cần & Bài tập",
        role: "Hoàn thành 16/16 buổi học",
        score: "100% Đúng hạn",
      },
      {
        name: "Điểm kiểm tra định kỳ",
        role: "Vật Lý & Toán Hình học",
        score: "9.2 / 10",
      },
    ],
  },
];

export const CUSTOMER_STORIES = [
  {
    id: "ams",
    badge: "THPT Chuyên Hà Nội - Amsterdam",
    quote:
      "“Chỉ sau 10 tuần học cùng gia sư Toán trên TutorMatch, cháu Minh Khôi đã tự tin giải trọn vẹn câu hình học nâng cao và đỗ nguyện vọng 1 vào lớp 10 Chuyên như ước mơ của cả gia đình.”",
    author: "Chị Nguyễn Thanh Hương",
    role: "Phụ huynh học sinh Nguyễn Minh Khôi · Quận Cầu Giấy, Hà Nội",
    image:
      "https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=1200&auto=format&fit=crop",
    metrics: [
      { value: "+2.8 điểm", label: "Tăng trưởng điểm thi Toán sau 10 tuần" },
      { value: "Top 3%", label: "Điểm đầu vào khối Chuyên năm 2026" },
    ],
  },
  {
    id: "ielts",
    badge: "Chứng chỉ Quốc tế IELTS 8.0",
    quote:
      "“Trợ lý AI gợi ý đúng cô giáo từng chấm thi IELTS giúp mình sửa từng lỗi phát âm và cấu trúc bài luận. Band điểm Speaking và Writing tăng từ 6.0 lên 8.0 chỉ trong 3 tháng học 1-1.”",
    author: "Lê Hoàng Bảo Trâm",
    role: "Học sinh lớp 12 · Săn học bổng Du học Úc",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop",
    metrics: [
      { value: "8.0 IELTS", label: "Đạt mục tiêu vượt kỳ vọng ban đầu (7.0)" },
      {
        value: "30 giây",
        label: "Thời gian khớp đúng gia sư chuyên luyện viết",
      },
    ],
  },
  {
    id: "bkhn",
    badge: "Thủ khoa Khối A00 — ĐH Bách Khoa",
    quote:
      "“Nền tảng giúp mình quản lý tới 6 lớp dạy kèm Vật Lý mà không hề bị trùng lịch. Học sinh đều được giao bài tập trực tuyến và phụ huynh cực kỳ yên tâm vì thấy kết quả từng tuần.”",
    author: "ThS. Trần Quốc Tuấn",
    role: "Gia sư Vật Lý tiêu biểu · 5 năm đồng hành cùng TutorMatch",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop",
    metrics: [
      { value: "98.6%", label: "Học sinh đỗ Đại học Nguyện vọng 1" },
      { value: "2.5x", label: "Tối ưu thời gian soạn bài & báo cáo tiến độ" },
    ],
  },
];

export const HOMEWORK_TABS = [
  "Cần làm",
  "Đang làm",
  "Đã hoàn thành",
  "Lưu trữ",
] as const;

export type HomeworkTab = (typeof HOMEWORK_TABS)[number];

export const HOMEWORK_ITEMS: Record<
  HomeworkTab,
  Array<{ title: string; subject: string; due: string; progress: string }>
> = {
  "Cần làm": [
    {
      title: "Chuyên đề Hàm số bậc hai & Đồ thị nâng cao",
      subject: "Toán Lớp 9 · Gia sư Hoàng Minh Đức",
      due: "Hạn nộp: 20:00 Tối nay",
      progress: "12 bài tập tự luận",
    },
    {
      title: "Luyện đề IELTS Academic Writing Task 2 — Environment",
      subject: "Tiếng Anh · Cô Lê Bảo Ngọc",
      due: "Hạn nộp: Thứ Sáu tuần này",
      progress: "250 từ tối thiểu",
    },
  ],
  "Đang làm": [
    {
      title: "Bài tập Động lực học chất điểm & Định luật Newton",
      subject: "Vật Lý 10 · Thầy Trần Quốc Tuấn",
      due: "Đã hoàn thành 75%",
      progress: "15/20 câu trắc nghiệm",
    },
  ],
  "Đã hoàn thành": [
    {
      title: "Đề thi thử vào 10 môn Toán — Sở GD&ĐT Hà Nội",
      subject: "Toán Lớp 9 · Đã chấm điểm",
      due: "Điểm số: 9.25 / 10",
      progress: "Nhận xét: Tư duy hình học rất tốt",
    },
  ],
  "Lưu trữ": [
    {
      title: "Tổng hợp 500 từ vựng Học thuật Cambridge B2-C1",
      subject: "Tiếng Anh · Học kỳ I",
      due: "Đã lưu vào kho học liệu",
      progress: "Hoàn thành 100%",
    },
  ],
};

export const PROGRAM_LEVELS = [
  {
    level: "Tiểu học (Lớp 1 – 5)",
    focus: "Xây dựng nền tảng Toán tư duy, Tiếng Việt & Tiếng Anh trẻ em",
    tutors: "1.450+ Gia sư",
    subjects: ["Toán Tư duy", "Tiếng Anh thiếu nhi", "Rèn chữ & Đọc hiểu"],
  },
  {
    level: "THCS & Ôn thi vào 10 (Lớp 6 – 9)",
    focus: "Bứt phá điểm số học kỳ và chinh phục trường Chuyên, lớp Chọn",
    tutors: "2.180+ Gia sư",
    subjects: [
      "Toán Hình & Đại",
      "Ngữ Văn",
      "Tiếng Anh",
      "KHTN (Lý - Hóa - Sinh)",
    ],
  },
  {
    level: "THPT & Luyện thi ĐH (Lớp 10 – 12)",
    focus: "Luyện đề chuyên sâu Tốt nghiệp THPT & Đánh giá năng lực",
    tutors: "1.920+ Gia sư",
    subjects: ["Toán 12", "Vật Lý", "Hóa Học", "Sinh Học", "ĐGNL ĐHQG"],
  },
  {
    level: "Chứng chỉ Quốc tế & Đi làm",
    focus: "Luyện thi IELTS, SAT, Giao tiếp thương mại & Lập trình",
    tutors: "890+ Gia sư",
    subjects: [
      "IELTS 7.5+",
      "SAT Math/Verbal",
      "Python & Web",
      "Tiếng Trung / Nhật",
    ],
  },
];
