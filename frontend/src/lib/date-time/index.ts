const vietnamDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar date (YYYY-MM-DD) in Vietnam, independent of the browser timezone. */
export function getVietnamDate(date: Date = new Date()): string {
  return vietnamDateFormatter.format(date);
}

/** Sort weekly slots by day and HH:mm start time without mutating the input. */
export function sortWeeklySchedules<
  T extends { dayOfWeek: number; startTime: string },
>(schedules: readonly T[]): T[] {
  return [...schedules].sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)
  );
}
