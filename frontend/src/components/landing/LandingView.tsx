"use client";

import Link from "next/link";
import { useState } from "react";
import { Image } from "@/components/ui/image";
import LandingDemandChat from "@/components/landing/LandingDemandChat";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Pause,
  Play,
  Plus,
  TrendingUp,
  Video,
} from "@/components/icons";
import {
  CUSTOMER_STORIES,
  HOMEWORK_ITEMS,
  HOMEWORK_TABS,
  PARTNER_SCHOOLS,
  PERSONA_TABS,
  PLATFORM_PORTRAITS,
  PROGRAM_LEVELS,
} from "@/data";
import section1Img from "@assets/imgs/section-1.webp";

export default function LandingView() {
  const [marqueePaused, setMarqueePaused] = useState(false);
  const [activePersonaIndex, setActivePersonaIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeHomeworkTab, setActiveHomeworkTab] =
    useState<(typeof HOMEWORK_TABS)[number]>("Cần làm");
  const [selectedLearningMode, setSelectedLearningMode] = useState<
    "online" | "home" | "hybrid"
  >("hybrid");

  const activePersona = PERSONA_TABS[activePersonaIndex];

  return (
    <div className="min-h-screen bg-surface-subtle text-brand-950 selection:bg-brand selection:text-white overflow-x-clip">
      {/* =====================================================================
          SECTION 1: WORKDAY FULL-BLEED HERO + AI CONCIERGE BAR
      ===================================================================== */}
      <section id="hero" className="px-3 sm:px-6 pt-3 pb-4">
        <div className="relative max-w-[1776px] mx-auto min-h-190 lg:min-h-210 rounded-[36px] overflow-hidden flex flex-col justify-between px-4 sm:px-10 lg:px-16 py-14 sm:py-20 shadow-xl">
          {/* Background Photography (User's section-1.webp) */}
          <div className="absolute inset-0">
            <Image
              src={section1Img.src}
              alt="Hai học sinh cùng học tập và khám phá tri thức trên TutorMatch"
              rounded="none"
              className="w-full h-full object-cover object-center scale-102"
            />
          </div>

          {/* Multi-Stop Editorial Scrim Overlay for High Contrast Readability */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-linear-to-b from-brand-950/75 via-brand-950/55 to-brand-950/88"
          />

          {/* Top Spacer */}
          <div aria-hidden="true" className="relative z-10 h-2" />

          {/* Center Editorial Display Stack + Workday AI Concierge Input */}
          <div className="relative z-10 max-w-4xl mx-auto w-full text-center space-y-6 sm:space-y-8 my-auto">
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] lg:leading-18 font-bold tracking-tight text-white">
              AI kết nối gia sư chuẩn xác.
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-white/90 max-w-2xl mx-auto font-medium">
              Kết nối học sinh và gia sư 1-1 tài năng trên một nền tảng duy nhất
              — tự động phân tích nhu cầu học tập, gợi ý lộ trình cá nhân hóa và
              cam kết tiến bộ vượt trội.
            </p>

            {/* Workday AI Concierge Pill Input + Suggestion Pills */}
            <div className="pt-2">
              <LandingDemandChat />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 2: WORKDAY ROUNDED-36 TRUST & PARTNER MARQUEE
      ===================================================================== */}
      <section id="logo-marquee" className="px-3 sm:px-6 py-3">
        <div className="max-w-[1776px] mx-auto rounded-[36px] bg-surface-card border border-border-default px-6 sm:px-10 lg:px-14 py-7 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xs">
          <p className="text-base font-bold text-brand lg:max-w-xs text-center lg:text-left shrink-0">
            Kết nối với sinh viên tại các trường đại học lớn.
          </p>

          {/* Partner School Badges Strip */}
          <div className="flex-1 overflow-hidden w-full">
            <div
              className={`flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-between gap-3 sm:gap-4 transition-opacity ${
                marqueePaused ? "opacity-75" : "opacity-100"
              }`}
            >
              {PARTNER_SCHOOLS.slice(0, 6).map((school) => (
                <div
                  key={school}
                  className="inline-flex items-center gap-2 rounded-full bg-surface-subtle border border-border-default px-4 py-2 text-xs sm:text-base font-bold text-brand whitespace-nowrap"
                >
                  <span>{school}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workday Marquee Play / Pause Control Button */}
          <button
            type="button"
            onClick={() => setMarqueePaused((prev) => !prev)}
            aria-label={
              marqueePaused
                ? "Tiếp tục chạy danh sách đối tác"
                : "Tạm dừng danh sách đối tác"
            }
            className="w-10 h-10 rounded-full border border-border-default hover:bg-gray-900/5 text-brand flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            {marqueePaused ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: WORKDAY 3-COLUMN PLATFORM PORTRAIT GRID
          ("The trusted agentic platform for people, money, and agents.")
      ===================================================================== */}
      <section
        id="about"
        className="max-w-381.5 mx-auto px-4 sm:px-8 py-20 lg:py-28"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl lg:leading-15 font-bold tracking-tight text-brand-900">
            Nền tảng kết nối Gia sư, Học phí và Trợ lý AI đáng tin cậy.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-9 mt-14 lg:mt-20">
          {PLATFORM_PORTRAITS.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between space-y-6 group"
            >
              <div className="space-y-6">
                {/* 3:4 Portrait Container with Floating Glass UI Overlay */}
                <div className="relative aspect-3/4 w-full max-w-sm mx-auto md:max-w-none rounded-3xl overflow-hidden bg-brand-950 shadow-md">
                  <div className="absolute inset-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      rounded="none"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-brand-950/80 via-transparent to-transparent"
                  />

                  {/* Floating Frosted Glass UI Pill Card inside Portrait */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/88 backdrop-blur-xl border border-white/60 p-4 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-base font-bold text-brand-950 leading-tight">
                          {item.badgeTitle}
                        </p>
                        <p className="text-sm text-content-secondary mt-0.5">
                          {item.badgeSubtitle}
                        </p>
                      </div>
                      <span className="rounded-full bg-brand-50 text-brand px-2.5 py-1 text-sm font-bold shrink-0">
                        {item.badgeMetric}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Editorial Card Copy */}
                <div className="space-y-3">
                  <h3 className="text-2xl leading-7 font-bold text-brand-950">
                    {item.title}
                  </h3>
                  <p className="text-base leading-6 text-content-secondary">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Workday Soft-Tint Pill CTA (rgba(21, 29, 38, 0.08)) */}
              <div>
                <Link
                  href={item.ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-gray-900/8 hover:bg-gray-900/14 text-brand font-semibold text-base px-6 py-3 transition-colors"
                >
                  <span>{item.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =====================================================================
          SECTION 4: WORKDAY DARK NAVY ROUNDED-36 SHOWCASE
          ("Put AI to work for your people" + "Meet Sana")
      ===================================================================== */}
      <section id="ai-platform" className="px-3 sm:px-6 py-4">
        <div className="max-w-[1776px] mx-auto rounded-[36px] bg-linear text-white px-6 sm:px-12 lg:px-20 py-20 lg:py-28 shadow-xl">
          {/* Part A: Centered H2 + Interactive Persona Pill Tabs */}
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-5xl lg:text-[56px] lg:leading-15 font-bold tracking-tight text-white">
              Đặt công nghệ AI phục vụ việc dạy và học của bạn.
            </h2>

            {/* Pill Tab Bar */}
            <div
              role="tablist"
              aria-label="Giải pháp AI theo nhóm người dùng"
              className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-white/8 border border-white/15"
            >
              {PERSONA_TABS.map((tab, idx) => {
                const isActive = idx === activePersonaIndex;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePersonaIndex(idx)}
                    className={`px-5 py-4 rounded-full text-base font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-brand-950 shadow-sm"
                        : "text-white/80 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Persona 2-Column Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center mt-14">
            {/* Left: 4:3 Photo + Floating Glass AI Card */}
            <div className="lg:col-span-7 relative aspect-4/3 rounded-3xl overflow-hidden border border-white/15 bg-brand-900">
              <div className="absolute inset-0">
                <Image
                  src={activePersona.image}
                  alt={activePersona.title}
                  rounded="none"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-linear-to-t from-brand-950/90 via-brand-950/30 to-transparent"
              />
            </div>

            {/* Right: Editorial Persona Copy */}
            <div className="lg:col-span-5 space-y-6 text-left">
              <h3 className="text-4xl sm:leading-9 font-bold text-white">
                {activePersona.title}
              </h3>
              <ul className="space-y-3 pt-1">
                {activePersona.bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-2.5 text-base text-white/90"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link
                  href={activePersona.ctaHref}
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 hover:bg-white/20 border border-white/20 text-white font-bold text-sm px-6 py-3.5 transition-colors"
                >
                  <span>{activePersona.ctaLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Horizontal Divider inside Dark Showcase */}
          <div className="my-20 lg:my-24 border-t border-white/15" />

          {/* Part B: "Meet Sana" Equivalent — Gặp gỡ TutorMatch AI */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Stacked White Floating Task Cards over Dark Glass Tablet */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-linear p-6 sm:p-8 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between text-xs text-white/70 pb-2">
                  <span className="font-bold uppercase tracking-wider text-blue-200">
                    Không gian Điều phối Học tập AI
                  </span>
                  <span>Tự động cập nhật 24/7</span>
                </div>

                {/* White Floating Card 1 */}
                <div className="rounded-2xl bg-surface-card text-brand-950 p-4 sm:p-5 shadow-lg flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="inline-block rounded-full bg-brand-50 text-brand px-2.5 py-0.5 text-xs font-bold">
                      Ghép lớp thông minh
                    </span>
                    <p className="text-sm sm:text-base font-bold">
                      Đã tìm thấy 3 Gia sư Toán Lớp 9 tại Quận Cầu Giấy
                    </p>
                    <p className="text-xs text-content-secondary">
                      Khớp 100% lịch học Tối Thứ 3 &amp; Thứ 6 · Học phí
                      250k/buổi
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-linear text-white flex items-center justify-center shrink-0"></span>
                </div>

                {/* White Floating Card 2 */}
                <div className="rounded-2xl bg-surface-card/95 text-brand-950 p-4 sm:p-5 shadow-md flex items-center justify-between gap-4 sm:ml-6">
                  <div className="space-y-1">
                    <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold">
                      Lộ trình cá nhân hóa
                    </span>
                    <p className="text-sm sm:text-base font-bold">
                      Tạo giáo án 12 tuần ôn thi vào lớp 10 Chuyên
                    </p>
                    <p className="text-xs text-content-secondary">
                      Tự động phân bổ 24 chuyên đề Đại số &amp; Hình học phẳng
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Workday 44px Two-Tone Statement + Pill Button with Circle Badge */}
            <div className="lg:col-span-6 space-y-8 text-left">
              <p className="text-2xl sm:text-4xl lg:text-[44px] lg:leading-12 font-bold tracking-tight">
                <span className="text-white">Gặp gỡ TutorMatch AI. </span>
                <span className="text-white/65">
                  Trợ lý giáo dục thông minh giúp phân tích nhu cầu tự nhiên, tự
                  động hóa lịch học và đồng hành cùng sự tiến bộ mỗi ngày.
                </span>
              </p>

              <div>
                <Link
                  href="#ai-concierge"
                  className="inline-flex items-center gap-3 rounded-full bg-white text-brand hover:bg-gray-100 pl-6 pr-2 py-2 text-base font-semibold shadow-md transition-all"
                >
                  <span>Thử Trợ lý AI ngay</span>
                  <span className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 5: WORKDAY CUSTOMER ROI EXPANDABLE 3-CARD BENTO
          ("Our customers are turning AI into ROI.")
      ===================================================================== */}
      <section
        id="testimonials"
        className="max-w-381.5 mx-auto px-4 sm:px-8 py-20 lg:py-28"
      >
        {/* Split Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] lg:leading-15 font-bold tracking-tight text-brand-950 max-w-2xl">
            Học viên &amp; Phụ huynh biến mục tiêu thành kết quả bứt phá.
          </h2>
        </div>

        {/* 3-Card Expandable Horizontal Bento */}
        <div className="flex flex-col lg:flex-row gap-5 mt-12 lg:mt-16 lg:h-150">
          {CUSTOMER_STORIES.map((story, idx) => {
            const isExpanded = idx === activeStoryIndex;
            return (
              <div
                key={story.id}
                onClick={() => setActiveStoryIndex(idx)}
                className={`relative rounded-[36px] overflow-hidden transition-all duration-500 flex flex-col justify-between p-4 sm:p-6 ${
                  isExpanded
                    ? "lg:flex-[3.2] min-h-125 bg-brand text-white shadow-xl"
                    : "lg:flex-1 min-h-50 bg-brand text-white cursor-pointer hover:opacity-95 shadow-md"
                }`}
              >
                <div className="absolute inset-0">
                  <Image
                    src={story.image}
                    alt={story.badge}
                    rounded="none"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className={`absolute inset-0 transition-opacity ${
                    isExpanded
                      ? "bg-linear-to-t from-brand-800/95 via-brand-800/65 to-brand-800/35"
                      : "bg-brand-800/65 hover:bg-brand-800/55"
                  }`}
                />

                {/* Top Pill Badge */}
                <div className="relative z-2 flex items-center justify-between gap-2">
                  {!isExpanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStoryIndex(idx);
                      }}
                      aria-label={`Mở rộng câu chuyện ${story.badge}`}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-brand-950 transition-colors cursor-pointer"
                    >
                      <Plus className="w-8 h-8" />
                    </button>
                  )}
                </div>

                {/* Expanded Quote + Dashed ROI Metric Row vs Collapsed Prompt */}
                {isExpanded ? (
                  <div className="relative z-10 space-y-8 mt-auto pt-12">
                    <div className="space-y-4 max-w-2xl">
                      <blockquote className="text-lg sm:text-2xl leading-snug font-semibold text-white">
                        {story.quote}
                      </blockquote>
                      <div>
                        <p className="text-xl font-bold text-white">
                          {story.author}
                        </p>
                        <p className="text-base text-white/75">{story.role}</p>
                      </div>
                    </div>

                    {/* Workday Dashed Top Border Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 border-t border-dashed border-white/35">
                      {story.metrics.map((m) => (
                        <div key={m.value} className="space-y-1">
                          <p className="text-2xl sm:text-4xl sm:leading-9 font-semibold text-white tracking-tight">
                            {m.value}
                          </p>
                          <p className="text-xs sm:text-base text-white/80">
                            {m.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 mt-auto pt-8">
                    <p className="text-base font-bold text-white line-clamp-2">
                      {story.author}
                    </p>
                    <p className="text-xs text-white/75 mt-1 line-clamp-1">
                      Nhấn để xem kết quả học tập
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          SECTION 6: WORKDAY STICKY-STACKED PLATFORM CARDS
          ("One platform. Limitless possibilities.")
      ===================================================================== */}
      <section
        id="solutions"
        className="max-w-381.5 mx-auto px-4 sm:px-8 py-16 lg:py-24"
      >
        <div className="max-w-3xl mx-auto text-center mb-14 lg:mb-20">
          <h2 className="text-3xl sm:text-5xl lg:text-[56px] lg:leading-15 font-bold tracking-tight text-brand-950">
            Một nền tảng. Muôn vàn cơ hội bứt phá.
          </h2>
        </div>

        <div className="space-y-10 lg:space-y-14">
          {/* -----------------------------------------------------------------
              STACK CARD 1: 4-STEP WORKFLOW & INTERACTIVE HOMEWORK DASHBOARD
          ----------------------------------------------------------------- */}
          <div
            id="workflow"
            className="lg:sticky lg:top-24 z-10 rounded-[36px] bg-surface-card border border-border-default p-6 sm:p-10 lg:p-14 shadow-lg"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left (7 cols): Interactive Homework & Progress Dashboard */}
              <div className="lg:col-span-7 rounded-3xl bg-surface-subtle border border-border-default p-5 sm:p-7 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-base font-bold uppercase tracking-wider text-brand">
                      Bảng điều khiển Học tập 1-1
                    </span>
                    <h4 className="text-lg font-bold text-brand-950">
                      Tiến độ tuần &amp; Quản lý Bài tập về nhà
                    </h4>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-bold self-start sm:self-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +24% Giờ tự học
                  </span>
                </div>

                {/* Mini Weekly Activity Bar Chart */}
                <div className="grid grid-cols-7 gap-2 items-end h-24 pt-2 px-2 bg-surface-card rounded-2xl border border-border-default p-3">
                  {[
                    { day: "T2", h: "h-10", active: false },
                    { day: "T3", h: "h-16", active: true },
                    { day: "T4", h: "h-8", active: false },
                    { day: "T5", h: "h-14", active: false },
                    { day: "T6", h: "h-20", active: true },
                    { day: "T7", h: "h-12", active: false },
                    { day: "CN", h: "h-6", active: false },
                  ].map((bar) => (
                    <div
                      key={bar.day}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div
                        className={`w-full max-w-7 rounded-t-lg transition-all ${bar.h} ${
                          bar.active ? "bg-brand" : "bg-brand-100"
                        }`}
                      />
                      <span className="text-xs font-bold text-content-secondary">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Interactive Homework Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {HOMEWORK_TABS.map((tab) => {
                    const active = tab === activeHomeworkTab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveHomeworkTab(tab)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? "bg-brand text-white"
                            : "bg-surface-card text-content-secondary hover:text-brand-950 border border-border-default"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Homework Cards */}
                <div className="space-y-2.5">
                  {HOMEWORK_ITEMS[activeHomeworkTab].map((hw) => (
                    <div
                      key={hw.title}
                      className="rounded-2xl bg-surface-card border border-border-default p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-brand-950">
                          {hw.title}
                        </p>
                        <p className="text-xs text-content-secondary">
                          {hw.subject}
                        </p>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                        <span className="rounded-full bg-brand-50 text-brand px-2.5 py-0.5 text-xs font-bold">
                          {hw.due}
                        </span>
                        <span className="text-xs text-content-secondary">
                          {hw.progress}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right (5 cols): 4-Step Standardized Journey */}
              <div className="lg:col-span-5 space-y-6">
                <h3 className="text-2xl sm:text-4xl sm:leading-9 font-bold text-brand">
                  Từ lúc gửi yêu cầu đến buổi học đầu tiên chỉ trong 24 giờ.
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      step: "01",
                      title: "Mô tả nhu cầu bằng ngôn ngữ tự nhiên",
                      desc: "Nhập môn học, lớp, khu vực và học phí mong muốn vào thanh Trợ lý AI.",
                    },
                    {
                      step: "02",
                      title: "Nhận danh sách Gia sư khớp 99%",
                      desc: "Xem ngay hồ sơ, bằng cấp đã xác thực và đánh giá thực tế từ phụ huynh trước.",
                    },
                    {
                      step: "03",
                      title: "Học thử & Thống nhất lộ trình",
                      desc: "Kiểm tra năng lực đầu vào miễn phí và nhận kế hoạch học tập theo từng tuần.",
                    },
                    {
                      step: "04",
                      title: "Theo dõi bài tập & Báo cáo điểm số",
                      desc: "Cập nhật tiến độ trực tiếp trên bảng điều khiển sau mỗi buổi học.",
                    },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3.5">
                      <span className="w-8 h-8 rounded-full bg-linear text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <div>
                        <p className="text-base font-bold text-brand">
                          {s.title}
                        </p>
                        <p className="text-xs sm:text-sm text-content-secondary mt-0.5">
                          {s.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              STACK CARD 2: COMPREHENSIVE SUBJECT & GRADE SOLUTIONS
          ----------------------------------------------------------------- */}
          <div className="lg:sticky lg:top-28 z-20 rounded-[36px] bg-surface-card border border-border-default p-6 sm:p-10 lg:p-14 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left (7 cols): 2x2 Education Level Bento */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROGRAM_LEVELS.map((prog) => (
                  <div
                    key={prog.level}
                    className="rounded-3xl bg-surface-subtle border border-border-default p-5 space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <BookOpen className="w-5 h-5 text-brand" />
                        <span className="rounded-full bg-brand-50 text-brand px-2.5 py-0.5 text-xs font-bold">
                          {prog.tutors}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-brand-950">
                        {prog.level}
                      </h4>
                      <p className="text-xs text-content-secondary leading-relaxed">
                        {prog.focus}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {prog.subjects.map((subj) => (
                        <span
                          key={subj}
                          className="rounded-full bg-surface-card border border-border-default px-2.5 py-1 text-[11px] font-semibold text-brand-950"
                        >
                          {subj}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right (5 cols): Editorial Copy */}
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-block rounded-full bg-brand-50 text-brand px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                  CHƯƠNG TRÌNH ĐÀO TẠO TOÀN DIỆN
                </span>

                <h3 className="text-2xl sm:text-[32px] sm:leading-9 font-bold text-brand-950">
                  Giải pháp học tập chuyên sâu cho mọi cấp học và kỳ thi.
                </h3>

                <p className="text-base leading-6 text-content-secondary">
                  Từ học sinh tiểu học cần xây dựng thói quen tự giác, đến học
                  sinh cuối cấp ôn thi trường Chuyên và chứng chỉ IELTS/SAT quốc
                  tế — TutorMatch đều có đội ngũ chuyên gia đồng hành.
                </p>

                <div>
                  <Link
                    href="/tutors"
                    className="inline-flex items-center gap-2 rounded-full bg-gray-900/8 hover:bg-gray-900/14 text-brand-950 font-bold text-sm px-6 py-3 transition-colors"
                  >
                    <span>Khám phá tất cả môn học</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              STACK CARD 3: FLEXIBLE 1-ON-1 LEARNING MODES (ONLINE / HOME / HYBRID)
          ----------------------------------------------------------------- */}
          <div className="lg:sticky lg:top-32 z-30 rounded-[36px] bg-surface-card border border-border-default p-6 sm:p-10 lg:p-14 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* Left (7 cols): Interactive Learning Mode Selector */}
              <div className="lg:col-span-7 rounded-3xl bg-brand-950 text-white p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
                    <Video className="w-4 h-4 text-amber-300" />
                    <span>Mô hình học tập linh hoạt</span>
                  </div>
                  <div className="inline-flex rounded-full bg-white/10 p-1 gap-1">
                    {[
                      { id: "home" as const, label: "Tại nhà 1-1" },
                      { id: "online" as const, label: "Trực tuyến HD" },
                      { id: "hybrid" as const, label: "Kết hợp Hybrid" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedLearningMode(m.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          selectedLearningMode === m.id
                            ? "bg-white text-brand-950"
                            : "text-white/75 hover:text-white"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 border border-white/15 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">
                      {selectedLearningMode === "home" &&
                        "Gia sư dạy kèm trực tiếp tại nhà riêng"}
                      {selectedLearningMode === "online" &&
                        "Lớp học trực tuyến tương tác bảng viết hai chiều"}
                      {selectedLearningMode === "hybrid" &&
                        "Linh hoạt kết hợp học tại nhà và trực tuyến"}
                    </h4>
                    <span className="rounded-full bg-emerald-400/20 text-emerald-200 px-3 py-1 text-xs font-bold">
                      Học thử miễn phí
                    </span>
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">
                    {selectedLearningMode === "home" &&
                      "Gia sư đã xác thực lý lịch đến tận nhà hướng dẫn 1-1, rèn luyện tư thế ngồi học và phương pháp ghi chép khoa học."}
                    {selectedLearningMode === "online" &&
                      "Kết nối với các Thủ khoa và Giáo viên giỏi trên toàn quốc không giới hạn khoảng cách địa lý, tiết kiệm 100% thời gian di chuyển."}
                    {selectedLearningMode === "hybrid" &&
                      "Học trực tiếp vào cuối tuần và bổ trợ giải đáp bài tập trực tuyến trong tuần trước các kỳ thi quan trọng."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xl font-bold text-white">150k+</p>
                    <p className="text-[11px] text-white/70">
                      Học phí khởi điểm/buổi
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xl font-bold text-white">100%</p>
                    <p className="text-[11px] text-white/70">
                      Đổi gia sư miễn phí
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
                    <p className="text-xl font-bold text-white">24/7</p>
                    <p className="text-[11px] text-white/70">
                      Cố vấn học tập hỗ trợ
                    </p>
                  </div>
                </div>
              </div>

              {/* Right (5 cols): Editorial Copy */}
              <div className="lg:col-span-5 space-y-6">
                <span className="inline-block rounded-full bg-brand-50 text-brand px-3.5 py-1 text-xs font-bold uppercase tracking-wider">
                  TỐI ƯU CHO MỌI GIA ĐÌNH
                </span>

                <h3 className="text-2xl sm:text-[32px] sm:leading-9 font-bold text-brand-950">
                  Gói học kèm 1-1 thiết kế riêng cho từng mục tiêu &amp; ngân
                  sách.
                </h3>

                <p className="text-base leading-6 text-content-secondary">
                  Dù bạn muốn học trực tiếp tại nhà ở Hà Nội, TP.HCM, Đà Nẵng
                  hay học trực tuyến cùng gia sư trường top đầu, TutorMatch luôn
                  đảm bảo quyền lợi tối đa cho phụ huynh.
                </p>

                <div>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-gray-900/8 hover:bg-gray-900/14 text-brand-950 font-bold text-sm px-6 py-3 transition-colors"
                  >
                    <span>Tạo tài khoản Học viên</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 7: WORKDAY FULL-BLEED DISCOVERY CTA BANNER
          ("Discover what Workday can do for you.")
      ===================================================================== */}
      <section id="contact" className="px-3 sm:px-6 pb-8 pt-4">
        <div className="relative max-w-[1776px] mx-auto min-h-125 lg:min-h-145 rounded-[36px] overflow-hidden flex items-center justify-center text-center px-6 py-20 shadow-xl">
          <div className="absolute inset-0">
            <Image
              src={section1Img.src}
              alt="Khám phá nền tảng kết nối gia sư TutorMatch"
              rounded="none"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-brand/40" />

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl sm:text-5xl lg:text-[68px] lg:leading-18 font-bold tracking-tight text-white">
              Khám phá điều TutorMatch có thể mang lại cho bạn.
            </h2>

            <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto">
              Bắt đầu hành trình chinh phục điểm số cao hơn và niềm yêu thích
              học tập mỗi ngày cùng đội ngũ gia sư 1-1 tận tâm nhất.
            </p>

            {/* Dual Workday Pill CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-3 rounded-full bg-white text-brand-950 hover:bg-gray-100 pl-6 pr-2 py-2 text-sm font-bold shadow-lg transition-all"
              >
                <span>Đăng ký ngay</span>
                <span className="w-9 h-9 rounded-full bg-brand text-white flex items-center justify-center">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>

              <Link
                href="/tutors"
                className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/25 text-white px-7 py-3.5 text-sm font-bold transition-all"
              >
                <span>Tìm gia sư phù hợp</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
