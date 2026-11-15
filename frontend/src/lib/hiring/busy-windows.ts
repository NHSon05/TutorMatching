/**
 * A tutor's weekly windows already committed to ACCEPTED requests. Times are
 * zero-padded "HH:mm" in Asia/Ho_Chi_Minh, so string comparison orders them.
 * The server re-checks on submit; this only keeps the form honest.
 */
export interface WeeklyTimeWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** Touching edges (e.g. 18:00–19:00 and 19:00–20:00) do not overlap. */
export function overlaps(a: WeeklyTimeWindow, b: WeeklyTimeWindow): boolean {
  return (
    a.dayOfWeek === b.dayOfWeek &&
    a.startTime < b.endTime &&
    b.startTime < a.endTime
  );
}

export function overlapsBusy(
  window: WeeklyTimeWindow,
  busy: readonly WeeklyTimeWindow[]
): boolean {
  return busy.some((item) => overlaps(window, item));
}

/** Booked parts of an availability slot, clipped to the slot and sorted. */
export function busyInSlot(
  slot: WeeklyTimeWindow,
  busy: readonly WeeklyTimeWindow[]
): WeeklyTimeWindow[] {
  return busy
    .filter((item) => overlaps(slot, item))
    .map((item) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: item.startTime > slot.startTime ? item.startTime : slot.startTime,
      endTime: item.endTime < slot.endTime ? item.endTime : slot.endTime,
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Free sub-windows of a slot once its booked parts are removed. */
export function freeGaps(
  slot: WeeklyTimeWindow,
  busy: readonly WeeklyTimeWindow[]
): WeeklyTimeWindow[] {
  const gaps: WeeklyTimeWindow[] = [];
  let cursor = slot.startTime;
  for (const booked of busyInSlot(slot, busy)) {
    if (booked.startTime > cursor)
      gaps.push({ dayOfWeek: slot.dayOfWeek, startTime: cursor, endTime: booked.startTime });
    if (booked.endTime > cursor) cursor = booked.endTime;
  }
  if (cursor < slot.endTime)
    gaps.push({ dayOfWeek: slot.dayOfWeek, startTime: cursor, endTime: slot.endTime });
  return gaps;
}
