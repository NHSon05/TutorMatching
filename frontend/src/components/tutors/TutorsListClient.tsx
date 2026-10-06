"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Tutor, TutorFilter, getMockTutors } from "@/data/mockTutors";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

interface TutorsListClientProps {
  initialTutors: Tutor[];
}

export default function TutorsListClient({ initialTutors }: TutorsListClientProps) {
  const router = useRouter();

  const [filter, setFilter] = useState<TutorFilter>({
    category: "all",
    city: "all",
    level: "all",
    mode: "all",
    search: "",
  });

  const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFilterChange = (key: keyof TutorFilter, value: string) => {
    const updated = { ...filter, [key]: value };
    setFilter(updated);
    setTutors(getMockTutors(updated));
  };

  const handleSearchClick = () => {
    setTutors(getMockTutors(filter));
  };

  const handleReset = () => {
    const resetFilter: TutorFilter = {
      category: "all",
      city: "all",
      level: "all",
      mode: "all",
      search: "",
    };
    setFilter(resetFilter);
    setTutors(getMockTutors(resetFilter));
  };

  const handleBook = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* ========================================================================= */}
        {/* TOP DESCRIPTION SECTION (Khớp mẫu thiết kế)                               */}
        {/* ========================================================================= */}
        <div className="mb-6">
          <p className="text-base text-gray-600 font-medium max-w-2xl leading-relaxed">
            Tìm gia sư giỏi nhất cho bạn! Đội ngũ gia sư chất lượng cao sẽ đồng hành giúp bạn tìm ra giải pháp tối ưu cho việc học tập!
          </p>
        </div>

        {/* ========================================================================= */}
        {/* FLOATING FILTER BAR (Khớp card bo tròn trắng trong ảnh mẫu)               */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl shadow-blue-900/5 border border-gray-100 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
            
            {/* Filter 1: Môn học (Type of counseling) */}
            <div className="lg:col-span-3 px-2 border-b sm:border-b-0 sm:border-r border-gray-100 pb-3 sm:pb-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Môn học
              </label>
              <div className="relative">
                <select
                  value={filter.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full text-base font-semibold text-gray-800 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all">Tất cả môn học</option>
                  <option value="math">Toán học</option>
                  <option value="english">Tiếng Anh</option>
                  <option value="physics">Vật lý</option>
                  <option value="chemistry">Hóa học</option>
                  <option value="literature">Ngữ văn</option>
                  <option value="it">Tin học</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 2: Thành phố (City) */}
            <div className="lg:col-span-3 px-2 border-b sm:border-b-0 sm:border-r border-gray-100 pb-3 sm:pb-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Tỉnh / Thành phố
              </label>
              <div className="relative">
                <select
                  value={filter.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className="w-full text-base font-semibold text-gray-800 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all">Tất cả thành phố</option>
                  <option value="hanoi">Hà Nội</option>
                  <option value="danang">Đà Nẵng</option>
                  <option value="hcm">TP. Hồ Chí Minh</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 3: Cấp học (Age / Level) */}
            <div className="lg:col-span-2 px-2 border-b sm:border-b-0 sm:border-r border-gray-100 pb-3 sm:pb-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Cấp học
              </label>
              <div className="relative">
                <select
                  value={filter.level}
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                  className="w-full text-base font-semibold text-gray-800 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all">Tất cả cấp học</option>
                  <option value="primary">Tiểu học</option>
                  <option value="secondary">THCS</option>
                  <option value="highschool">THPT</option>
                  <option value="university">Đại học</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 4: Hình thức học (Gender / Mode) */}
            <div className="lg:col-span-3 px-2 pb-3 sm:pb-0">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Hình thức học
              </label>
              <div className="relative">
                <select
                  value={filter.mode}
                  onChange={(e) => handleFilterChange("mode", e.target.value)}
                  className="w-full text-base font-semibold text-gray-800 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all">Tất cả hình thức</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter Search Button Icon */}
            <div className="lg:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={handleSearchClick}
                className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm group"
                aria-label="Tìm kiếm gia sư"
              >
                <svg
                  className="w-5 h-5 transition-transform group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION HEADER: "Best for you" + Counter Pill + "See all >"                */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Danh Sách Gia Sư
            </h1>
            <span className="text-xs font-bold text-gray-500 bg-gray-200/80 px-2.5 py-0.5 rounded-full">
              {tutors.length}
            </span>
          </div>

          <Button
            type="button"
            variant="secondary"
            shape="pill"
            size="small"
            onClick={handleReset}
            className="text-base font-semibold text-gray-700 hover:text-blue-600 flex items-center gap-1.5 px-4"
          >
            <span>Xem tất cả</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* TUTORS GRID (3 Cột chuẩn thiết kế)                                        */}
        {/* ========================================================================= */}
        {tutors.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy gia sư phù hợp</h3>
            <p className="text-base text-gray-500 mb-6">
              Vui lòng thử chọn bộ lọc khác hoặc nhấn xem tất cả để tải lại danh sách.
            </p>
            <Button variant="brand" shape="pill" size="medium" onClick={handleReset}>
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {tutors.map((tutor) => (
              <Card
                key={tutor.id}
                hoverable
                padding="large"
                className="!rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Avatar + Name & Subtitle */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <Avatar
                      size="large"
                      src={tutor.avatar}
                      alt={tutor.name}
                      fallbackText={tutor.name}
                      shape="circle"
                      className="border border-gray-100 shadow-xs"
                    />
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-gray-900 leading-snug truncate">
                        {tutor.name}
                      </h2>
                      <p className="text-sm text-gray-500 font-medium truncate">
                        {tutor.title}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge & Location */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white ${
                        tutor.rating >= 4.8 ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                    >
                      <span className="text-[10px]">★</span>
                      <span>{tutor.rating.toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-gray-500 truncate">
                      <svg
                        className="w-4 h-4 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                        <circle cx="12" cy="12" r="8" strokeWidth="2" />
                      </svg>
                      <span className="truncate">{tutor.location}</span>
                    </div>
                  </div>

                  {/* Stats (Experience & Sessions) */}
                  <div className="space-y-0.5 mb-4">
                    <p className="text-sm text-gray-700 font-medium">
                      {tutor.experience}
                    </p>
                    <p className="text-sm text-gray-500">
                      {tutor.sessionsCount}
                    </p>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tutor.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer: Price & CTA Button */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-lg font-extrabold text-gray-900 block leading-tight">
                      {tutor.priceFormatted}
                    </span>
                    <span className="text-xs text-gray-400">
                      {tutor.mode}
                    </span>
                  </div>

                  <Button
                    variant="brand"
                    shape="pill"
                    size="medium"
                    className="text-base font-semibold px-5 shadow-sm hover:shadow-md transition-shadow"
                    onClick={() => handleBook(tutor)}
                  >
                    Đặt lịch học
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL CHI TIẾT GIA SƯ / ĐẶT LỊCH HỌC                                      */}
        {/* ========================================================================= */}
        {isModalOpen && selectedTutor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
              
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                ✕
              </button>

              <div className="flex items-center gap-4 mb-5">
                <Avatar
                  size="xlarge"
                  src={selectedTutor.avatar}
                  alt={selectedTutor.name}
                  fallbackText={selectedTutor.name}
                  shape="circle"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedTutor.name}
                  </h3>
                  <p className="text-base text-gray-500 font-medium">
                    {selectedTutor.title}
                  </p>
                  <p className="text-sm text-blue-600 font-semibold mt-1">
                    {selectedTutor.priceFormatted} • {selectedTutor.mode}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/60 rounded-2xl p-4 mb-6 text-sm text-blue-900 space-y-1">
                <p>📍 <strong>Khu vực:</strong> {selectedTutor.location}</p>
                <p>🎓 <strong>Kinh nghiệm:</strong> {selectedTutor.experience}</p>
                <p>⏱️ <strong>Đã hoàn thành:</strong> {selectedTutor.sessionsCount}</p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  shape="pill"
                  size="large"
                  onClick={() => setIsModalOpen(false)}
                  className="text-base font-semibold"
                >
                  Đóng
                </Button>
                <Button
                  variant="brand"
                  shape="pill"
                  size="large"
                  onClick={() => {
                    setIsModalOpen(false);
                    router.push("/login");
                  }}
                  className="text-base font-semibold"
                >
                  Đăng nhập để kết nối
                </Button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
