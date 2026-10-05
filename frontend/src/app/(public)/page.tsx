"use client";

import Link from "next/link";
import { useState } from "react";
import { Image } from "@/components/ui/image";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"todo" | "inprogress" | "completed" | "archive">("todo");

  return (
    <div className="min-h-screen text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      
      {/* THANH THÔNG BÁO ĐẦU TRANG */}
      <div className="bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 border-b border-blue-100/80 py-2.5 px-4 text-center shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 text-xs sm:text-sm text-gray-700">
          <span className="inline-flex items-center gap-1.5 font-semibold text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Kiến tạo tương lai thông qua giáo dục
          </span>
          <span className="hidden md:inline text-gray-400">•</span>
          <span className="hidden md:inline text-gray-600">
            Nền tảng kết nối 1 kèm 1 giữa Gia sư tài năng & Học sinh xuất sắc
          </span>
          <Link
            href="/tutors"
            className="ml-2 inline-flex items-center justify-center px-4 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition shadow-xs"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1 space-y-24 sm:space-y-32 py-6 sm:py-10">

        {/* =========================================================================
            PHẦN 1: QUY TRÌNH KẾT NỐI GIA SƯ & HỌC SINH (ĐƯỜNG CONG S-CURVE)
            ========================================================================= */}
        <section className="relative w-full min-h-[calc(100vh-6rem)] flex flex-col justify-center items-center py-4 sm:py-8">
          
          {/* Lưới bố cục đối xứng 2 hàng */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-14 items-center relative z-10 my-auto">

            {/* HÀNG 1 - TRÁI: THẺ GIA SƯ */}
            <div className="flex flex-col items-start">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4">
                Gia Sư
              </h2>

              {/* Thẻ Gia sư tông màu xanh Brand */}
              <div className="relative w-full max-w-70 sm:max-w-[320px] aspect-4/5 rounded-3xl overflow-hidden bg-linear-to-br from-blue-600 to-blue-700 p-4 flex flex-col justify-end shadow-lg shadow-blue-500/15 transition-transform hover:-translate-y-1">
                {/* Ảnh gia sư */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                    alt="Gia sư ThS. Hoàng Minh Đức"
                    fit="cover"
                    rounded="none"
                    className="w-full h-full object-cover object-top filter contrast-[1.05]"
                  />
                  {/* Lớp phủ mờ nhẹ */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
                </div>

                {/* Huy hiệu thông tin nổi góc dưới */}
                <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-gray-100/90 ml-auto max-w-51.25 text-left">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    ThS. Hoàng Minh Đức
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-gray-500 font-medium">Gia sư ưu tú</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] font-bold text-emerald-600">15 Giải thưởng</span>
                  </div>
                </div>
              </div>
            </div>

            {/* HÀNG 1 - PHẢI: MÔ TẢ GIA SƯ */}
            <div className="flex flex-col justify-center text-left md:pl-6 lg:pl-10">
              <p className="text-sm sm:text-base text-gray-900 font-normal leading-relaxed max-w-md">
                Gặp gỡ gia sư lý tưởng của bạn ngay hôm nay. Nền tảng kết nối trực tiếp với đội ngũ gia sư được kiểm định bằng cấp, đánh giá 5 sao và giàu kỹ năng sư phạm chuyên sâu.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  href="/tutors"
                  className="text-base font-medium text-brand hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                >
                  Khám phá danh sách giáo viên &rarr;
                </Link>
              </div>
            </div>

            {/* HÀNG 2 - TRÁI: MÔ TẢ HỌC SINH */}
            <div className="flex flex-col justify-center text-left order-2 md:order-1 md:pr-6 lg:pr-10">
              <p className="text-sm sm:text-base text-gray-900 font-normal leading-relaxed max-w-md">
                Kết nối với người bạn đồng hành hoàn hảo. Nền tảng giúp bạn học tập cùng những gia sư tốt nhất để bứt phá điểm số và phát huy trọn vẹn năng lực bản thân.
              </p>
              <div className="mt-4">
                <Link
                  href="/register"
                  className="text-base font-medium text-rose-500 hover:text-rose-600 hover:underline inline-flex items-center gap-1"
                >
                  Bắt đầu lộ trình học cá nhân hóa &rarr;
                </Link>
              </div>
            </div>

            {/* HÀNG 2 - PHẢI: THẺ HỌC SINH */}
            <div className="flex flex-col items-start md:items-end order-1 md:order-2">
              <div className="w-full max-w-70 sm:max-w-[320px]">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 mb-3 sm:mb-4 text-left">
                  Học Sinh
                </h2>

                {/* Thẻ Học sinh tông màu hồng đào */}
                <div className="relative w-full aspect-4/5 rounded-3xl overflow-hidden bg-linear-to-br from-[#fba597] to-[#fb923c] p-4 flex flex-col justify-end shadow-lg shadow-orange-500/15 transition-transform hover:-translate-y-1">
                  {/* Ảnh học sinh */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
                      alt="Học sinh Nguyễn Anh Khoa"
                      fit="cover"
                      rounded="none"
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Lớp phủ mờ nhẹ */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
                  </div>

                  {/* Huy hiệu thông tin nổi góc dưới */}
                  <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-lg border border-gray-100/90 ml-auto max-w-51.25 text-left">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      Nguyễn Hải Đăng
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-gray-500 font-medium">Học sinh tích cực</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-[10px] font-bold text-blue-600">Điểm số 90+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ĐƯỜNG CONG S-CURVE KẾT NỐI (Chế độ màn hình máy tính) */}
          <div className="hidden md:block absolute inset-0 pointer-events-none z-0">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 650"
              fill="none"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="brandSCurveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#fba597" />
                </linearGradient>
              </defs>
              {/* Đường cong uốn lượn S-curve */}
              <path
                d="M 270 230 C 440 200, 480 325, 500 325 C 520 325, 560 450, 730 420"
                stroke="url(#brandSCurveGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Huy hiệu tròn ghép nối đặt tại trung tâm */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto">
              <div
                className="w-13 h-13 rounded-full bg-white shadow-xl border border-blue-100 flex items-center justify-center text-blue-600 hover:scale-110 transition-transform cursor-pointer"
                title="Ghép nối gia sư và học sinh phù hợp"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
          </div>
        </section>


        {/* =========================================================================
            PHẦN 2: QUY TRÌNH GIẢNG DẠY & BẢNG ĐIỀU KHIỂN HOẠT ĐỘNG HỌC TẬP
            ========================================================================= */}
        <section className="w-full space-y-12 pt-4">
          
          {/* Tiêu đề & Giới thiệu phần 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                Hành trình chọn <br />
                gia sư phù hợp <br />
              </h2>
            </div>
            <div>
              <p className="text-base sm:text-base text-gray-900 leading-relaxed max-w-lg">
                Nền tảng của chúng tôi ưu tiên tuyển chọn các gia sư có hiệu quả giảng dạy vượt trội và thành tích đã được kiểm chứng. Gia sư thấu hiểu năng lực của từng học viên và thiết lập lộ trình học tập phù hợp nhất.
              </p>
            </div>
          </div>

          {/* Nội dung phần 2: Cột Timeline Trái + Cột Dashboard Phải */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            
            {/* CỘT TRÁI: DÒNG THỜI GIAN 3 BƯỚC DỌC (5 cột) */}
            <div className="lg:col-span-5 relative pl-4 sm:pl-6">
              
              {/* Đường nét đứt dọc liên kết */}
              <div className="absolute left-8.5 sm:left-10.5 top-6 bottom-8 w-0.5 border-l-2 border-dashed border-gray-300" />

              <div className="space-y-10 sm:space-y-12 relative">
                
                {/* Bước 1: Xem gia sư */}
                <div className="flex items-start gap-4 sm:gap-5 group">
                  <div className="w-12 h-12 rounded-full text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 shadow-xs z-10 bg-white">
                    <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left pt-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Bước 1: Duyệt gia sư
                    </h3>
                    <p className="text-sm text-gray-900 leading-relaxed mt-1">
                      <span>Chọn môn học và lớp học cần hỗ trợ</span> <br/>
                      <span>Xem hồ sơ, trình độ, kinh nghiệm</span>
                    </p>
                  </div>
                </div>

                {/* Bước 2: Yêu cầu mời dạy */}
                <div className="flex items-start gap-4 sm:gap-5 group">
                  <div className="w-12 h-12 rounded-full text-orange-500 border border-orange-100 flex items-center justify-center shrink-0 shadow-xs z-10 bg-white">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left pt-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Bước 2: Gửi yêu cầu mời dạy
                    </h3>
                    <p className="text-sm text-gray-900 leading-relaxed mt-1">
                      <span>Cung cấp thông tin lớp học và liên hệ</span><br/>
                      <span>TutorMatch xác nhận và hỗ trợ kết nối</span><br/>
                      <span>Gia sư liên hệ trao đổi và nhận lớp</span>
                    </p>
                  </div>
                </div>

                {/* Bước 3: Thương lượng */}
                <div className="flex items-start gap-4 sm:gap-5 group">
                  <div className="w-12 h-12 rounded-full text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs z-10 bg-white">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="text-left pt-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Bước 3: Thương lượng & thống nhất
                    </h3>
                    <p className="text-sm text-gray-900 leading-relaxed mt-1">
                      <span>Tìm tiếng nói chung</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 sm:gap-5 group">
                  <div className="w-12 h-12 rounded-full text-emerald-400 border border-orange-100 flex items-center justify-center shrink-0 shadow-xs z-10 bg-white">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left pt-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      Bước 4: Bắt đầu đồng hành
                    </h3>
                    <p className="text-sm text-gray-900 leading-relaxed mt-1">
                      <span>Xây dựng lộ trình học tập phù hợp</span><br/>
                      <span>Gia sư theo sát quá trình tiến bộ</span><br/>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: BẢNG ĐIỀU KHIỂN HOẠT ĐỘNG HỌC TẬP (7 cột) */}
            <div className="lg:col-span-7 bg-[#f2f5fa] rounded-3xl p-5 sm:p-7 border border-gray-200/80 shadow-xs">
              
              {/* Tiêu đề Bảng điều khiển */}
              <div className="text-left mb-6">
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  Theo dõi <span className="text-rose-500 font-semibold">Học tập</span>
                </h3>
              </div>

              {/* Phần trên: Biểu đồ + Thống kê nhỏ */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6">
                
                {/* 1. Biểu đồ cột kết hợp đường lượn sóng (7 cột) */}
                <div className="sm:col-span-7 bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col justify-between">
                  {/* Huy hiệu đầu biểu đồ */}
                  <div className="flex justify-center mb-3">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-900 text-white text-[10px] font-semibold">
                      23 bài đang thực hiện &rarr;
                    </span>
                  </div>

                  {/* Khung chứa biểu đồ sóng và các cột ngày */}
                  <div className="relative pt-6 pb-2">
                    {/* Đường lượn sóng màu xanh Brand */}
                    <svg className="w-full h-12 text-blue-400 absolute top-2 inset-x-0" viewBox="0 0 200 40" fill="none">
                      <path
                        d="M 5 25 C 25 35, 45 10, 70 20 C 95 30, 115 5, 140 18 C 165 30, 185 15, 195 20"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                    </svg>

                    {/* Các cột từ Chủ nhật đến Thứ bảy */}
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 px-1">
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-rose-400 rounded-full h-14" />
                        <span className="text-[9px] text-gray-600 font-medium">CN</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-rose-300 rounded-full h-8" />
                        <span className="text-[9px] text-gray-600 font-medium">T2</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-rose-400 rounded-full h-20" />
                        <span className="text-[9px] text-gray-600 font-medium">T3</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-blue-600 rounded-full h-24" />
                        <span className="text-[9px] text-gray-600 font-medium">T4</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-rose-400 rounded-full h-16" />
                        <span className="text-[9px] text-gray-600 font-medium">T5</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-blue-500 rounded-full h-20" />
                        <span className="text-[9px] text-gray-600 font-medium">T6</span>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="w-full max-w-3.5 bg-rose-300 rounded-full h-12" />
                        <span className="text-[9px] text-gray-600 font-medium">T7</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Thẻ số liệu bên cạnh (5 cột) */}
                <div className="sm:col-span-5 flex flex-col justify-between gap-3">
                  
                  {/* Thẻ Trung bình mỗi ngày */}
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-gray-600 font-medium">Trung bình mỗi ngày</div>
                      <div className="text-xs font-bold text-gray-900">13 bài / tuần</div>
                    </div>
                  </div>

                  {/* Thẻ Thời gian học hôm nay */}
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] text-gray-600 font-medium">Thời gian học hôm nay</div>
                      <div className="text-xs font-bold text-gray-900">4 giờ 30 phút</div>
                    </div>
                  </div>

                  {/* Trạng thái hoạt động */}
                  <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold">
                        T1
                      </div>
                      <div className="text-left">
                        <div className="text-[10px] font-bold text-gray-900">Hoạt động</div>
                        <div className="text-[9px] text-gray-600">Tuần 1 • 10 Nhiệm vụ</div>
                      </div>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
                  </div>

                </div>

              </div>

              {/* Phần giữa: Thanh Tab lọc trạng thái */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("todo")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "todo"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Cần làm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("inprogress")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "inprogress"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Đang làm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("completed")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "completed"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Đã hoàn thành
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("archive")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === "archive"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  Lưu trữ
                </button>
              </div>

              {/* Phần dưới: 2 Thẻ bài tập về nhà */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Thẻ bài tập 1 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-left flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">
                        Bài tập: Toán Hình 11
                      </h4>
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        ⋮
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-4">
                      Hạn nộp: 12/12/2026
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    {/* Nhóm avatar học sinh */}
                    <div className="flex items-center -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-200 border-2 border-white overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-pink-200 border-2 border-white overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=100&q=80" alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white border-2 border-white text-[9px] font-bold flex items-center justify-center">
                        40
                      </div>
                    </div>

                    {/* Số lượt thích và bình luận */}
                    <div className="flex items-center gap-3 text-gray-600 text-[11px]">
                      <span className="flex items-center gap-1">
                        👍 6
                      </span>
                      <span className="flex items-center gap-1">
                        💬 21
                      </span>
                    </div>
                  </div>
                </div>

                {/* Thẻ bài tập 2 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs text-left flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-gray-900">
                        Bài tập: IELTS Writing
                      </h4>
                      <button type="button" className="text-gray-400 hover:text-gray-600">
                        ⋮
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mb-4">
                      Hạn nộp: 12/12/2026
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    {/* Nhóm avatar học sinh */}
                    <div className="flex items-center -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-200 border-2 border-white overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-white overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80" alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white border-2 border-white text-[9px] font-bold flex items-center justify-center">
                        23
                      </div>
                    </div>

                    {/* Số lượt thích và bình luận */}
                    <div className="flex items-center gap-3 text-gray-600 text-[11px]">
                      <span className="flex items-center gap-1">
                        👍 4
                      </span>
                      <span className="flex items-center gap-1">
                        💬 22
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </section>

      </div>
    </div>
  );
}
