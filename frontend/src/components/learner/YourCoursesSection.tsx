"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { YourCoursesSectionProps } from "./types";

// ============================================================================
// SVG ICONS
// ============================================================================

function DocumentIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

// 3D Graduation Cap & Books illustration for card header
function GraduationBannerIllustration({
  theme,
}: {
  theme: "purple" | "amber" | "rose";
}) {
  const bgGradient =
    theme === "purple"
      ? "from-[#8b5cf6] to-[#a78bfa]"
      : theme === "amber"
      ? "from-[#f59e0b] to-[#fbbf24]"
      : "from-[#f43f5e] to-[#fb7185]";

  return (
    <div
      className={`w-full h-28 rounded-t-2xl bg-gradient-to-br ${bgGradient} relative overflow-hidden flex items-center justify-center p-2`}
    >
      {/* Background ambient ring */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-3xs" />

      {/* 3D Mortarboard Cap and Books Graphic */}
      <svg
        viewBox="0 0 160 100"
        className="w-32 h-24 drop-shadow-md relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Soft Shadow */}
        <ellipse cx="80" cy="85" rx="45" ry="8" fill="#000000" fillOpacity="0.18" />

        {/* Books Base */}
        <rect x="42" y="66" width="76" height="12" rx="3" fill="#f8fafc" />
        <rect x="40" y="62" width="80" height="7" rx="2" fill="#e2e8f0" />
        <rect x="45" y="75" width="70" height="9" rx="2" fill="#cbd5e1" />

        {/* Graduation Cap Skull cap */}
        <path
          d="M60 48 C60 48 65 62 80 62 C95 62 100 48 100 48 Z"
          fill="#1e1b4b"
        />

        {/* Graduation Cap Flat Diamond Top (3D Tilt) */}
        <path
          d="M80 24 L125 38 L80 50 L35 38 Z"
          fill="#312e81"
        />
        <path
          d="M80 26 L121 38 L80 48 L39 38 Z"
          fill="#4338ca"
        />

        {/* Cap Center Button */}
        <ellipse cx="80" cy="38" rx="4" ry="2.5" fill="#fef08a" />

        {/* Tassel Ribbon */}
        <path
          d="M80 38 Q100 45 106 58"
          stroke="#fde047"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="106" cy="60" r="3" fill="#eab308" />
      </svg>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function YourCoursesSection({ courses, className = "" }: YourCoursesSectionProps) {
  return (
    <div className={`space-y-4 ${className}`.trim()}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Your Courses
        </h3>
        <Link
          href="/learner/my-tutors"
          className="text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-brand transition-colors"
        >
          VIEW ALL
        </Link>
      </div>

      {/* 3 Courses Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {courses.map((course) => {
          // Color styles by theme
          const priceColor =
            course.themeColor === "purple"
              ? "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
              : course.themeColor === "amber"
              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";

          const progressColor =
            course.themeColor === "purple"
              ? "bg-purple-600"
              : course.themeColor === "amber"
              ? "bg-amber-500"
              : "bg-rose-500";

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xs hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Top 3D Graduation Banner */}
              <GraduationBannerIllustration theme={course.themeColor} />

              {/* Card Body */}
              <div className="p-4 pt-3 flex-1 flex flex-col space-y-3">
                {/* Tutor Info Row */}
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-xs">
                    <Image
                      src={course.avatar}
                      alt={course.tutorName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {course.tutorName}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mt-0.5 ${priceColor}`}
                    >
                      💲 {course.price}
                    </span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-gray-400 dark:text-gray-500 text-xs py-1 border-t border-gray-50 dark:border-gray-800/80">
                  <div className="flex items-center gap-1.5" title="Số bài học">
                    <DocumentIcon className="w-3.5 h-3.5" />
                    <span>{course.lessonsCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Số giờ đã học">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span>{course.hoursCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5" title="Học viên cùng lớp">
                    <UsersIcon className="w-3.5 h-3.5" />
                    <span>{course.studentsCount}</span>
                  </div>
                </div>

                {/* Progress Bar & Counter */}
                <div className="space-y-1.5 pt-1 mt-auto">
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${course.completedPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                    <span>Completed: {course.completedPercent}%</span>
                    <span>
                      {course.completedLessons}/{course.totalLessons}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default YourCoursesSection;
