import * as React from "react";

export interface CalendarEvent {
  id: string;
  date: Date | string;
  title: string;
  type?: "class" | "exam" | "deadline" | "holiday";
}

export interface CalendarProps {
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date) => void;
  events?: CalendarEvent[];
  className?: string;
}

const DAYS_OF_WEEK = ["CN", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

export function Calendar({
  month: controlledMonth,
  defaultMonth,
  onMonthChange,
  selectedDate: controlledSelectedDate,
  onDateSelect,
  events = [],
  className = "",
}: CalendarProps) {
  const [uncontrolledMonth, setUncontrolledMonth] = React.useState<Date>(
    defaultMonth || new Date()
  );
  const currentMonth = controlledMonth || uncontrolledMonth;

  const [uncontrolledSelected, setUncontrolledSelected] = React.useState<Date | null>(null);
  const activeSelected = controlledSelectedDate !== undefined ? controlledSelectedDate : uncontrolledSelected;

  const handlePrev = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (!controlledMonth) setUncontrolledMonth(next);
    onMonthChange?.(next);
  };

  const handleNext = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (!controlledMonth) setUncontrolledMonth(next);
    onMonthChange?.(next);
  };

  const handleToday = () => {
    const now = new Date();
    if (!controlledMonth) setUncontrolledMonth(now);
    onMonthChange?.(now);
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (controlledSelectedDate === undefined) setUncontrolledSelected(d);
    onDateSelect?.(d);
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentMonth.getFullYear() &&
    today.getMonth() === currentMonth.getMonth();

  // Helper check events on date
  const getEventsForDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => {
      const eDate = typeof e.date === "string" ? e.date : e.date.toISOString().slice(0, 10);
      return eDate === dateStr;
    });
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-2xs ${className}`}
    >
      {/* Header Month / Year controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">
            Tháng {currentMonth.getMonth() + 1}, {currentMonth.getFullYear()}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tổng cộng {events.length} sự kiện & ca học được lên lịch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-3 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
          >
            Hôm nay
          </button>

          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Tháng trước"
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Tháng sau"
              className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS_OF_WEEK.map((w) => (
          <div key={w} className="text-xs font-semibold text-gray-400 dark:text-gray-500 py-1">
            {w}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[75px]" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const isToday = isCurrentMonth && today.getDate() === day;
          const isSelected =
            activeSelected &&
            activeSelected.getFullYear() === currentMonth.getFullYear() &&
            activeSelected.getMonth() === currentMonth.getMonth() &&
            activeSelected.getDate() === day;

          return (
            <div
              key={day}
              onClick={() => handleSelectDay(day)}
              className={`min-h-[60px] sm:min-h-[75px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-brand bg-brand/5 ring-2 ring-brand/20"
                  : isToday
                  ? "border-brand/40 bg-blue-50/20 dark:bg-blue-950/20"
                  : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isToday
                    ? "bg-brand text-white font-bold"
                    : "text-gray-800 dark:text-gray-200"
                }`}
              >
                {day}
              </span>

              {/* Event Dots / Badges */}
              {dayEvents.length > 0 && (
                <div className="space-y-0.5 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[10px] px-1 py-0.5 rounded font-medium truncate bg-brand/10 text-brand"
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-gray-400 font-medium pl-1">
                      +{dayEvents.length - 2} ca nữa
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
