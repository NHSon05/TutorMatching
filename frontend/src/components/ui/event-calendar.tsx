import * as React from "react";

export interface ScheduleEvent {
  id: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0: CN, 1: T2, ..., 6: T7
  startTime: string; // "18:00"
  endTime: string; // "20:00"
  title: string;
  subtitle?: string;
  /**
   * Visual state. "available" renders as a background band (e.g. a tutor's
   * free time) underneath the other events of the same day.
   */
  status?: "confirmed" | "pending" | "completed" | "available";
}

export interface EventCalendarProps {
  events: ScheduleEvent[];
  onEventClick?: (event: ScheduleEvent) => void;
  /**
   * Makes empty hour cells actionable (e.g. "add free time here"). Receives
   * the calendar day (0 = Chủ nhật) and the cell's hour.
   */
  onSlotClick?: (dayOfWeek: ScheduleEvent["dayOfWeek"], hour: number) => void;
  /** Accessible verb for empty cells, e.g. "Thêm lịch rảnh". */
  slotActionLabel?: string;
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
] as const;

/** Height of one hour row in px; events are positioned against it. */
const ROW_HEIGHT = 52;

const statusStyles = {
  confirmed:
    "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100",
  pending:
    "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-100",
  completed:
    "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100",
  available:
    "bg-status-success-bg/80 border-dashed border-status-success/50 text-status-success-dark",
};

const toMinutes = (time: string) => {
  const [h = "0", m = "0"] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const pad = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

export function EventCalendar({
  events,
  onEventClick,
  onSlotClick,
  slotActionLabel = "Chọn",
  startHour = 7,
  endHour = 22,
  className = "",
}: EventCalendarProps) {
  const hours = Array.from(
    { length: endHour - startHour + 1 },
    (_, i) => startHour + i
  );
  const gridEnd = (endHour + 1) * 60;
  // Each event is drawn once, in the cell of its (visible) start hour, and
  // stretched over its full duration.
  const anchorHour = (e: ScheduleEvent) =>
    Math.min(
      Math.max(Math.floor(toMinutes(e.startTime) / 60), startHour),
      endHour
    );

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
          <div>
            {hours.map((hour) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b last:border-b-0 border-gray-100 dark:border-gray-800/60"
                style={{ height: ROW_HEIGHT }}
              >
                {/* Hour label */}
                <div className="p-2 text-[11px] font-medium text-gray-400 text-center border-r border-gray-100 dark:border-gray-800 select-none">
                  {pad(hour)}
                </div>

                {/* 7 Days Columns */}
                {DAYS.map((d) => {
                  const cellEvents = events.filter(
                    (e) => e.dayOfWeek === d.key && anchorHour(e) === hour
                  );

                  return (
                    <div
                      key={d.key}
                      className="border-r last:border-r-0 border-gray-100 dark:border-gray-800/60 relative"
                    >
                      {onSlotClick && (
                        <button
                          type="button"
                          aria-label={`${slotActionLabel} ${d.label} ${pad(hour)}`}
                          onClick={() => onSlotClick(d.key, hour)}
                          className="absolute inset-0 z-0 cursor-pointer transition-colors hover:bg-brand-50/60 focus-visible:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand"
                        />
                      )}
                      {cellEvents.map((ev) => {
                        const start = Math.max(
                          toMinutes(ev.startTime),
                          startHour * 60
                        );
                        const end = Math.min(toMinutes(ev.endTime), gridEnd);
                        const top = ((start % 60) / 60) * ROW_HEIGHT;
                        const height = Math.max(
                          ((end - start) / 60) * ROW_HEIGHT - 3,
                          18
                        );
                        const isBackground = ev.status === "available";
                        const statusClass =
                          statusStyles[ev.status || "confirmed"] ||
                          statusStyles.confirmed;
                        const interactive = Boolean(onEventClick);

                        return (
                          <div
                            key={ev.id}
                            role={interactive ? "button" : undefined}
                            tabIndex={interactive ? 0 : undefined}
                            aria-label={
                              interactive
                                ? `${ev.title}, ${d.label} ${ev.startTime}–${ev.endTime}${ev.subtitle ? `, ${ev.subtitle}` : ""}`
                                : undefined
                            }
                            onClick={() => onEventClick?.(ev)}
                            onKeyDown={(event) => {
                              if (
                                interactive &&
                                (event.key === "Enter" || event.key === " ")
                              ) {
                                event.preventDefault();
                                onEventClick?.(ev);
                              }
                            }}
                            style={{ top: top + 1, height }}
                            className={`absolute overflow-hidden rounded-lg border text-xs shadow-2xs transition-shadow ${
                              isBackground
                                ? "left-0.5 right-0.5 z-[1] p-1"
                                : "left-2 right-0.5 z-10 p-1.5"
                            } ${interactive ? "cursor-pointer hover:shadow-md focus-visible:outline-2 focus-visible:outline-brand" : ""} ${statusClass}`}
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
