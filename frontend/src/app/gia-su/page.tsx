"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWidgets from "@/components/FloatingWidgets";
import {
  Tutor,
  MOCK_TUTORS,
  SUBJECT_OPTIONS,
  LEVEL_OPTIONS,
  PROVINCE_OPTIONS,
} from "@/data/tutors";

export default function GiaSuPage() {
  // State Bộ lọc
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedForm, setSelectedForm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedGender, setSelectedGender] = useState("");

  // State Modal
  const [activeTutor, setActiveTutor] = useState<Tutor | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // State Form Mời dạy
  const [inviteForm, setInviteForm] = useState({
    name: "",
    phone: "",
    note: "",
  });

  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Lọc danh sách gia sư
  const filteredTutors = useMemo(() => {
    return MOCK_TUTORS.filter((tutor) => {
      if (
        selectedSubject &&
        !tutor.subjects.some((s) =>
          s.toLowerCase().includes(selectedSubject.toLowerCase())
        )
      ) {
        return false;
      }
      if (
        selectedLevel &&
        !tutor.levels.some((l) =>
          l.toLowerCase().includes(selectedLevel.toLowerCase())
        )
      ) {
        return false;
      }
      if (selectedForm) {
        if (selectedForm === "Offline" && !tutor.teachingForm.includes("Offline")) {
          return false;
        }
        if (selectedForm === "Online" && !tutor.teachingForm.includes("Online")) {
          return false;
        }
      }
      if (
        selectedProvince &&
        !tutor.province.toLowerCase().includes(selectedProvince.toLowerCase())
      ) {
        return false;
      }
      if (selectedGender && tutor.gender !== selectedGender) {
        return false;
      }
      return true;
    });
  }, [
    selectedSubject,
    selectedLevel,
    selectedForm,
    selectedProvince,
    selectedGender,
  ]);

  // Xoá bộ lọc
  const handleResetFilter = () => {
    setSelectedSubject("");
    setSelectedLevel("");
    setSelectedForm("");
    setSelectedProvince("");
    setSelectedGender("");
    setCurrentPage(1);
  };

  // Mở modal xem hồ sơ
  const handleOpenDetail = (tutor: Tutor) => {
    setActiveTutor(tutor);
    setIsDetailModalOpen(true);
  };

  // Đóng modal xem hồ sơ
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
  };

  // Mở modal mời dạy (có thể bấm từ bảng hoặc từ modal chi tiết)
  const handleOpenInvite = (tutor?: Tutor) => {
    if (tutor) {
      setActiveTutor(tutor);
    }
    setIsDetailModalOpen(false);
    setIsInviteModalOpen(true);
  };

  // Đóng modal mời dạy
  const handleCloseInvite = () => {
    setIsInviteModalOpen(false);
    setInviteForm({ name: "", phone: "", note: "" });
  };

  // Gửi form mời dạy
  const handleSubmitInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.phone.trim()) {
      alert("Vui lòng điền họ tên và số điện thoại.");
      return;
    }
    // Thành công
    setIsInviteModalOpen(false);
    setInviteForm({ name: "", phone: "", note: "" });
    setIsSuccessModalOpen(true);
  };

  // Đóng modal thông báo thành công
  const handleCloseSuccess = () => {
    setIsSuccessModalOpen(false);
  };

  // Phân trang
  const paginatedTutors = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTutors.slice(start, start + itemsPerPage);
  }, [filteredTutors, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTutors.length / itemsPerPage));

  // Render các ô thời gian của 1 ngày
  const renderDaySchedule = (
    dayTitle: string,
    slot: { morning: boolean; afternoon: boolean; evening: boolean }
  ) => {
    return (
      <div className="flex-1 min-w-[70px] text-center border-r last:border-r-0 border-gray-200">
        <div className="py-1.5 bg-gray-50 text-xs font-semibold text-gray-700 border-b border-gray-200">
          {dayTitle}
        </div>
        <div className="p-1 space-y-1">
          <div
            className={`py-1 text-xs rounded transition-colors ${
              slot.morning
                ? "bg-[#ca6f04] text-white font-medium"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            Sáng
          </div>
          <div
            className={`py-1 text-xs rounded transition-colors ${
              slot.afternoon
                ? "bg-[#ca6f04] text-white font-medium"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            Chiều
          </div>
          <div
            className={`py-1 text-xs rounded transition-colors ${
              slot.evening
                ? "bg-[#ca6f04] text-white font-medium"
                : "bg-white text-gray-400 border border-gray-200"
            }`}
          >
            Tối
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans">
      <Header />

      <main className="flex-1 py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
          <Link href="/" className="hover:text-[#ca6f04]">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Tìm gia sư</span>
        </div>

        {/* Panel chính */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
          {/* Header Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              DANH SÁCH GIA SƯ
            </h1>
            <span className="text-sm font-medium text-gray-500">
              Có <strong className="text-[#ca6f04]">{filteredTutors.length}</strong> kết quả (trên tổng số 3.482 gia sư)
            </span>
          </div>

          {/* Form Bộ lọc */}
          <div className="mt-5 p-4 bg-[#fdfaf5] border border-[#f5ebd9] rounded-lg">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <i className="fa fa-filter text-[#ca6f04]"></i>
              Bộ lọc gia sư
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Chọn môn học */}
              <div>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#ca6f04]"
                >
                  <option value="">Chọn môn học</option>
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn cấp học */}
              <div>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#ca6f04]"
                >
                  <option value="">Chọn cấp học</option>
                  {LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hình thức dạy */}
              <div>
                <select
                  value={selectedForm}
                  onChange={(e) => setSelectedForm(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#ca6f04]"
                >
                  <option value="">Hình thức dạy</option>
                  <option value="Offline">Offline tại nhà</option>
                  <option value="Online">Online trực tuyến</option>
                </select>
              </div>

              {/* Chọn khu vực */}
              <div>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#ca6f04]"
                >
                  <option value="">Chọn khu vực</option>
                  {PROVINCE_OPTIONS.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn giới tính */}
              <div>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-[#ca6f04]"
                >
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="flex-1 bg-[#ca6f04] hover:bg-[#b05d03] text-white text-xs sm:text-sm font-semibold py-2 px-3 rounded transition-colors"
                >
                  Tìm kiếm
                </button>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs sm:text-sm font-medium py-2 px-3 rounded transition-colors"
                >
                  Xoá lọc
                </button>
              </div>
            </div>
          </div>

          {/* Bảng danh sách gia sư */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-xs sm:text-sm uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4 text-center w-[15%]">Hình ảnh</th>
                  <th className="py-3 px-4 text-left">Thông tin tóm tắt</th>
                  <th className="py-3 px-4 text-center w-[15%]">Hồ sơ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTutors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-gray-500">
                      Không tìm thấy gia sư nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedTutors.map((tutor) => (
                    <tr key={tutor.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* Avatar */}
                      <td className="py-4 px-4 text-center align-middle">
                        <div
                          onClick={() => handleOpenDetail(tutor)}
                          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full overflow-hidden border-2 border-amber-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={tutor.avatar}
                            alt={tutor.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Thông tin tóm tắt */}
                      <td className="py-4 px-4 text-left align-middle">
                        <div
                          onClick={() => handleOpenDetail(tutor)}
                          className="font-bold text-[#ca6f04] hover:text-[#b05d03] text-sm sm:text-base cursor-pointer mb-1 inline-block"
                        >
                          {tutor.code} - {tutor.name} - [{tutor.role}]
                        </div>

                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <p>
                            - <span className="font-medium text-gray-800">Trường:</span>{" "}
                            {tutor.school}, chuyên ngành {tutor.major}
                          </p>
                          <p>
                            - <span className="font-medium text-gray-800">Môn dạy:</span>{" "}
                            {tutor.subjects.join(", ")}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="inline-block text-[11px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                            {tutor.teachingForm}
                          </span>
                          <span className="inline-block text-[11px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                            {tutor.districts}
                          </span>
                        </div>
                      </td>

                      {/* Nút xem hồ sơ */}
                      <td className="py-4 px-4 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(tutor)}
                          className="bg-[#ca6f04] hover:bg-[#b05d03] text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-md shadow-sm transition-colors whitespace-nowrap"
                        >
                          Xem hồ sơ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 text-xs rounded font-medium ${
                    currentPage === i + 1
                      ? "bg-[#ca6f04] text-white"
                      : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-xs rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: HỒ SƠ GIA SƯ (Khớp 100% ảnh 1 & 2) */}
      {/* ========================================================================= */}
      {isDetailModalOpen && activeTutor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Modal Màu Cam */}
            <div className="bg-[#ca6f04] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold tracking-wide">
                HỒ SƠ GIA SƯ
              </h3>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="text-white hover:text-gray-200 text-xl font-bold leading-none p-1"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Nội dung hồ sơ */}
            <div className="p-4 sm:p-6 max-h-[82vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Cột trái: Thông tin cá nhân & Học vấn (md:col-span-4) */}
                <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-gray-200 pb-5 md:pb-0 md:pr-5">
                  {/* Top: Avatar + Tên */}
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#ca6f04]/40 flex-shrink-0">
                      <img
                        src={activeTutor.avatar}
                        alt={activeTutor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">
                        {activeTutor.name}
                      </h4>
                      <span className="text-xs text-gray-500 font-medium">
                        Mã: {activeTutor.code}
                      </span>
                    </div>
                  </div>

                  {/* Thông tin cá nhân */}
                  <div className="mb-5">
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-2.5">
                      Thông tin cá nhân
                    </h5>
                    <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5">
                      <li>
                        - Năm sinh: <span className="font-normal">{activeTutor.birthYear}</span>
                      </li>
                      <li>
                        - Giới tính: <span className="font-normal">{activeTutor.gender}</span>
                      </li>
                      <li>
                        - Quê quán: <span className="font-normal">{activeTutor.hometown}</span>
                      </li>
                      <li>
                        - Giọng nói: <span className="font-normal">{activeTutor.voice}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Học vấn */}
                  <div>
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-2.5">
                      Học vấn
                    </h5>
                    <ul className="text-xs sm:text-sm text-gray-700 space-y-1.5">
                      <li>
                        - Cấp bậc: <span className="font-normal">{activeTutor.degree}</span>
                      </li>
                      <li>
                        - Chuyên ngành: <span className="font-normal">{activeTutor.major}</span>
                      </li>
                      <li>
                        - Trường: <span className="font-normal">{activeTutor.school}</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Cột phải: Chuyên môn, Khu vực, Thành tích, Lịch dạy (md:col-span-8) */}
                <div className="md:col-span-8 space-y-4">
                  {/* Chuyên môn dạy */}
                  <div>
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-1.5">
                      Chuyên môn dạy
                    </h5>
                    <p className="text-xs sm:text-sm text-gray-700">
                      - {activeTutor.subjectDetail}
                    </p>
                  </div>

                  {/* Khu vực dạy */}
                  <div>
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-1.5">
                      Khu vực dạy
                    </h5>
                    <p className="text-xs sm:text-sm text-gray-700">
                      - {activeTutor.teachingForm}: {activeTutor.districts} [{activeTutor.province}]
                    </p>
                  </div>

                  {/* Thành tích và kinh nghiệm */}
                  <div>
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-1.5">
                      Thành tích và kinh nghiệm
                    </h5>
                    <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed bg-gray-50/70 p-3 rounded border border-gray-100">
                      {activeTutor.experience}
                    </div>
                  </div>

                  {/* Thời gian có thể dạy [Màu cam] */}
                  <div>
                    <h5 className="font-bold text-[#ca6f04] text-sm mb-2">
                      Thời gian có thể dạy <span className="text-xs font-normal text-gray-500">[Màu cam]</span>
                    </h5>
                    <div className="overflow-x-auto border border-gray-200 rounded">
                      <div className="flex min-w-[500px]">
                        {renderDaySchedule("Thứ 2", activeTutor.schedule.thu2)}
                        {renderDaySchedule("Thứ 3", activeTutor.schedule.thu3)}
                        {renderDaySchedule("Thứ 4", activeTutor.schedule.thu4)}
                        {renderDaySchedule("Thứ 5", activeTutor.schedule.thu5)}
                        {renderDaySchedule("Thứ 6", activeTutor.schedule.thu6)}
                        {renderDaySchedule("Thứ 7", activeTutor.schedule.thu7)}
                        {renderDaySchedule("Chủ nhật", activeTutor.schedule.chuNhat)}
                      </div>
                    </div>
                  </div>

                  {/* Badge Xác thực GiasuHome */}
                  <div className="p-3.5 bg-[#fffbeb] border border-[#fef3c7] rounded-lg flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                      ✓
                    </div>
                    <div>
                      <h6 className="font-bold text-gray-900 text-xs sm:text-sm">
                        Hồ sơ đã được GiasuHome xác thực
                      </h6>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Thông tin cá nhân và học vấn đã được kiểm tra trước khi kết nối tới phụ huynh.
                      </p>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <a
                      href="https://zalo.me/0369148660"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#6b7280] hover:bg-[#4b5563] text-white font-medium text-xs sm:text-sm py-2 px-5 rounded transition-colors"
                    >
                      Cần tư vấn
                    </a>
                    <button
                      type="button"
                      onClick={() => handleOpenInvite()}
                      className="bg-[#ca6f04] hover:bg-[#b05d03] text-white font-semibold text-xs sm:text-sm py-2 px-6 rounded transition-colors"
                    >
                      Mời dạy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GỬI LỜI MỜI DẠY (Khớp 100% ảnh 3) */}
      {/* ========================================================================= */}
      {isInviteModalOpen && activeTutor && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Màu Cam */}
            <div className="bg-[#ca6f04] text-white px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-base font-bold tracking-wide">
                Gửi lời mời dạy
              </h3>
              <button
                type="button"
                onClick={handleCloseInvite}
                className="text-white hover:text-gray-200 text-xl font-bold leading-none p-1"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Thông tin Gia sư nhận lời mời */}
            <div className="p-5 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-300 flex-shrink-0">
                <img
                  src={activeTutor.avatar}
                  alt={activeTutor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                  {activeTutor.code} - {activeTutor.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {activeTutor.subjects.join(", ")} • {activeTutor.province}
                </p>
              </div>
            </div>

            {/* Form Gửi lời mời */}
            <form onSubmit={handleSubmitInvite} className="p-5 space-y-3.5">
              <p className="text-xs sm:text-sm text-gray-700 font-medium">
                Để lại thông tin để gia sư chủ động liên hệ trao đổi với bạn.
              </p>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Vui lòng nhập tên*"
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-3.5 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ca6f04]"
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  placeholder="Số điện thoại*"
                  value={inviteForm.phone}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, phone: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-3.5 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ca6f04]"
                />
              </div>

              <div>
                <textarea
                  rows={3}
                  placeholder="Nhu cầu học tập (không bắt buộc)"
                  value={inviteForm.note}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, note: e.target.value })
                  }
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded px-3.5 py-2.5 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ca6f04]"
                ></textarea>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://zalo.me/0369148660"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 text-center bg-[#6b7280] hover:bg-[#4b5563] text-white font-medium text-xs sm:text-sm py-2.5 px-4 rounded transition-colors"
                >
                  Cần tư vấn
                </a>
                <button
                  type="submit"
                  className="flex-1 bg-[#ca6f04] hover:bg-[#b05d03] text-white font-semibold text-xs sm:text-sm py-2.5 px-4 rounded transition-colors"
                >
                  Gửi lời mời
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: THÔNG BÁO THÀNH CÔNG (Khớp 100% ảnh 4) */}
      {/* ========================================================================= */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header Xanh Lá */}
            <div className="bg-[#48bb78] text-white px-5 py-3 flex items-center justify-between">
              <h3 className="text-base font-bold tracking-wide">
                Thành công
              </h3>
              <button
                type="button"
                onClick={handleCloseSuccess}
                className="text-white hover:text-gray-100 text-lg font-bold leading-none p-1"
                aria-label="Đóng modal"
              >
                ✕
              </button>
            </div>

            {/* Nội dung thông báo */}
            <div className="p-6 text-center space-y-5">
              <p className="text-sm text-gray-800 leading-relaxed font-medium">
                Gửi lời mời thành công. Gia sư sẽ liên hệ sớm nhất trao đổi và hẹn lịch dạy thử.
              </p>

              <div>
                <button
                  type="button"
                  onClick={handleCloseSuccess}
                  className="bg-[#6b7280] hover:bg-[#4b5563] text-white font-medium text-sm py-2 px-8 rounded transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FloatingWidgets />
      <Footer />
    </div>
  );
}
