import * as React from "react";

export interface DatePickerProps {
  value?: Date | string;
  defaultValue?: Date | string;
  onChange?: (date: Date | null, dateString: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | boolean;
  disabled?: boolean;
  isFullWidth?: boolean;
  className?: string;
  id?: string;
}

function parseDate(val?: Date | string): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function DatePicker({
  value: controlledValue,
  defaultValue,
  onChange,
  minDate,
  maxDate,
  placeholder = "Chọn ngày (DD/MM/YYYY)...",
  label,
  helperText,
  error,
  disabled = false,
  isFullWidth = true,
  className = "",
  id,
}: DatePickerProps) {
  const isControlled = controlledValue !== undefined;
  const initialDate = parseDate(defaultValue);
  const [uncontrolledDate, setUncontrolledDate] = React.useState<Date | null>(initialDate);
  const selectedDate = isControlled ? parseDate(controlledValue) : uncontrolledDate;

  const [isOpen, setIsOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(selectedDate || new Date());

  const containerRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const inputId = id || generatedId;

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const nextDate = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (!isControlled) {
      setUncontrolledDate(nextDate);
    }
    onChange?.(nextDate, formatDate(nextDate));
    setIsOpen(false);
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === viewMonth.getFullYear() && today.getMonth() === viewMonth.getMonth();

  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? "w-full" : "w-64 inline-block"} ${className}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Input Trigger */}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between h-11 w-full rounded-xl bg-white dark:bg-gray-900 border px-3.5 transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 ${
          hasError
            ? "border-status-error focus:ring-status-error/30"
            : isOpen
            ? "border-gray-900 dark:border-white focus:ring-gray-900/10"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 focus:ring-gray-900/10 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""}`}
      >
        <span
          className={`text-sm truncate ${
            selectedDate ? "text-gray-900 dark:text-gray-100 font-medium" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>

        <svg className="w-4 h-4 text-gray-400 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl w-72 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header Tháng / Năm & Nút Chuyển */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              Tháng {viewMonth.getMonth() + 1}, {viewMonth.getFullYear()}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tiêu đề Thứ trong tuần */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {d}
              </span>
            ))}
          </div>

          {/* Lưới các Ngày */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const isSelected =
                selectedDate &&
                selectedDate.getFullYear() === viewMonth.getFullYear() &&
                selectedDate.getMonth() === viewMonth.getMonth() &&
                selectedDate.getDate() === day;
              const isToday = isCurrentMonthToday && today.getDate() === day;

              const isBeforeMin = minDate && dateObj < minDate;
              const isAfterMax = maxDate && dateObj > maxDate;
              const isDateDisabled = isBeforeMin || isAfterMax;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={Boolean(isDateDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto rounded-lg text-xs flex items-center justify-center transition-all duration-100 ${
                    isDateDisabled
                      ? "opacity-30 cursor-not-allowed"
                      : isSelected
                      ? "bg-brand text-white font-bold shadow-xs cursor-pointer"
                      : isToday
                      ? "border border-brand text-brand font-semibold hover:bg-brand/10 cursor-pointer"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="text-xs text-status-error font-medium mt-1">{errorMessage}</p>
      )}
      {helperText && !errorMessage && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

export default DatePicker;
