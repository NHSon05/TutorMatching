import * as React from "react";

export interface ScheduleEvent {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: CN, 1: T2, ..., 6: T7
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  title: string;
  subtitle?: string;
  status?: "confirmed" | "pending" | "completed";
}

export interface EventCalendarProps {
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  startHour?: number;
  endHour?: number;
  className?: string;
}

const DAYS = [
  { key: 1, label: "Thứ 2" },
  { key: 2, label: "Thứ 3" },
  { key: 3, label: "Thứ 4" },
  { key: 4, label: "Thứ 5" },
  { key: 5, label: "Thứ 6" },
  { key: 6, label: "Thứ 7" },
  { key: 0, label: "Chủ nhật" },
];

const statusStyles = {
  confirmed: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100",
  pending: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100",
  completed: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100",
};

export function EventCalendar({
  events,
  onEventClick,
  startHour = 7,
  endHour = 22,
  className = "",
}: EventCalendarProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);

  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 border-b border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40">
            <div className="p-3 text-xs font-semibold text-gray-400 text-center border-r border-gray-200 dark:border-gray-800">
              Giờ
            </div>
            {DAYS.map((d) => (
              <div
                key={d.key}
                className="p-3 text-xs font-bold text-gray-900 dark:text-gray-100 text-center border-r last:border-r-0 border-gray-200 dark:border-gray-800"
              >
                {d.label}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 min-h-[52px]">
                {/* Hour label */}
                <div className="p-2 text-[11px] font-medium text-gray-400 text-center border-r border-gray-100 dark:border-gray-800 select-none">
                  {String(hour).padStart(2, "0")}:00
                </div>

                {/* 7 Days Columns */}
                {DAYS.map((d) => {
                  const cellEvents = events.filter((e) => {
                    if (e.dayOfWeek !== d.key) return false;
                    const eventStartH = parseInt(e.startTime.split(":")[0], 10);
                    return eventStartH === hour;
                  });

                  return (
                    <div
                      key={d.key}
                      className="p-1 border-r last:border-r-0 border-gray-100 dark:border-gray-800/60 relative"
                    >
                      {cellEvents.map((ev) => {
                        const statusClass =
                          statusStyles[ev.status || "confirmed"] || statusStyles.confirmed;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => onEventClick?.(ev)}
                            className={`p-1.5 rounded-lg border text-xs shadow-2xs cursor-pointer transition-all hover:scale-[1.02] ${statusClass}`}
                          >
                            <div className="font-bold truncate text-[11px]">
                              {ev.title}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {ev.startTime} - {ev.endTime}
                            </div>
                            {ev.subtitle && (
                              <div className="text-[10px] opacity-70 truncate mt-0.5">
                                {ev.subtitle}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCalendar;
