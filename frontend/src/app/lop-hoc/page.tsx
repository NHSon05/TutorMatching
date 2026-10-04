"use client";

import React, { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";

interface Classroom {
  id: string;
  code: string;
  date: string;
  title: string;
  description: string;
  subject: string;
  location: string;
  isOnline: boolean;
  monthlyTuition: string;
  requestsCount: number;
  classFee: string;
}

const mockClasses: Classroom[] = [
  {
    id: "1",
    code: "LH1767",
    date: "02-10-2026",
    title: "Tiếng Anh lớp 12 - 170k/b/2h, 3b/tuần - Dạy Online",
    description:
      "- Học sinh Nữ, mất gốc, cần gia sư kèm lại gốc, mục tiêu 5 điểm thi tốt nghiệp (Sách BGD)\n- Yêu cầu: Sinh viên Nam/Nữ, có kinh nghiệm, nhiệt tình, dạy lâu dài\n- Lịch học: Hs trống tối T2, 3, 5, 7 (có thể trao đổi thêm)",
    subject: "Tiếng Anh",
    location: "Hải Phòng",
    isOnline: true,
    monthlyTuition: "2,040,000đ",
    requestsCount: 4,
    classFee: "850,000đ",
  },
  {
    id: "2",
    code: "LH1766",
    date: "02-10-2026",
    title: "Toán + Tiếng Việt lớp 5 - 140k/b/2h, 2b/tuần - Dạy Online",
    description:
      "- Học sinh Nam, học lực TB, cần gia sư kèm chắc kiến thức trên lớp (Sách BGD)\n- Yêu cầu: Sinh viên Nam/Nữ, có kinh nghiệm, nhiệt tình, dạy lâu dài\n- Lịch học: Tối linh hoạt (có thể trao đổi thêm)",
    subject: "Toán + Tiếng Việt",
    location: "Hà Nội",
    isOnline: true,
    monthlyTuition: "1,120,000đ",
    requestsCount: 6,
    classFee: "470,000đ",
  },
  {
    id: "3",
    code: "LH1765",
    date: "02-10-2026",
    title: "KHTN lớp 7 - 180k/b/2h, 1b/tuần - Gần Royal, Thanh Xuân, HN",
    description:
      "- Học sinh Nam, mất gốc, cần gia sư kèm chắc kiến thức cơ bản (Sách BGD)\n- Yêu cầu: Sinh viên Nam/Nữ, có kinh nghiệm, nhiệt tình, dạy lâu dài\n- Lịch học: Hs trống tối T4, 6 (có thể trao đổi thêm)",
    subject: "Khoa học tự nhiên",
    location: "Hà Nội",
    isOnline: false,
    monthlyTuition: "720,000đ",
    requestsCount: 3,
    classFee: "300,000đ",
  },
  {
    id: "4",
    code: "LH1764",
    date: "01-10-2026",
    title: "Hoá học lớp 11 - 180k/b/2h, 2b/tuần - Dạy Online",
    description:
      "- Học sinh Nữ, củng cố kiến thức hữu cơ, rèn phương pháp làm bài trắc nghiệm nhanh\n- Yêu cầu: Sinh viên/Giáo viên chuyên Hóa nhiệt tình, có giáo án sẵn\n- Lịch học: Tối T3, T5 từ 19h30",
    subject: "Hoá học",
    location: "Đà Nẵng",
    isOnline: true,
    monthlyTuition: "1,440,000đ",
    requestsCount: 5,
    classFee: "600,000đ",
  },
  {
    id: "5",
    code: "LH1763",
    date: "01-10-2026",
    title: "Toán lớp 9 ôn thi vào 10 - 200k/b/2h, 3b/tuần - Cầu Giấy, HN",
    description:
      "- Học sinh Nam, mục tiêu thi đỗ trường công lập, cần kèm sát chuyên đề hình học và đại số\n- Yêu cầu: Sinh viên SP Toán hoặc ĐHQG có điểm thi ĐH cao\n- Lịch học: Chiều T2, T4, T6",
    subject: "Toán",
    location: "Hà Nội",
    isOnline: false,
    monthlyTuition: "2,400,000đ",
    requestsCount: 8,
    classFee: "950,000đ",
  },
  {
    id: "6",
    code: "LH1762",
    date: "30-09-2026",
    title: "Tiếng Trung giao tiếp cơ bản - 200k/b/2h, 2b/tuần - Dạy Online",
    description:
      "- Học viên đi làm, bắt đầu học từ pinyin và từ vựng giao tiếp thương mại hàng ngày\n- Yêu cầu: Gia sư có chứng chỉ HSK5 trở lên, phát âm chuẩn\n- Lịch học: Tối T7 và sáng CN",
    subject: "Tiếng Trung",
    location: "Hồ Chí Minh",
    isOnline: true,
    monthlyTuition: "1,600,000đ",
    requestsCount: 2,
    classFee: "650,000đ",
  },
];

export default function ClassListPage() {
  const [subjectFilter, setSubjectFilter] = useState("");
  const [formFilter, setFormFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedRequestCode, setAppliedRequestCode] = useState<string | null>(null);

  const filteredClasses = useMemo(() => {
    return mockClasses.filter((item) => {
      const matchSubject = !subjectFilter || item.subject.toLowerCase().includes(subjectFilter.toLowerCase());
      const matchForm =
        !formFilter ||
        (formFilter === "online" && item.isOnline) ||
        (formFilter === "offline" && !item.isOnline);
      const matchSearch =
        !searchQuery ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSubject && matchForm && matchSearch;
    });
  }, [subjectFilter, formFilter, searchQuery]);

  const handleApply = (code: string) => {
    setAppliedRequestCode(code);
    setTimeout(() => {
      alert(`Đã gửi đề nghị nhận lớp ${code} thành công! GiasuHome sẽ liên hệ sớm nhất.`);
    }, 100);
  };

  const resetFilters = () => {
    setSubjectFilter("");
    setFormFilter("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1D1D1D] relative pb-16 md:pb-0">
      <Header />

      {/* Top Banner Title */}
      <section className="bg-gradient-to-b from-[#fefaf2] to-[#f8f1e3] py-10 px-4 border-b border-amber-100">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1D1D1D]">
                DANH SÁCH LỚP MỚI
              </h1>
              <p className="text-sm text-[#475569] mt-1">
                Có <strong className="text-[#ca6f04]">{filteredClasses.length}</strong> kết quả phù hợp
              </p>
            </div>
            <a
              href="#filter"
              className="inline-flex items-center gap-2 self-start text-xs font-semibold px-4 py-2 rounded-full bg-white border border-amber-200 text-[#ca6f04] shadow-sm"
            >
              <i className="fa fa-bell text-amber-500"></i>
              Cập nhật lớp mới mỗi ngày
            </a>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section id="filter" className="py-6 bg-[#fcfaf7] border-b border-gray-100">
        <div className="container-custom">
          <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
            <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fa fa-filter text-[#ca6f04]"></i>
              Bộ lọc lớp học
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
              {/* Môn */}
              <div className="lg:col-span-3">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full text-xs md:text-sm px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">Chọn môn học</option>
                  <option value="Toán">Toán</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                  <option value="Hoá học">Hoá học</option>
                  <option value="Tiếng Trung">Tiếng Trung</option>
                </select>
              </div>

              {/* Hình thức */}
              <div className="lg:col-span-3">
                <select
                  value={formFilter}
                  onChange={(e) => setFormFilter(e.target.value)}
                  className="w-full text-xs md:text-sm px-3 py-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-amber-400 focus:outline-none"
                >
                  <option value="">Hình thức dạy</option>
                  <option value="offline">Dạy Offline (Tại nhà)</option>
                  <option value="online">Dạy Online</option>
                </select>
              </div>

              {/* Search text */}
              <div className="lg:col-span-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nhập mã lớp, địa chỉ, quận/huyện..."
                  className="w-full text-xs md:text-sm px-3.5 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="lg:col-span-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors text-center"
                >
                  Xoá lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Class List Table & Responsive Cards */}
      <section className="py-10 bg-white flex-1">
        <div className="container-custom">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
              <i className="fa fa-folder-open text-4xl text-gray-400 mb-3 block"></i>
              <h3 className="text-base font-bold text-gray-700">Không tìm thấy lớp học phù hợp</h3>
              <p className="text-xs text-gray-500 mt-1">Vui lòng thử lại với các tiêu chí tìm kiếm khác.</p>
              <button
                onClick={resetFilters}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold bg-[#FFB717] text-white"
              >
                Xem tất cả lớp
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f8fafc] text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="py-3.5 px-4 text-center w-28">Mã lớp</th>
                    <th className="py-3.5 px-6">Thông tin lớp học</th>
                    <th className="py-3.5 px-4 text-center w-36">Học phí tháng</th>
                    <th className="py-3.5 px-4 text-center w-36">Phí giao lớp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredClasses.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Mã lớp */}
                      <td className="py-4 px-4 text-center align-top">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {item.code}
                        </span>
                        <span className="block text-[11px] text-gray-400 mt-1.5">
                          {item.date}
                        </span>
                      </td>

                      {/* Thông tin lớp học */}
                      <td className="py-4 px-6 align-top">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 hover:text-[#ca6f04] cursor-pointer mb-1.5">
                          {item.title}
                        </h3>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed mb-3">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                            {item.subject}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                            <i className="fa-solid fa-location-dot mr-1 text-red-500"></i>
                            {item.location}
                          </span>
                          {item.isOnline ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                              <i className="fa-solid fa-globe mr-1"></i> Online
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-medium border border-orange-200">
                              <i className="fa-solid fa-house mr-1"></i> Tại nhà
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Học phí */}
                      <td className="py-4 px-4 text-center align-top">
                        <div className="text-xs text-gray-400 mb-0.5">Học phí:</div>
                        <div className="text-sm font-bold text-[#ca6f04]">
                          {item.monthlyTuition}
                        </div>
                        <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {item.requestsCount} đề nghị
                        </span>
                      </td>

                      {/* Phí nhận lớp & nút Đề nghị dạy */}
                      <td className="py-4 px-4 text-center align-top">
                        <div className="text-xs text-gray-400 mb-0.5">Phí giao lớp:</div>
                        <div className="text-sm font-semibold text-gray-800 mb-2">
                          {item.classFee}
                        </div>
                        <button
                          onClick={() => handleApply(item.code)}
                          className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            appliedRequestCode === item.code
                              ? "bg-green-600 text-white"
                              : "bg-[#FFB717] hover:bg-[#f59e0b] text-white"
                          }`}
                        >
                          {appliedRequestCode === item.code ? "Đã gửi" : "Đề nghị dạy"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#FFB717] text-white shadow">
              1
            </button>
            <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
              2
            </button>
            <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
              3
            </button>
            <button className="px-3.5 py-2 rounded-lg text-xs font-bold bg-white text-gray-700 border border-gray-200 hover:bg-gray-50">
              Tiếp <i className="fa fa-angle-right ml-1"></i>
            </button>
          </div>
        </div>
      </section>

      <Footer />
      <FloatingWidgets />
    </div>
  );
}
