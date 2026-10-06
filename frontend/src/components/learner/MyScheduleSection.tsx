"use client";

import * as React from "react";
import type { ScheduleItem } from "@/data/mockLearnerDashboard";

interface MyScheduleSectionProps {
  days: Array<"Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat">;
  times: Array<"08:00" | "07:00" | "10:00" | "12:00">;
  items: ScheduleItem[];
}

const colorMap = {
  yellow: {
    container: "bg-[#fef9c3] text-[#854d0e] border-[#fef08a]",
  },
  blue: {
    container: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
  },
  green: {
    container: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
  },
  pink: {
    container: "bg-[#ffe4e6] text-[#9f1239] border-[#fecdd3]",
  },
};

export function MyScheduleSection({
  days,
  times,
  items,
}: MyScheduleSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          My Schedule
        </h3>
      </div>

      {/* Timetable Table Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-2xs overflow-x-auto">
        <div className="min-w-[580px]">
          {/* Day Headers Row */}
          <div className="grid grid-cols-8 gap-2 pb-3 border-b border-gray-100 dark:border-gray-800 text-xs font-medium text-gray-400 dark:text-gray-500 text-center">
            <div className="text-left font-semibold text-gray-300 dark:text-gray-600">
              Time
            </div>
            {days.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
            {times.map((time) => {
              // Find schedule item matching this time
              const rowItem = items.find((item) => item.time === time);

              return (
                <div
                  key={time}
                  className="grid grid-cols-8 gap-2 py-3 items-center min-h-[44px]"
                >
                  {/* Time column */}
                  <div className="text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {time}
                  </div>

                  {/* 7 Days Columns */}
                  <div className="col-span-7 grid grid-cols-7 gap-2 relative">
                    {/* Render schedule block if matches */}
                    {rowItem && (
                      <div
                        className={`col-span-3 sm:col-span-2 py-1.5 px-3 rounded-lg border text-[11px] font-semibold truncate shadow-3xs cursor-pointer transition-transform hover:scale-[1.02] ${
                          rowItem.day === "Sun"
                            ? "col-start-1 col-span-3"
                            : rowItem.day === "Wed"
                            ? "col-start-4 col-span-2"
                            : rowItem.day === "Tue"
                            ? "col-start-2 col-span-2"
                            : "col-start-5 col-span-2"
                        } ${colorMap[rowItem.color].container}`}
                        title={`${rowItem.title} (${rowItem.day} ${rowItem.time})`}
                      >
                        {rowItem.title}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyScheduleSection;
