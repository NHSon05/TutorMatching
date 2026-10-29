import { describe, expect, it } from "vitest";
import {
  createHireFormState,
  hireFormReducer,
} from "@/hooks/hire-request-form.reducer";
import type { PublicTutorDetail } from "@/lib/api/tutors";

const offer = {
  subjects: [{ subjectId: "math" }],
  teachingModes: ["ONLINE"],
  courses: [],
  availability: [
    { id: "a", dayOfWeek: 1, startTime: "18:00", endTime: "20:00" },
    { id: "b", dayOfWeek: 2, startTime: "18:00", endTime: "20:00" },
  ],
} as unknown as PublicTutorDetail;

describe("hire form rules", () => {
  it("resets dependent course and district while preserving other input", () => {
    const initial = createHireFormState(offer);
    const state = {
      ...initial,
      values: {
        ...initial.values,
        course: "old-course",
        district: "old-district",
        note: "Keep",
      },
    };
    const changedSubject = hireFormReducer(state, {
      type: "subjectChanged",
      subjectId: "english",
    });
    expect(changedSubject.values).toMatchObject({
      subject: "english",
      course: "",
      district: "old-district",
      note: "Keep",
    });
    const changedProvince = hireFormReducer(changedSubject, {
      type: "provinceChanged",
      provinceCode: "02",
    });
    expect(changedProvince.values).toMatchObject({
      province: "02",
      district: "",
      note: "Keep",
    });
    expect(state.values.course).toBe("old-course");
  });

  it("edits one schedule without mutating or removing the others", () => {
    let state = createHireFormState(offer);
    for (const slotId of ["a", "b"])
      state = hireFormReducer(state, {
        type: "scheduleToggled",
        slotId,
        checked: true,
      });
    const changed = hireFormReducer(state, {
      type: "scheduleTimeChanged",
      slotId: "a",
      field: "startTime",
      value: "19:00",
    });
    expect(changed.values.windows.a.startTime).toBe("19:00");
    expect(changed.values.windows.b).toEqual(state.values.windows.b);
    expect(state.values.windows.a.startTime).toBe("18:00");
  });

  it("requires reselection when a refreshed slot changes day or becomes too narrow", () => {
    let state = createHireFormState(offer);
    for (const slotId of ["a", "b"])
      state = hireFormReducer(state, {
        type: "scheduleToggled",
        slotId,
        checked: true,
      });
    const changed = hireFormReducer(state, {
      type: "offerRefreshed",
      offer: {
        ...offer,
        availability: [
          { ...offer.availability[0], dayOfWeek: 3 },
          { ...offer.availability[1], startTime: "19:00" },
        ],
      },
    });
    expect(changed.values.windows).toEqual({});
    expect(changed.refreshMessage).toContain("bỏ chọn");
    expect(Object.keys(state.values.windows)).toHaveLength(2);
  });
});
