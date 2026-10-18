"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { TextField } from "@/components/ui/text-field";
import { useSession } from "@/hooks/use-session";
import { useAuthStore } from "@/stores/use-auth-store";
import { getTutors, type TutorListItemResponse } from "@/lib/api/tutors";
import { HireTutorDialog } from "./HireTutorDialog";
import type { Tutor, TutorCategory, TutorCity, TutorFilter, TutorsListClientProps } from "./types";

export type * from "./types";

function mapResponseToTutor(item: TutorListItemResponse): Tutor {
  const cityKey: TutorCity =
    item.schoolName?.toLowerCase().includes("hà nội") || item.schoolName?.toLowerCase().includes("hanoi")
      ? "hanoi"
      : item.schoolName?.toLowerCase().includes("đà nẵng") || item.schoolName?.toLowerCase().includes("danang")
      ? "danang"
      : "hcm";

  const primarySubject = item.subjects[0] || "Gia sư";
  let category: TutorCategory = "math";
  const s = primarySubject.toLowerCase();
  if (s.includes("toán")) category = "math";
  else if (s.includes("anh") || s.includes("tiếng anh")) category = "english";
  else if (s.includes("vật lý") || s.includes("lý")) category = "physics";
  else if (s.includes("hóa")) category = "chemistry";
  else if (s.includes("văn")) category = "literature";
  else if (s.includes("tin") || s.includes("lập trình")) category = "it";

  const tags = [...item.subjects, ...item.certifications.map((c) => c.name)];
  if (item.degree) tags.push(item.degree);

  return {
    id: item.id,
    name: item.fullName,
    avatar: item.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256",
    title: `Gia sư ${primarySubject} • ${item.schoolName || "Đại học"}`,
    rating: item.rating || 5.0,
    location: item.schoolName || (cityKey === "hanoi" ? "Hà Nội" : cityKey === "danang" ? "Đà Nẵng" : "TP. Hồ Chí Minh"),
    experience: `${item.experienceYears} năm kinh nghiệm`,
    sessionsCount: "Đã xác thực",
    tags: tags.slice(0, 4),
    priceFormatted: `${(item.hourlyRateVnd || 150000).toLocaleString("vi-VN")}đ/h`,
    pricePerHour: item.hourlyRateVnd || 150000,
    mode: "Online / Offline",
    category,
    city: cityKey,
    level: "highschool",
  };
}

export default function TutorsListClient({ initialTutors }: TutorsListClientProps) {
  const router = useRouter();
  const { data: sessionAccount } = useSession();
  const storeUser = useAuthStore((s) => s.user);
  const isAuthenticated = Boolean(sessionAccount || storeUser);

  const [filter, setFilter] = useState<TutorFilter>({
    category: "all",
    city: "all",
    level: "all",
    mode: "all",
    search: "",
  });

  const [allTutors, setAllTutors] = useState<Tutor[]>(initialTutors);
  const [tutors, setTutors] = useState<Tutor[]>(initialTutors);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHireDialogOpen, setIsHireDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadRealTutors() {
      try {
        const res = await getTutors();
        if (isMounted && res.items.length > 0) {
          const mapped = res.items.map(mapResponseToTutor);
          setAllTutors(mapped);
          setTutors(mapped);
        }
      } catch {
        // Giữ fallback mock tutors nếu chưa kết nối được
      }
    }
    loadRealTutors();
    return () => {
      isMounted = false;
    };
  }, []);

  const applyFilter = (filterState: TutorFilter, sourceList: Tutor[]) => {
    return sourceList.filter((item) => {
      if (filterState.category !== "all" && item.category !== filterState.category) return false;
      if (filterState.city !== "all" && item.city !== filterState.city) return false;
      if (filterState.level !== "all" && item.level !== filterState.level) return false;
      if (filterState.mode !== "all" && item.mode !== filterState.mode) return false;
      if (
        filterState.search &&
        !item.name.toLowerCase().includes(filterState.search.toLowerCase()) &&
        !item.title.toLowerCase().includes(filterState.search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  };

  const handleFilterChange = (key: keyof TutorFilter, value: string) => {
    const updated = { ...filter, [key]: value };
    setFilter(updated);
    setTutors(applyFilter(updated, allTutors));
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
    setTutors(applyFilter(resetFilter, allTutors));
  };

  const handleBook = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* ========================================================================= */}
        {/* PAGE HEADER                                                               */}
        {/* ========================================================================= */}
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  Danh Sách Gia Sư
                </h1>
                <span className="text-sm font-bold text-brand bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100 dark:border-blue-900 px-3 py-1 rounded-full">
                  {tutors.length} gia sư
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Tìm kiếm và kết nối 1 kèm 1 với gia sư giỏi, giàu kinh nghiệm và phù hợp nhất với bạn
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FLOATING FILTER BAR                                                       */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-xl shadow-blue-900/5 border border-gray-100 dark:border-gray-800 transition-all">

          {/* Row 1: Search keyword input */}
          <div className="mb-4">
            <TextField
              size="large"
              variant="filled"
              value={filter.search ?? ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Tìm theo tên gia sư, trường đại học, môn nhận dạy..."
              isClearable
              onClear={() => handleFilterChange("search", "")}
              leadingIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              className="w-full"
            />
          </div>

          {/* Row 2: 4 Bộ lọc chi tiết */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">

            {/* Filter 1: Môn học */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Môn học
              </label>
              <div className="relative">
                <select
                  value={filter.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tất cả môn học</option>
                  <option value="math" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Toán học</option>
                  <option value="english" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tiếng Anh</option>
                  <option value="physics" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Vật lý</option>
                  <option value="chemistry" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Hóa học</option>
                  <option value="literature" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Ngữ văn</option>
                  <option value="it" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tin học</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 2: Thành phố */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Tỉnh / Thành phố
              </label>
              <div className="relative">
                <select
                  value={filter.city}
                  onChange={(e) => handleFilterChange("city", e.target.value)}
                  className="w-full text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tất cả thành phố</option>
                  <option value="hanoi" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Hà Nội</option>
                  <option value="danang" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Đà Nẵng</option>
                  <option value="hcm" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">TP. Hồ Chí Minh</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 3: Cấp học */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Cấp học
              </label>
              <div className="relative">
                <select
                  value={filter.level}
                  onChange={(e) => handleFilterChange("level", e.target.value)}
                  className="w-full text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tất cả cấp học</option>
                  <option value="primary" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tiểu học</option>
                  <option value="secondary" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">THCS</option>
                  <option value="highschool" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">THPT</option>
                  <option value="university" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Đại học</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter 4: Hình thức học */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
              <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                Hình thức học
              </label>
              <div className="relative">
                <select
                  value={filter.mode}
                  onChange={(e) => handleFilterChange("mode", e.target.value)}
                  className="w-full text-sm font-semibold text-gray-800 dark:text-gray-100 bg-transparent pr-6 focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="all" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Tất cả hình thức</option>
                  <option value="online" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Online</option>
                  <option value="offline" className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">Offline</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* TUTORS GRID                                                               */}
        {/* ========================================================================= */}
        {tutors.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy gia sư phù hợp</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-6">
              Vui lòng thử chọn bộ lọc khác hoặc nhấn xem tất cả để tải lại danh sách.
            </p>
            <Button variant="brand" shape="pill" size="medium" onClick={handleReset}>
              Đặt lại bộ lọc
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {tutors.map((tutor) => (
              <Card
                key={tutor.id}
                hoverable
                padding="large"
                className="rounded-3xl! border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
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
                      className="border border-gray-100 dark:border-gray-800 shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-snug truncate">
                        {tutor.name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                        {tutor.title}
                      </p>
                    </div>
                  </div>

                  {/* Rating Badge & Location */}
                  <div className="flex items-center gap-3 mb-3.5">
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold text-white shrink-0 ${
                        tutor.rating >= 4.8 ? "bg-emerald-600" : "bg-amber-500"
                      }`}
                    >
                      <span className="text-[10px]">★</span>
                      <span>{tutor.rating.toFixed(1)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                      <svg
                        className="w-4 h-4 text-gray-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">{tutor.location}</span>
                    </div>
                  </div>

                  {/* Stats (Experience & Sessions) */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <span className="text-gray-400">💼</span>
                      <span>{tutor.experience}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{tutor.sessionsCount}</span>
                    </div>
                  </div>

                  {/* Tag Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {tutor.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Footer: Price & CTA Button */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white block leading-tight">
                      {tutor.priceFormatted}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {tutor.mode}
                    </span>
                  </div>

                  <Button
                    variant="brand"
                    shape="pill"
                    size="medium"
                    className="text-sm font-semibold px-5 shadow-xs hover:shadow-md transition-shadow"
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
        {/* MODAL                                                                     */}
        {/* ========================================================================= */}
        {isModalOpen && selectedTutor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-800 relative">

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
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
                  className="border border-gray-100 dark:border-gray-800 shadow-sm shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                    {selectedTutor.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">
                    {selectedTutor.title}
                  </p>
                  <p className="text-sm text-brand font-semibold mt-1">
                    {selectedTutor.priceFormatted} • {selectedTutor.mode}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl p-4 mb-6 text-sm text-blue-950 dark:text-blue-200 space-y-1.5 border border-blue-100/60 dark:border-blue-900/60">
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
                    if (isAuthenticated) {
                      setIsHireDialogOpen(true);
                    } else {
                      router.push("/login");
                    }
                  }}
                  className="text-base font-semibold"
                >
                  {isAuthenticated ? "Thuê gia sư" : "Đăng nhập để kết nối"}
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* DIALOG                                                                    */}
        {/* ========================================================================= */}
        <HireTutorDialog
          isOpen={isHireDialogOpen}
          onClose={() => setIsHireDialogOpen(false)}
          onBackToDetail={() => {
            setIsHireDialogOpen(false);
            setIsModalOpen(true);
          }}
          tutor={selectedTutor}
        />

      </div>
    </div>
  );
}
