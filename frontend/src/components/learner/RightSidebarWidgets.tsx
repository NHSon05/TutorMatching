"use client";

import * as React from "react";
import type { RightSidebarWidgetsProps } from "./types";


export function RightSidebarWidgets({
  calendar,
  homework,
}: RightSidebarWidgetsProps) {
  const [selectedDate, setSelectedDate] = React.useState(9);

  return (
    <div className="space-y-6">
      {/* 1. Mini Calendar & Community Growth Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-2xs space-y-5">
        {/* Month Header with < > Controls */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Tháng trước"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ‹
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight">
            {calendar.month}
          </span>
          <button
            type="button"
            aria-label="Tháng sau"
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ›
          </button>
        </div>

        {/* Days Row */}
        <div className="grid grid-cols-5 gap-2 text-center">
          {calendar.days.map((item) => {
            const isSelected = selectedDate === item.date;

            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setSelectedDate(item.date)}
                className={`py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6b66e5] text-white shadow-md scale-105"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span
                  className={`text-[11px] font-medium ${
                    isSelected ? "text-indigo-100" : "text-gray-400"
                  }`}
                >
                  {item.day}
                </span>
                <span className="text-base font-bold mt-0.5">
                  {item.date < 10 ? `0${item.date}` : item.date}
                </span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          {/* Community Growth Section */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                Community growth
              </h4>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span>↗</span>
                <span>{calendar.communityGrowth.growthText}</span>
              </p>
            </div>

            {/* Circular Donut Progress Chart */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Track */}
                <path
                  className="text-gray-100 dark:text-gray-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Active Colored Arc */}
                <path
                  className="text-[#6b66e5]"
                  strokeDasharray={`${calendar.communityGrowth.percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[11px] font-extrabold text-gray-800 dark:text-gray-200">
                {calendar.communityGrowth.percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Homework Progress Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-2xs space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
            Homework progress
          </h4>
          <button
            type="button"
            aria-label="Tùy chọn bài tập"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
          >
            ⋮
          </button>
        </div>

        {/* Homework List */}
        <div className="space-y-4">
          {homework.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100/80 dark:border-gray-800 space-y-2 hover:bg-gray-50 transition-colors"
            >
              {/* Title & Arrow */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {item.title}
                </span>
                <span className="text-gray-400 hover:text-brand text-xs font-bold transition-colors">
                  ↗
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
                {item.description}
              </p>

              {/* 3-Segment Progress Bar */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 flex items-center gap-1.5">
                  {item.segments.map((active, segIdx) => (
                    <div
                      key={segIdx}
                      className={`h-1.5 rounded-full flex-1 transition-all ${
                        active
                          ? "bg-[#6b66e5]"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 min-w-7 text-right">
                  {item.percent}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RightSidebarWidgets;
