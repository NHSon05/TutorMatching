import type { PublicTutorDetail } from "@/lib/api/tutors";
import type { HireCreated, HireSchedule } from "@/lib/api/hire-requests";

export interface HireFormValues {
  subject: string;
  course: string;
  startDate: string;
  frequency: string;
  duration: string;
  mode: string;
  province: string;
  district: string;
  location: string;
  windows: Record<string, HireSchedule>;
  price: string;
  note: string;
}
export type Submission =
  | { status: "idle" }
  | { status: "submitting" }
  | {
      status: "error";
      message: string;
      fieldErrors: Record<string, string[]>;
      conflict: boolean;
    }
  | { status: "success"; result: HireCreated };
export interface HireFormState {
  offer: PublicTutorDetail;
  values: HireFormValues;
  submission: Submission;
  refreshing: boolean;
  refreshMessage: string;
}
export type HireFormAction =
  | {
      type: "fieldChanged";
      field: Exclude<keyof HireFormValues, "windows" | "subject" | "province">;
      value: string;
    }
  | { type: "subjectChanged"; subjectId: string }
  | { type: "provinceChanged"; provinceCode: string }
  | { type: "scheduleToggled"; slotId: string; checked: boolean }
  | {
      type: "scheduleTimeChanged";
      slotId: string;
      field: "startTime" | "endTime";
      value: string;
    }
  | { type: "submissionChanged"; submission: Submission }
  | { type: "refreshStarted" }
  | { type: "refreshFailed" }
  | { type: "offerRefreshed"; offer: PublicTutorDetail };

export function createHireFormState(offer: PublicTutorDetail): HireFormState {
  return {
    offer,
    values: {
      subject: offer.subjects[0]?.subjectId ?? "",
      course: "",
      startDate: "",
      frequency: "1",
      duration: "60",
      mode: offer.teachingModes[0] ?? "ONLINE",
      province: offer.provinceCode ?? "",
      district: offer.districtCode ?? "",
      location: "",
      windows: {},
      price: "",
      note: "",
    },
    submission: { status: "idle" },
    refreshing: false,
    refreshMessage: "",
  };
}

export function hireFormReducer(
  state: HireFormState,
  action: HireFormAction
): HireFormState {
  switch (action.type) {
    case "fieldChanged":
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
      };
    case "subjectChanged":
      return {
        ...state,
        values: { ...state.values, subject: action.subjectId, course: "" },
      };
    case "provinceChanged":
      return {
        ...state,
        values: {
          ...state.values,
          province: action.provinceCode,
          district: "",
        },
      };
    case "scheduleToggled": {
      const windows = { ...state.values.windows };
      const slot = state.offer.availability.find(
        (item) => item.id === action.slotId
      );
      if (action.checked && slot) {
        windows[slot.id] = {
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
        };
      } else delete windows[action.slotId];
      return { ...state, values: { ...state.values, windows } };
    }
    case "scheduleTimeChanged": {
      const slot = state.values.windows[action.slotId];
      if (!slot) return state;
      return {
        ...state,
        values: {
          ...state.values,
          windows: {
            ...state.values.windows,
            [action.slotId]: { ...slot, [action.field]: action.value },
          },
        },
      };
    }
    case "submissionChanged":
      return { ...state, submission: action.submission };
    case "refreshStarted":
      return { ...state, refreshing: true, refreshMessage: "" };
    case "refreshFailed":
      return {
        ...state,
        refreshing: false,
        refreshMessage:
          "Không cập nhật được giá và lịch. Nội dung đã nhập được giữ nguyên. Vui lòng thử lại.",
      };
    case "offerRefreshed": {
      const offer = action.offer;
      const values = { ...state.values };
      if (!offer.subjects.some((s) => s.subjectId === values.subject))
        values.subject = "";
      if (
        !offer.courses.some(
          (c) => c.id === values.course && c.subjectId === values.subject
        )
      )
        values.course = "";
      if (!offer.teachingModes.includes(values.mode)) values.mode = "";
      values.windows = Object.fromEntries(
        Object.entries(values.windows).filter(([id, selected]) =>
          offer.availability.some(
            (slot) =>
              slot.id === id &&
              slot.dayOfWeek === selected.dayOfWeek &&
              selected.startTime >= slot.startTime &&
              selected.endTime <= slot.endTime &&
              selected.startTime < selected.endTime
          )
        )
      );
      const removed =
        Object.keys(values.windows).length !==
        Object.keys(state.values.windows).length;
      return {
        ...state,
        offer,
        values,
        refreshing: false,
        submission: { status: "idle" },
        refreshMessage: removed
          ? "Đã cập nhật giá và lịch. Khung giờ không còn hợp lệ đã được bỏ chọn; vui lòng kiểm tra và chọn lại lịch học."
          : "Đã cập nhật giá và lịch. Vui lòng kiểm tra môn, khóa học và hình thức học trước khi gửi.",
      };
    }
  }
}
