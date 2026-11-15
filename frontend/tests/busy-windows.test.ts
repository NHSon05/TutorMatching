import { describe, expect, it } from "vitest";
import {
  busyInSlot,
  freeGaps,
  overlapsBusy,
} from "@/lib/hiring/busy-windows";
import {
  createHireFormState,
  hireFormReducer,
} from "@/hooks/hire-request-form.reducer";
import type { PublicTutorDetail } from "@/lib/api/tutors";

const slot = { dayOfWeek: 1, startTime: "18:00", endTime: "21:00" };

describe("busy windows", () => {
  it("clips booked time to the slot and leaves touching edges free", () => {
    const busy = [
      { dayOfWeek: 1, startTime: "17:00", endTime: "18:30" },
      { dayOfWeek: 1, startTime: "19:30", endTime: "20:00" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "21:00" },
    ];
    expect(busyInSlot(slot, busy)).toEqual([
      { dayOfWeek: 1, startTime: "18:00", endTime: "18:30" },
      { dayOfWeek: 1, startTime: "19:30", endTime: "20:00" },
    ]);
    expect(freeGaps(slot, busy)).toEqual([
      { dayOfWeek: 1, startTime: "18:30", endTime: "19:30" },
      { dayOfWeek: 1, startTime: "20:00", endTime: "21:00" },
    ]);
    expect(overlapsBusy({ dayOfWeek: 1, startTime: "18:30", endTime: "19:30" }, busy)).toBe(false);
    expect(overlapsBusy({ dayOfWeek: 1, startTime: "19:00", endTime: "19:45" }, busy)).toBe(true);
  });

  it("reports no free gap when the slot is fully booked", () => {
    const busy = [
      { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" },
      { dayOfWeek: 1, startTime: "19:00", endTime: "21:00" },
    ];
    expect(freeGaps(slot, busy)).toEqual([]);
  });

  it("selects the first free part of a slot and refuses a fully booked slot", () => {
    const offer = {
      subjects: [{ subjectId: "math" }],
      teachingModes: ["ONLINE"],
      courses: [],
      availability: [
        { id: "a", ...slot },
        { id: "b", dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
      ],
      busyWindows: [
        { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
        { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" },
      ],
    } as unknown as PublicTutorDetail;
    let state = createHireFormState(offer);
    state = hireFormReducer(state, { type: "scheduleToggled", slotId: "a", checked: true });
    expect(state.values.windows.a).toEqual({ dayOfWeek: 1, startTime: "19:00", endTime: "21:00" });
    state = hireFormReducer(state, { type: "scheduleToggled", slotId: "b", checked: true });
    expect(state.values.windows.b).toBeUndefined();
  });
});
