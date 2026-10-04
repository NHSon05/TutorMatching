"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";

export default function Home() {
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [description, setDescription] = useState("");

  const scrollToTrial = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById("trial_section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
  };

  const tutorsList = [
    {
      title: "Gia sư IELTS",
      image: "https://giasuhome.vn/lib/image/gs_thi_ielts.png",
      bullets: [
        "Luyện thi IELTS theo mục tiêu",
        "Phát triển toàn diện 4 kỹ năng",
        "Nâng cao khả năng giao tiếp",
      ],
      link: "#",
    },
    {
      title: "Gia sư Ngữ Văn",
      image: "https://giasuhome.vn/lib/image/gs_mon_van.png",
      bullets: [
        "Rèn đọc hiểu văn bản",
        "Nâng cao kỹ năng viết",
        "Phát triển khả năng diễn đạt",
      ],
      link: "#",
    },
    {
      title: "Gia sư Vật Lý",
      image: "https://giasuhome.vn/lib/image/gs_mon_ly.png",
      bullets: [
        "Giúp hiểu bản chất hiện tượng",
        "Rèn kỹ năng giải bài tập",
        "Nắm vững công thức trọng tâm",
      ],
      link: "#",
    },
    {
      title: "Gia sư Hoá Học",
      image: "https://giasuhome.vn/lib/image/gs_mon_hoa.png",
      bullets: [
        "Nắm chắc kiến thức nền tảng",
        "Thành thạo phương pháp giải",
        "Hệ thống kiến thức hiệu quả",
      ],
      link: "#",
    },
    {
      title: "Gia sư Tiểu học",
      image: "https://giasuhome.vn/lib/image/gs_tieu_hoc.png",
      bullets: [
        "Rèn đọc, viết và chính tả",
        "Củng cố Toán và Tiếng Việt",
        "Xây dựng nền tảng vững chắc",
      ],
      link: "#",
    },
    {
      title: "Gia sư Toán",
      image: "https://giasuhome.vn/lib/image/gs_mon_toan.png",
      bullets: [
        "Củng cố kiến thức nền tảng",
        "Rèn kỹ năng giải bài tập",
        "Phát triển tư duy logic",
      ],
      link: "#",
    },
    {
      title: "Gia sư Tiếng Anh",
      image: "https://giasuhome.vn/lib/image/gs_tieng_anh.png",
      bullets: [
        "Giúp học sinh lấy lại gốc",
        "Mở rộng từ vựng và ngữ pháp",
        "Tăng phản xạ, nghe nói tự nhiên",
      ],
      link: "#",
    },
    {
      title: "Toán tư duy",
      image: "https://giasuhome.vn/lib/image/gs_toantuduy.png",
      bullets: [
        "Rèn tư duy logic, sáng tạo",
        "Luyện thi TIMO, AMC, SASMO",
        "Tham gia sân chơi Toán quốc tế",
      ],
      link: "#",
    },
  ];

  const leftFeedback = [
    {
      text: "Gia sư rất tận tâm và kiên nhẫn với con. Sau một thời gian học bé tự tin và chủ động học hơn rất nhiều.",
      avatar: "https://giasuhome.vn/lib/image/review_phuonglinh3.jpg",
      name: "Chị Phương Linh",
      role: "Phụ huynh lớp 5 - Hà Nội",
    },
    {
      text: "Điều mình đánh giá cao là GiasuHome hỗ trợ rất nhanh khi cần đổi gia sư phù hợp hơn cho con.",
      avatar: "https://giasuhome.vn/lib/image/review_anhtuan.jpg",
      name: "Anh Tuấn",
      role: "Phụ huynh lớp 8 - TP.HCM",
    },
    {
      text: "Gia sư rất trách nhiệm, luôn chuẩn bị bài kỹ trước mỗi buổi học và giải thích dễ hiểu. Điều mình đánh giá cao là gia sư thường xuyên trao đổi với phụ huynh về tình hình học tập của con.",
      avatar: "https://giasuhome.vn/lib/image/review_chilan.jpg",
      name: "Chị Lan",
      role: "Phụ huynh lớp 11 - Đà Nẵng",
    },
    {
      text: "Gia sư IELTS được giới thiệu rất phù hợp, xây dựng lộ trình rõ ràng và theo sát mục tiêu của con. Sau vài tháng, kỹ năng Speaking và Writing tiến bộ đáng kể.",
      avatar: "https://giasuhome.vn/lib/image/review_minhanh.jpg",
      name: "Chị Minh Anh",
      role: "Phụ huynh lớp 6 - An Giang",
    },
  ];

  const rightFeedback = [
    {
      text: "GiasuHome tư vấn rất kỹ trước khi kết nối gia sư nên mình cảm thấy khá yên tâm.",
      avatar: "https://giasuhome.vn/lib/image/review_chihuong.png",
      name: "Chị Hương",
      role: "Phụ huynh lớp 3 - Lào Cai",
    },
    {
      text: "Sau một thời gian học cùng gia sư, kết quả kiểm tra của con cải thiện rõ rệt. Không chỉ tiến bộ về kiến thức, con còn tự tin hơn khi phát biểu và đặt câu hỏi trên lớp.",
      avatar: "https://giasuhome.vn/lib/image/review_anhhoang.jpg",
      name: "Anh Hoàng",
      role: "Phụ huynh lớp 7 - Hải Phòng",
    },
    {
      text: "Quy trình minh bạch và hỗ trợ phụ huynh rất nhiệt tình trong suốt quá trình học tập.",
      avatar: "https://giasuhome.vn/lib/image/review_chithao.jpg",
      name: "Chị Thảo",
      role: "Phụ huynh lớp 9 - Cần Thơ",
    },
    {
      text: "Con mình học khá nhưng chưa có phương pháp ôn tập hiệu quả. Gia sư đã giúp con hệ thống lại kiến thức, xây dựng kế hoạch học tập khoa học hơn. Nhờ vậy kết quả các bài kiểm tra gần đây đều được cải thiện.",
      avatar: "https://giasuhome.vn/lib/image/review_chiyen.jpg",
      name: "Chị Yến",
      role: "Phụ huynh lớp 8 - Quảng Bình",
    },
  ];

  const blogPosts = [
    {
      title: "5 dấu hiệu con đang cần gia sư hỗ trợ sớm",
      date: "Thứ Ba, 01/10/2024",
      image: "https://giasuhome.vn/lib/image/blog_1.jpg",
      excerpt:
        "Con vẫn đi học đều, vẫn làm bài đầy đủ nhưng kết quả ngày càng giảm. Đó có thể là lời 'cầu cứu' mà con chưa biết cách nói ra...",
      link: "/blog",
    },
    {
      title: "Khi nào phụ huynh nên tìm gia sư cho con?",
      date: "Thứ Bảy, 02/12/2024",
      image: "https://giasuhome.vn/lib/image/blog_7.jpg",
      excerpt:
        "Không phải đến khi con học kém mới cần gia sư. Chọn đúng thời điểm sẽ giúp con học nhẹ nhàng và tiến bộ hơn...",
      link: "/blog",
    },
    {
      title: "Gia sư sinh viên hay giáo viên: Nên chọn ai?",
      date: "Thứ Tư, 06/11/2024",
      image: "https://giasuhome.vn/lib/image/blog_8.jpg",
      excerpt:
        "Mỗi lựa chọn đều có những ưu điểm riêng. Hiểu rõ nhu cầu học tập của con sẽ giúp phụ huynh đưa ra quyết định phù hợp hơn...",
      link: "/blog",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1D] relative pb-16 md:pb-0">
      {/* 1. Shared Header */}
      <Header />

      {/* 2. Banner Hero Section */}
      <section className="banner_home">
        <div className="banner_wrapper relative">
          <picture>
            <source media="(max-width: 767px)" srcSet="https://giasuhome.vn/lib/image/slide_767.png" />
            <source media="(max-width: 992px)" srcSet="https://giasuhome.vn/lib/image/slide_992.png" />
            <source media="(max-width: 1599px)" srcSet="https://giasuhome.vn/lib/image/slide_1600.png" />
            <source media="(max-width: 2000px)" srcSet="https://giasuhome.vn/lib/image/slide_2000.png" />
            <img
              src="https://giasuhome.vn/lib/image/slide_2200.png"
              alt="Gia sư GiasuHome - Kết nối gia sư chắp cánh ước mơ"
              className="w-full h-auto block"
            />
          </picture>

          {/* Banner Button Click Overlay */}
          <a
            href="#trial_section"
            onClick={scrollToTrial}
            className="banner_cta_overlay"
            aria-label="Chọn gia sư phù hợp ngay"
          />
        </div>
      </section>

      {/* 3. Section 3 Khối: Thực Trạng - Hiệu Quả - Giải Pháp */}
      <section className="section_service section-padding">
        <div className="container-custom">
          <div className="section-title">
            <h2>Tìm gia sư phù hợp cho con</h2>
            <span className="sub_title">
              Ba mẹ bận rộn, con cần một người đồng hành trong học tập
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mt-10">
            {/* THỰC TRẠNG */}
            <div className="service_box">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl text-[#f44336] shadow-sm shrink-0 border border-red-50">
                  <i className="fa fa-check-circle"></i>
                </div>
                <span className="text-xl font-bold text-[#ca6f04] tracking-wide">
                  THỰC TRẠNG
                </span>
              </div>
              <h3 className="text-xl lg:text-[22px] font-semibold text-[#181818] mb-5 leading-snug">
                Con đang gặp khó khăn trong học tập
              </h3>
              <ul className="space-y-3.5 text-[15px] text-[#475569] mb-8 flex-1">
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#f44336] mt-1 shrink-0"></i>
                  <span>Mất gốc kiến thức từ sớm</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#f44336] mt-1 shrink-0"></i>
                  <span>Ngại hỏi khi không hiểu bài</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#f44336] mt-1 shrink-0"></i>
                  <span>Học nhiều nhưng chưa hiệu quả</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#f44336] mt-1 shrink-0"></i>
                  <span>Loay hoay với phương pháp học</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#f44336] mt-1 shrink-0"></i>
                  <span>Thiếu sự đồng hành và định hướng</span>
                </li>
              </ul>
              <div className="pt-2 text-center mt-auto">
                <img
                  src="https://giasuhome.vn/lib/image/service_thuctrang.png"
                  alt="Thực trạng học sinh khó khăn"
                  className="w-full max-h-52 object-contain rounded-2xl mx-auto"
                />
              </div>
            </div>

            {/* HIỆU QUẢ */}
            <div className="service_box">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl text-[#1877F2] shadow-sm shrink-0 border border-blue-50">
                  <i className="fa fa-check-circle"></i>
                </div>
                <span className="text-xl font-bold text-[#ca6f04] tracking-wide">
                  HIỆU QUẢ
                </span>
              </div>
              <h3 className="text-xl lg:text-[22px] font-semibold text-[#181818] mb-5 leading-snug">
                Gia sư phù hợp giúp con tiến bộ mỗi ngày
              </h3>
              <ul className="space-y-3.5 text-[15px] text-[#475569] mb-8 flex-1">
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#1877F2] mt-1 shrink-0"></i>
                  <span>Học đúng theo năng lực</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#1877F2] mt-1 shrink-0"></i>
                  <span>Có người theo sát và đồng hành</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#1877F2] mt-1 shrink-0"></i>
                  <span>Tự tin hơn khi học và hỏi bài</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#1877F2] mt-1 shrink-0"></i>
                  <span>Cải thiện kiến thức từng bước</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#1877F2] mt-1 shrink-0"></i>
                  <span>Hình thành thói quen tự học tốt</span>
                </li>
              </ul>
              <div className="pt-2 text-center mt-auto">
                <img
                  src="https://giasuhome.vn/lib/image/service_hieuqua.png"
                  alt="Hiệu quả học gia sư"
                  className="w-full max-h-52 object-contain rounded-2xl mx-auto"
                />
              </div>
            </div>

            {/* GIẢI PHÁP */}
            <div className="service_box md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-xl text-[#4CAF50] shadow-sm shrink-0 border border-green-50">
                  <i className="fa fa-check-circle"></i>
                </div>
                <span className="text-xl font-bold text-[#ca6f04] tracking-wide">
                  GIẢI PHÁP
                </span>
              </div>
              <h3 className="text-xl lg:text-[22px] font-semibold text-[#181818] mb-5 leading-snug">
                GiasuHome giúp ba mẹ tìm đúng gia sư cho con
              </h3>
              <ul className="space-y-3.5 text-[15px] text-[#475569] mb-8 flex-1">
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#4CAF50] mt-1 shrink-0"></i>
                  <span>Chọn gia sư phù hợp với con</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#4CAF50] mt-1 shrink-0"></i>
                  <span>Học thử miễn phí trước khi bắt đầu</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#4CAF50] mt-1 shrink-0"></i>
                  <span>Đổi gia sư miễn phí nếu chưa phù hợp</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#4CAF50] mt-1 shrink-0"></i>
                  <span>Kết nối nhanh 0-3 ngày</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <i className="fa fa-check-circle text-[#4CAF50] mt-1 shrink-0"></i>
                  <span>Học phí thanh toán cuối tháng</span>
                </li>
              </ul>
              <div className="pt-2 text-center mt-auto">
                <img
                  src="https://giasuhome.vn/lib/image/service_giaiphap.png"
                  alt="Giải pháp tìm gia sư uy tín"
                  className="w-full max-h-52 object-contain rounded-2xl mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Section Quy Trình 4 Bước */}
      <section className="section-padding bg-white overflow-hidden">
        <div className="container-custom">
          <div className="section-title">
            <h2>Hành trình chọn gia sư phù hợp</h2>
            <span className="sub_title">
              Chỉ với 4 bước đơn giản, ba mẹ dễ dàng chọn gia sư cho con
            </span>
          </div>

          <div className="process_timeline_wrapper relative">
            <div className="process_center_line hidden md:block"></div>

            <div className="space-y-8 md:space-y-12">
              {/* STEP 1: Right */}
              <div className="flex flex-col md:flex-row items-center justify-end relative">
                <div className="hidden md:block process_node bg-[#1877F2] left-1/2 -translate-x-1/2"></div>
                <div className="w-full md:w-[46%] md:ml-auto">
                  <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-sm shadow">
                        <i className="fa fa-users"></i>
                      </div>
                      <h3 className="text-lg font-bold text-[#0369a1]">
                        Bước 1: Duyệt chọn gia sư
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[#475569] pl-2 list-disc list-inside">
                      <li>Chọn môn học và lớp học cần hỗ trợ</li>
                      <li>Lọc theo khu vực và giới tính gia sư</li>
                      <li>Xem hồ sơ, trình độ và kinh nghiệm</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* STEP 2: Left */}
              <div className="flex flex-col md:flex-row items-center justify-start relative">
                <div className="hidden md:block process_node bg-[#FFB717] left-1/2 -translate-x-1/2"></div>
                <div className="w-full md:w-[46%] md:mr-auto">
                  <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFB717] text-white flex items-center justify-center text-sm shadow">
                        <i className="fa fa-rocket"></i>
                      </div>
                      <h3 className="text-lg font-bold text-[#b45309]">
                        Bước 2: Gửi yêu cầu mời dạy
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[#475569] pl-2 list-disc list-inside">
                      <li>Cung cấp thông tin lớp học và liên hệ</li>
                      <li>GiasuHome xác nhận và hỗ trợ kết nối</li>
                      <li>Gia sư liên hệ trao đổi và nhận lớp</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* STEP 3: Right */}
              <div className="flex flex-col md:flex-row items-center justify-end relative">
                <div className="hidden md:block process_node bg-[#f43f5e] left-1/2 -translate-x-1/2"></div>
                <div className="w-full md:w-[46%] md:ml-auto">
                  <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#f43f5e] text-white flex items-center justify-center text-sm shadow">
                        <i className="fa fa-star"></i>
                      </div>
                      <h3 className="text-lg font-bold text-[#be123c]">
                        Bước 3: Học thử & đánh giá
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[#475569] pl-2 list-disc list-inside">
                      <li>Học thử trước khi bắt đầu đồng hành</li>
                      <li>Đánh giá sự phù hợp với học sinh</li>
                      <li>Hỗ trợ đổi gia sư nếu cần thiết</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* STEP 4: Left */}
              <div className="flex flex-col md:flex-row items-center justify-start relative">
                <div className="hidden md:block process_node bg-[#10b981] left-1/2 -translate-x-1/2"></div>
                <div className="w-full md:w-[46%] md:mr-auto">
                  <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#10b981] text-white flex items-center justify-center text-sm shadow">
                        <i className="fa fa-check-circle"></i>
                      </div>
                      <h3 className="text-lg font-bold text-[#047857]">
                        Bước 4: Bắt đầu đồng hành
                      </h3>
                    </div>
                    <ul className="space-y-2 text-sm text-[#475569] pl-2 list-disc list-inside">
                      <li>Xây dựng lộ trình học tập phù hợp</li>
                      <li>Gia sư theo sát quá trình tiến bộ</li>
                      <li>Đồng hành cùng con lâu dài</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="cta-trangchu">
              <a href="#trial_section" onClick={scrollToTrial} className="btn-black-pill">
                Chọn gia sư phù hợp ngay
                <i className="fa fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Section Đội Ngũ Gia Sư */}
      <section id="tutors" className="section-padding bg-[#fcfaf7]">
        <div className="container-custom">
          <div className="section-title">
            <h2>Đội ngũ gia sư tại GiasuHome</h2>
            <span className="sub_title">
              Hơn 3.000+ gia sư kinh nghiệm, đa dạng môn học và cấp học
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tutorsList.map((tutor, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1.5"
              >
                <div className="h-44 bg-amber-50 overflow-hidden relative">
                  <img
                    src={tutor.image}
                    alt={tutor.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-3.5">
                    {tutor.title}
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600 mb-6 flex-1">
                    {tutor.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFB717]"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/gia-su"
                    className="inline-flex items-center text-sm font-semibold text-[#ca6f04] hover:text-black gap-1.5 transition-colors mt-auto"
                  >
                    Xem gia sư
                    <i className="fa fa-arrow-right text-xs"></i>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="cta-trangchu">
            <Link href="/gia-su" className="btn-black-pill">
              Xem tất cả gia sư
              <i className="fa fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Section Đánh Giá & Thống Kê */}
      <section className="section-padding bg-white overflow-hidden">
        <div className="container-custom">
          <div className="section-title">
            <h2>GiasuHome đồng hành cùng bạn</h2>
            <span className="sub_title">
              Những phản hồi thực tế sau quá trình học tập và đồng hành
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[520px] overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>

            {/* Left Column Ticker */}
            <div className="ticker-track-up space-y-4">
              {[...leftFeedback, ...leftFeedback].map((item, idx) => (
                <div
                  key={`left-${idx}`}
                  className="bg-[#fafaf9] border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-11 h-11 rounded-full object-cover border border-amber-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                      <span className="text-xs text-gray-500">{item.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column Ticker */}
            <div className="ticker-track-down space-y-4 hidden md:block">
              {[...rightFeedback, ...rightFeedback].map((item, idx) => (
                <div
                  key={`right-${idx}`}
                  className="bg-[#fafaf9] border border-gray-100 rounded-2xl p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    &ldquo;{item.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-11 h-11 rounded-full object-cover border border-amber-200"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                      <span className="text-xs text-gray-500">{item.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Counters */}
          <div className="mt-16 grid grid-cols-3 max-w-2xl mx-auto divide-x divide-gray-200 text-center">
            <div className="px-4">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-[#1D1D1D] mb-1">
                3k+
              </h3>
              <p className="text-xs lg:text-sm text-gray-500">Gia đình tin dùng</p>
            </div>
            <div className="px-4">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-[#1D1D1D] mb-1">
                98%
              </h3>
              <p className="text-xs lg:text-sm text-gray-500">Phụ huynh hài lòng</p>
            </div>
            <div className="px-4">
              <h3 className="text-3xl lg:text-4xl font-extrabold text-[#1D1D1D] mb-1">
                5+
              </h3>
              <p className="text-xs lg:text-sm text-gray-500">Tuần thay đổi</p>
            </div>
          </div>

          <div className="cta-trangchu">
            <a href="#trial_section" onClick={scrollToTrial} className="btn-black-pill">
              Xem tất cả đánh giá
              <i className="fa fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* 7. Section Bài Viết Chia Sẻ */}
      <section className="section-padding bg-[#f7f0e4]">
        <div className="container-custom">
          <div className="section-title">
            <h2>Bài viết chia sẻ</h2>
            <span className="sub_title">
              Kinh nghiệm học tập và đồng hành cùng con mỗi ngày
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col group"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2.5">
                    <i className="fa-regular fa-clock"></i>
                    <span>{post.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2.5 line-clamp-2 hover:text-[#ca6f04] cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="cta-trangchu">
            <a href="/blog" className="btn-black-pill">
              Xem tất cả bài viết
              <i className="fa fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </section>

      {/* 8. Section Form Đăng Ký Học Thử */}
      <section id="trial_section" className="section-padding bg-white">
        <div className="container-custom">
          <div className="section-title">
            <h2>Bắt đầu học cùng gia sư phù hợp</h2>
            <span className="sub_title">
              Tư vấn miễn phí – Học thử trước khi quyết định
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
            {/* Form Column (Left) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl">
              <div className="bg-[#fef9ee] border border-[#fde68a] rounded-2xl p-4 mb-6 flex items-start gap-3.5">
                <div className="text-[#ca6f04] text-xl mt-0.5">
                  <i className="fa fa-shield"></i>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">
                    Cam kết bảo mật thông tin
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Hơn 3.000+ phụ huynh đã đăng ký tư vấn và tìm được gia sư phù hợp qua GiasuHome.
                  </p>
                </div>
              </div>

              {formSubmitted ? (
                <div className="text-center py-10 bg-green-50 rounded-2xl border border-green-200 p-6">
                  <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i className="fa fa-check"></i>
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">
                    Đăng ký tư vấn thành công!
                  </h3>
                  <p className="text-sm text-green-700">
                    Cảm ơn bạn. Chuyên viên GiasuHome sẽ liên hệ qua số điện thoại{" "}
                    <strong>{phone}</strong> trong vòng 24 giờ tới.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Tên phụ huynh <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Vui lòng nhập tên"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        pattern="0[0-9]{9}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Vui lòng nhập số điện thoại"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Lớp học <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-gray-700"
                    >
                      <option value="">Chọn lớp học</option>
                      <option value="15">Mầm non</option>
                      <option value="1">Lớp 1</option>
                      <option value="2">Lớp 2</option>
                      <option value="3">Lớp 3</option>
                      <option value="4">Lớp 4</option>
                      <option value="5">Lớp 5</option>
                      <option value="6">Lớp 6</option>
                      <option value="7">Lớp 7</option>
                      <option value="8">Lớp 8</option>
                      <option value="9">Lớp 9</option>
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                      <option value="16">Sinh viên</option>
                      <option value="17">Người đi làm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Môn học <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white text-gray-700"
                    >
                      <option value="">Chọn môn học</option>
                      <optgroup label="Phổ thông">
                        <option value="1">Toán</option>
                        <option value="2">Tiếng Việt</option>
                        <option value="3">Luyện chữ</option>
                        <option value="4">Toán + Tiếng Việt</option>
                        <option value="5">Vật lý</option>
                        <option value="6">Hoá học</option>
                        <option value="7">Ngữ văn</option>
                        <option value="8">Lịch sử</option>
                        <option value="9">Địa lý</option>
                        <option value="10">Sinh học</option>
                        <option value="11">Tin học</option>
                        <option value="12">Khoa học tự nhiên</option>
                      </optgroup>
                      <optgroup label="Ngoại ngữ">
                        <option value="15">Tiếng Anh</option>
                        <option value="16">Tiếng Trung</option>
                        <option value="17">Tiếng Nhật</option>
                        <option value="18">Tiếng Pháp</option>
                        <option value="20">Tiếng Hàn</option>
                      </optgroup>
                      <optgroup label="Năng khiếu">
                        <option value="25">Âm nhạc (Đàn)</option>
                        <option value="26">Hội hoạ (Vẽ)</option>
                        <option value="28">Đánh cờ</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Chia sẻ thêm nhu cầu học tập (nếu có)
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ví dụ: Con đang mất gốc Toán, cần luyện thi vào lớp 10 hoặc muốn học online..."
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-[#FFB717] hover:bg-[#f59e0b] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
                  >
                    Đăng ký học thử miễn phí
                    <i className="fa fa-arrow-right"></i>
                  </button>
                </form>
              )}
            </div>

            {/* 3 Step Process Card (Right) */}
            <div className="lg:col-span-5 bg-[#faf8f5] rounded-3xl p-6 md:p-8 border border-amber-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Quy trình chỉ với 3 bước đơn giản
                </h3>
                <p className="text-xs text-gray-600 mb-8 leading-relaxed">
                  GiasuHome đồng hành từ lúc tư vấn đến khi học sinh tìm được gia sư phù hợp.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFB717] text-white font-bold flex items-center justify-center shrink-0 text-sm shadow">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        Đăng ký nhu cầu học tập
                      </h4>
                      <p className="text-xs text-gray-600">
                        Chia sẻ lớp học, môn học và nhu cầu của học sinh.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFB717] text-white font-bold flex items-center justify-center shrink-0 text-sm shadow">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        Tư vấn & chọn gia sư
                      </h4>
                      <p className="text-xs text-gray-600">
                        GiasuHome liên hệ và đề xuất gia sư phù hợp nhất.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FFB717] text-white font-bold flex items-center justify-center shrink-0 text-sm shadow">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-1">
                        Học thử miễn phí
                      </h4>
                      <p className="text-xs text-gray-600">
                        Trải nghiệm trước khi quyết định học chính thức.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-amber-200/60 flex items-center gap-2.5 text-xs font-medium text-[#ca6f04]">
                <i className="fa fa-star text-amber-500"></i>
                <span>Học đúng cách quan trọng hơn học thật nhiều.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Shared Footer & Floating Widgets */}
      <Footer />
      <FloatingWidgets />
    </div>
  );
}
