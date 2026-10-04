export interface ScheduleSlot {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

export interface TutorSchedule {
  thu2: ScheduleSlot;
  thu3: ScheduleSlot;
  thu4: ScheduleSlot;
  thu5: ScheduleSlot;
  thu6: ScheduleSlot;
  thu7: ScheduleSlot;
  chuNhat: ScheduleSlot;
}

export interface Tutor {
  id: number;
  code: string;
  name: string;
  role: "Sinh viên" | "Giáo viên" | "Cử nhân";
  avatar: string;
  birthYear: number;
  gender: "Nam" | "Nữ";
  hometown: string;
  voice: string;
  degree: string;
  major: string;
  school: string;
  teachingForm: "Offline tại nhà" | "Online trực tuyến" | "Offline + Online";
  province: string;
  districts: string;
  subjects: string[];
  levels: string[];
  subjectDetail: string;
  experience: string;
  schedule: TutorSchedule;
  isVerified: boolean;
}

export const SUBJECT_OPTIONS = [
  "Toán",
  "Tiếng Việt",
  "Luyện chữ",
  "Toán + Tiếng Việt",
  "Vật lý",
  "Hoá học",
  "Ngữ văn",
  "Lịch sử",
  "Địa lý",
  "Sinh học",
  "Tin học",
  "Tiếng Anh",
  "Tiếng Trung",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Âm nhạc (Đàn)",
  "Hội hoạ (Vẽ)",
  "Đánh cờ",
];

export const LEVEL_OPTIONS = [
  "Mầm non",
  "Cấp 1",
  "Cấp 2",
  "Cấp 3",
  "Luyện thi Đại học",
  "Giao tiếp",
  "Người đi làm",
];

export const PROVINCE_OPTIONS = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Quảng Ninh",
  "Hải Dương",
  "Bắc Ninh",
  "Nghệ An",
  "Cần Thơ",
];

export const MOCK_TUTORS: Tutor[] = [
  {
    id: 656,
    code: "GS1627",
    name: "Lê Phương Diệu",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/b48a22a13e0b5d4b5fd88df3773b4024.jpeg",
    birthYear: 2004,
    gender: "Nữ",
    hometown: "Hải Dương",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Luật - Khoa luật quốc tế",
    school: "Trường đại học Luật Hà Nội",
    teachingForm: "Offline tại nhà",
    province: "Hà Nội",
    districts: "Q.Ba Đình, Q.Tây Hồ, Q.Cầu Giấy, Q.Đống Đa",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2", "Cấp 3"],
    subjectDetail: "Tiếng Anh: Tiếng Anh cấp 1, Tiếng Anh cấp 2, Tiếng Anh cấp 3",
    experience: `1. Thành tích học tập
- 12 năm học sinh giỏi
- Cấp 2 tham gia đội tuyển học sinh giỏi Tiếng Anh
- 3 năm cấp 3 đạt trung bình môn Tiếng Anh 8.5-9.2.
- Đạt 9,25 điểm thi Tiếng Anh THPTQG
- Tham gia các cuộc thi tranh biện bằng Tiếng Anh
- Đạt chứng chỉ Toeic 880 điểm tương đương với 7.0 Ielts

Kinh nghiệm:
- 2 năm gia sư Tiếng Anh chủ yếu cho các bạn cấp 1,2
- Đã có kinh nghiệm dạy các bạn học Vinschool ( hiện tại em cũng đang kèm Tiếng Anh cho 2 bạn học Vins và kèm 1 bạn lớp 9 trường công )
- Đã có kinh nghiệm 1 năm làm trợ giảng tại Trung tâm Tiếng Anh Cham Toeic`,
    schedule: {
      thu2: { morning: true, afternoon: true, evening: false },
      thu3: { morning: true, afternoon: true, evening: false },
      thu4: { morning: true, afternoon: true, evening: false },
      thu5: { morning: true, afternoon: true, evening: false },
      thu6: { morning: true, afternoon: true, evening: true },
      thu7: { morning: false, afternoon: false, evening: true },
      chuNhat: { morning: false, afternoon: true, evening: false },
    },
    isVerified: true,
  },
  {
    id: 655,
    code: "GS1626",
    name: "Phùng Huyền Trang",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/b93a9bb6a18fb5a457fc9779a67a4cc7.jpg",
    birthYear: 2005,
    gender: "Nữ",
    hometown: "Hoà Bình",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Đại học Luật Hà Nội",
    school: "Đại Học Luật Hà Nội",
    teachingForm: "Offline tại nhà",
    province: "Hà Nội",
    districts: "Q.Đống Đa",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2"],
    subjectDetail: "Tiếng Anh: Tiếng Anh cấp 1, Tiếng Anh cấp 2, Giao tiếp cơ bản",
    experience: `1. Thành tích học tập
- Giải Nhì học sinh giỏi tiếng Anh cấp Tỉnh
- Điểm thi đại học môn Tiếng Anh 9.4
- Điểm rèn luyện xuất sắc tại ĐH Luật Hà Nội

Kinh nghiệm:
- 1.5 năm gia sư tiếng Anh cho học sinh cấp 1 và cấp 2
- Phương pháp dạy cuốn hút, nắm bắt tâm lý học sinh tốt`,
    schedule: {
      thu2: { morning: false, afternoon: true, evening: true },
      thu3: { morning: false, afternoon: true, evening: true },
      thu4: { morning: false, afternoon: true, evening: true },
      thu5: { morning: false, afternoon: true, evening: true },
      thu6: { morning: false, afternoon: true, evening: false },
      thu7: { morning: true, afternoon: true, evening: false },
      chuNhat: { morning: true, afternoon: false, evening: false },
    },
    isVerified: true,
  },
  {
    id: 653,
    code: "GS1624",
    name: "Tạ Bích Ngọc",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/70a4766650f1524de3d5fac6b644b2e8.jpg",
    birthYear: 2005,
    gender: "Nữ",
    hometown: "Bắc Ninh",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Ngôn ngữ Anh",
    school: "Đại học Ngoại ngữ - Đại học Quốc gia Hà Nội",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Cầu Giấy, Q.Bắc Từ Liêm, Q.Nam Từ Liêm",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2", "Cấp 3", "Luyện thi Đại học"],
    subjectDetail: "Tiếng Anh: Tiếng Anh THPT, Luyện thi đại học, IELTS Foundation",
    experience: `1. Thành tích học tập
- Sinh viên chuyên ngành Ngôn ngữ Anh ULIS
- IELTS 7.5 (Listening 8.5, Reading 8.0)
- Thủ khoa đầu vào khối D trường THPT Chuyên

Kinh nghiệm:
- 2 năm kinh nghiệm dạy kèm tiếng Anh THPT và ôn thi vào 10
- Học sinh tiến bộ rõ rệt từ 5-6 điểm lên 8+ điểm sau 3 tháng`,
    schedule: {
      thu2: { morning: true, afternoon: false, evening: true },
      thu3: { morning: true, afternoon: false, evening: true },
      thu4: { morning: true, afternoon: false, evening: true },
      thu5: { morning: false, afternoon: false, evening: true },
      thu6: { morning: true, afternoon: false, evening: true },
      thu7: { morning: true, afternoon: true, evening: true },
      chuNhat: { morning: true, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 651,
    code: "GS1622",
    name: "Nguyễn Đỗ Ngọc Bích",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/3d0b64a46166e7cabe43b34e107ff8c4.jpeg",
    birthYear: 2006,
    gender: "Nữ",
    hometown: "Hà Nội",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Ngôn Ngữ Anh",
    school: "Đại Học Thăng Long",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Ba Đình, Q.Hoàn Kiếm, Q.Đống Đa, Q.Hai Bà Trưng, Q.Hoàng Mai",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2"],
    subjectDetail: "Tiếng Anh: Ngữ pháp tiểu học, Luyện phát âm chuẩn IPA, Tiếng Anh giao tiếp",
    experience: `1. Thành tích học tập
- Đạt chứng chỉ tiếng Anh B2 First (FCE)
- 12 năm đạt danh hiệu học sinh Giỏi

Kinh nghiệm:
- Dạy kèm các bé tiểu học chương trình Cambridge và Bộ GD&ĐT
- Kiên nhẫn, yêu trẻ em và có giáo trình sinh động bằng hình ảnh`,
    schedule: {
      thu2: { morning: true, afternoon: true, evening: false },
      thu3: { morning: true, afternoon: true, evening: false },
      thu4: { morning: true, afternoon: true, evening: false },
      thu5: { morning: true, afternoon: true, evening: false },
      thu6: { morning: true, afternoon: true, evening: false },
      thu7: { morning: false, afternoon: true, evening: true },
      chuNhat: { morning: false, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 650,
    code: "GS1621",
    name: "Nguyễn Thị Thuỳ Linh",
    role: "Giáo viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/a4fd87b2947e00049530bb4dd9a31ad7.jpeg",
    birthYear: 2003,
    gender: "Nữ",
    hometown: "Nghệ An",
    voice: "Miền Trung",
    degree: "Đại học",
    major: "Khoa học xã hội, truyền thông và ngôn ngữ",
    school: "Arizona State University",
    teachingForm: "Online trực tuyến",
    province: "Nghệ An",
    districts: "Tx.Cửa Lò, TP.Vinh (Hỗ trợ Online toàn quốc)",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 2", "Cấp 3", "Giao tiếp", "Người đi làm"],
    subjectDetail: "Tiếng Anh: Du học, IELTS, Giao tiếp công sở phản xạ nhanh",
    experience: `1. Thành tích học tập
- Cựu du học sinh Arizona State University (USA)
- IELTS 8.0 overall (Speaking 8.5)
- Tốt nghiệp loại Giỏi chuyên ngành Ngôn ngữ & Truyền thông

Kinh nghiệm:
- 3 năm giảng dạy tiếng Anh trực tuyến cho học sinh trong và ngoài nước
- Huấn luyện viên thuyết trình và phản xạ tiếng Anh tự nhiên`,
    schedule: {
      thu2: { morning: false, afternoon: false, evening: true },
      thu3: { morning: false, afternoon: false, evening: true },
      thu4: { morning: false, afternoon: false, evening: true },
      thu5: { morning: false, afternoon: false, evening: true },
      thu6: { morning: false, afternoon: false, evening: true },
      thu7: { morning: true, afternoon: true, evening: true },
      chuNhat: { morning: true, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 648,
    code: "GS1619",
    name: "Phạm Bảo Trân",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/69403e274be3eb688323d950c9bfe5fb.jpeg",
    birthYear: 2006,
    gender: "Nữ",
    hometown: "Hà Nội",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Luật",
    school: "Đại học Luật Hà Nội",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Ba Đình, Q.Hoàn Kiếm, Q.Tây Hồ, Q.Cầu Giấy, Q.Đống Đa, Q.Hai Bà Trưng",
    subjects: ["Toán", "Tiếng Việt", "Toán + Tiếng Việt", "Ngữ văn", "Tiếng Anh"],
    levels: ["Mầm non", "Cấp 1", "Cấp 2"],
    subjectDetail: "Toán & Tiếng Việt cấp 1, Ngữ văn THCS, Tiếng Anh cơ bản",
    experience: `1. Thành tích học tập
- Điểm thi THPTQG: Văn 9.25, Toán 8.8, Tiếng Anh 9.0
- Giải Ba kỳ thi học sinh giỏi Văn cấp thành phố

Kinh nghiệm:
- 1 năm kèm bài cho học sinh tiểu học và lớp 6-7
- Dạy cẩn thận, rèn chữ đẹp và tư duy làm văn mạch lạc`,
    schedule: {
      thu2: { morning: true, afternoon: true, evening: false },
      thu3: { morning: true, afternoon: true, evening: false },
      thu4: { morning: true, afternoon: true, evening: false },
      thu5: { morning: true, afternoon: true, evening: false },
      thu6: { morning: true, afternoon: true, evening: false },
      thu7: { morning: true, afternoon: true, evening: true },
      chuNhat: { morning: true, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 647,
    code: "GS1618",
    name: "Nguyễn Trọng Hưng",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/b299f1c922b8aed997a2bb5b53fd1d4a.jpg",
    birthYear: 2006,
    gender: "Nam",
    hometown: "Quảng Ninh",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Luật Kinh Tế",
    school: "Đại Học Kinh Tế Quốc Dân",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Đống Đa, Q.Hai Bà Trưng, Q.Hoàng Mai, Q.Thanh Xuân",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 2", "Cấp 3"],
    subjectDetail: "Tiếng Anh: Luyện thi vào 10, Tiếng Anh THPT, Ngữ pháp nâng cao",
    experience: `1. Thành tích học tập
- Sinh viên Đại học Kinh Tế Quốc Dân (NEU)
- IELTS 7.5, Điểm thi tốt nghiệp môn Tiếng Anh: 9.6

Kinh nghiệm:
- Hơn 1 năm làm gia sư cho các bạn nam lười học môn tiếng Anh, giúp các bạn lấy lại gốc kiến thức`,
    schedule: {
      thu2: { morning: false, afternoon: true, evening: true },
      thu3: { morning: false, afternoon: true, evening: true },
      thu4: { morning: false, afternoon: true, evening: true },
      thu5: { morning: false, afternoon: true, evening: true },
      thu6: { morning: false, afternoon: true, evening: true },
      thu7: { morning: false, afternoon: true, evening: true },
      chuNhat: { morning: false, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 645,
    code: "GS1616",
    name: "Bùi Khánh Huyền",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/f14dda0fc75a12803f3254022ae31838.jpeg",
    birthYear: 2007,
    gender: "Nữ",
    hometown: "Hà Nội",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Logistic và quản lý chuỗi cung ứng",
    school: "Đại học Thương mại",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Hoàng Mai, Q.Thanh Xuân, Q.Hà Đông, H.Thanh Trì",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2"],
    subjectDetail: "Tiếng Anh: Nghe nói phản xạ, Tiếng Anh cấp 1 & 2",
    experience: `1. Thành tích học tập
- Cựu học sinh trường THPT Kim Liên
- Đạt 9.2 điểm môn Tiếng Anh trong kỳ thi THPTQG

Kinh nghiệm:
- Gia sư nhiệt tình, có giáo án soạn kỹ từng buổi, cam kết tiến bộ`,
    schedule: {
      thu2: { morning: true, afternoon: false, evening: true },
      thu3: { morning: true, afternoon: false, evening: true },
      thu4: { morning: true, afternoon: false, evening: true },
      thu5: { morning: true, afternoon: false, evening: true },
      thu6: { morning: true, afternoon: false, evening: true },
      thu7: { morning: true, afternoon: true, evening: false },
      chuNhat: { morning: true, afternoon: true, evening: false },
    },
    isVerified: true,
  },
  {
    id: 644,
    code: "GS1615",
    name: "Nguyễn Thu Hà",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/e321f6638e72b1d96d3ade513f025f4e.jpg",
    birthYear: 2006,
    gender: "Nữ",
    hometown: "Hà Nội",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Thương mại điện tử",
    school: "Kinh tế Quốc dân",
    teachingForm: "Offline + Online",
    province: "Hà Nội",
    districts: "Q.Long Biên",
    subjects: ["Toán", "Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2"],
    subjectDetail: "Toán cấp 1 & 2, Tiếng Anh tăng cường phản xạ",
    experience: `1. Thành tích học tập
- Điểm thi đại học Toán 9.0, Tiếng Anh 9.4
- Học sinh giỏi toán và tiếng Anh 12 năm liền

Kinh nghiệm:
- 1 năm kèm toán và tiếng Anh cho các bạn ôn thi vào 6 và vào 10`,
    schedule: {
      thu2: { morning: false, afternoon: false, evening: true },
      thu3: { morning: false, afternoon: false, evening: true },
      thu4: { morning: false, afternoon: false, evening: true },
      thu5: { morning: false, afternoon: false, evening: true },
      thu6: { morning: false, afternoon: false, evening: true },
      thu7: { morning: true, afternoon: true, evening: true },
      chuNhat: { morning: true, afternoon: true, evening: true },
    },
    isVerified: true,
  },
  {
    id: 643,
    code: "GS1614",
    name: "Nguyễn Thị Kim Dung",
    role: "Sinh viên",
    avatar: "https://giasuhome.vn/lib/uploadsweb/avatar_prew.jpg",
    birthYear: 1986,
    gender: "Nữ",
    hometown: "Hà Nội",
    voice: "Miền Bắc",
    degree: "Đại học",
    major: "Tiếng anh",
    school: "Đại học Hà Nội",
    teachingForm: "Offline tại nhà",
    province: "Hà Nội",
    districts: "Q.Ba Đình, Q.Hoàn Kiếm, Q.Long Biên",
    subjects: ["Tiếng Anh"],
    levels: ["Cấp 1", "Cấp 2", "Cấp 3", "Giao tiếp"],
    subjectDetail: "Tiếng Anh cho người lớn, Tiếng Anh cấp 1, 2, 3",
    experience: `1. Thành tích học tập
- Tốt nghiệp khoa Tiếng Anh Đại học Hà Nội
- Nhiều năm kinh nghiệm giảng dạy tiếng Anh giao tiếp

Kinh nghiệm:
- Dạy kèm nhiều thế hệ học sinh đạt kết quả cao trong các kỳ thi học kỳ và chuyển cấp`,
    schedule: {
      thu2: { morning: true, afternoon: true, evening: false },
      thu3: { morning: true, afternoon: true, evening: false },
      thu4: { morning: true, afternoon: true, evening: false },
      thu5: { morning: true, afternoon: true, evening: false },
      thu6: { morning: true, afternoon: true, evening: false },
      thu7: { morning: true, afternoon: false, evening: false },
      chuNhat: { morning: true, afternoon: false, evening: false },
    },
    isVerified: true,
  },
];
