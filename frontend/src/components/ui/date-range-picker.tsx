import * as React from "react";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangePickerProps {
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (range: DateRange) => void;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  isFullWidth?: boolean;
  className?: string;
  id?: string;
}

function formatDate(d: Date | null): string {
  if (!d) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function DateRangePicker({
  value: controlledValue,
  defaultValue = { startDate: null, endDate: null },
  onChange,
  label,
  helperText,
  placeholder = "Từ ngày - Đến ngày...",
  disabled = false,
  isFullWidth = true,
  className = "",
  id,
}: DateRangePickerProps) {
  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<DateRange>(defaultValue);
  const currentRange = isControlled ? controlledValue : uncontrolledValue;

  const [isOpen, setIsOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(currentRange.startDate || new Date());
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const generatedId = React.useId();
  const pickerId = id || generatedId;

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

  const handleDayClick = (clickedDate: Date) => {
    if (!currentRange.startDate || (currentRange.startDate && currentRange.endDate)) {
      // Bắt đầu chọn khoảng mới
      const newRange: DateRange = { startDate: clickedDate, endDate: null };
      if (!isControlled) setUncontrolledValue(newRange);
      onChange?.(newRange);
    } else {
      // Đang có startDate, chọn endDate
      let start = currentRange.startDate;
      let end = clickedDate;
      if (end < start) {
        const temp = start;
        start = end;
        end = temp;
      }
      const newRange: DateRange = { startDate: start, endDate: end };
      if (!isControlled) setUncontrolledValue(newRange);
      onChange?.(newRange);
      setIsOpen(false);
    }
  };

  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();

  const formattedDisplayText = React.useMemo(() => {
    if (currentRange.startDate && currentRange.endDate) {
      return `${formatDate(currentRange.startDate)}  ➔  ${formatDate(currentRange.endDate)}`;
    }
    if (currentRange.startDate) {
      return `${formatDate(currentRange.startDate)}  ➔  ...`;
    }
    return placeholder;
  }, [currentRange, placeholder]);

  return (
    <div
      ref={containerRef}
      className={`relative ${isFullWidth ? "w-full" : "w-72 inline-block"} ${className}`}
    >
      {label && (
        <label
          htmlFor={pickerId}
          className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        id={pickerId}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between h-11 w-full rounded-xl bg-white dark:bg-gray-900 border px-3.5 transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 ${
          isOpen
            ? "border-gray-900 dark:border-white focus:ring-gray-900/10"
            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 focus:ring-gray-900/10 shadow-2xs"
        } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : ""}`}
      >
        <span
          className={`text-sm truncate ${
            currentRange.startDate
              ? "text-gray-900 dark:text-gray-100 font-medium"
              : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {formattedDisplayText}
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

          <div className="grid grid-cols-7 gap-0.5 text-center mb-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                {d}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateObj = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

              const isStart =
                currentRange.startDate &&
                currentRange.startDate.toDateString() === dateObj.toDateString();
              const isEnd =
                currentRange.endDate &&
                currentRange.endDate.toDateString() === dateObj.toDateString();

              const rangeEndToCompare = currentRange.endDate || hoverDate;
              const isInRange =
                currentRange.startDate &&
                rangeEndToCompare &&
                dateObj > currentRange.startDate &&
                dateObj < rangeEndToCompare;

              return (
                <div
                  key={day}
                  onMouseEnter={() => {
                    if (currentRange.startDate && !currentRange.endDate) {
                      setHoverDate(dateObj);
                    }
                  }}
                  className={`relative py-0.5 ${
                    isInRange ? "bg-brand/10 dark:bg-brand/20" : ""
                  } ${isStart ? "rounded-l-lg" : ""} ${isEnd ? "rounded-r-lg" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => handleDayClick(dateObj)}
                    className={`h-7 w-7 mx-auto rounded-lg text-xs flex items-center justify-center transition-all ${
                      isStart || isEnd
                        ? "bg-brand text-white font-bold shadow-xs"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{helperText}</p>
      )}
    </div>
  );
}

export default DateRangePicker;
