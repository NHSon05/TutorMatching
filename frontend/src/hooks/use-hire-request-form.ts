"use client";

import { useReducer, useRef } from "react";
import { usePublicCatalog } from "@/hooks/use-public-catalog";
import type { PublicTutorDetail } from "@/lib/api/tutors";
import {
  createHireRequest,
  type CreateHireRequest,
} from "@/lib/api/hire-requests";
import { ApiError } from "@/lib/api/http";
import { getVietnamDate, sortWeeklySchedules } from "@/lib/date-time";
import {
  createHireFormState,
  hireFormReducer,
  type HireFormValues,
} from "./hire-request-form.reducer";

export interface HireRequestFormOptions {
  initialTutor: PublicTutorDetail;
  refresh: () => Promise<PublicTutorDetail | undefined>;
  onPendingChange: (pending: boolean) => void;
}

export function useHireRequestForm({
  initialTutor,
  refresh,
  onPendingChange,
}: HireRequestFormOptions) {
  // Snapshot changes only on explicit refresh, preserving payloads during retries.
  const [state, dispatch] = useReducer(
    hireFormReducer,
    initialTutor,
    createHireFormState
  );
  const tutor = state.offer;
  const {
    subject,
    course,
    startDate,
    frequency,
    duration,
    mode,
    province,
    district,
    location,
    windows,
    price,
    note,
  } = state.values;
  const identity = useRef<{ payload: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const refreshing = useRef(false);
  const provinces = usePublicCatalog("provinces", mode !== "ONLINE");
  const districts = usePublicCatalog("districts", mode !== "ONLINE");
  const selectedCourse = tutor.courses.find(
    (c) => c.id === course && c.subjectId === subject
  );
  const listed = selectedCourse?.pricePerSessionVnd ?? tutor.sessionRateVnd;
  const fieldError = (key: string) =>
    state.submission.status === "error"
      ? state.submission.fieldErrors[key]?.join(" ")
      : undefined;
  const setError = (message: string) =>
    dispatch({
      type: "submissionChanged",
      submission: {
        status: "error",
        message,
        fieldErrors: {},
        conflict: false,
      },
    });
  async function submit() {
    if (inFlight.current || refreshing.current) return;
    const schedules = sortWeeklySchedules(Object.values(windows));
    if (
      !subject ||
      !mode ||
      !startDate ||
      startDate <= getVietnamDate() ||
      !schedules.length ||
      (mode !== "ONLINE" && (!province || !district))
    ) {
      setError(
        "Chọn môn, ngày bắt đầu trong tương lai, lịch học và địa điểm nếu học trực tiếp."
      );
      return;
    }
    if (course && !selectedCourse) {
      setError("Khóa học không còn khả dụng. Vui lòng chọn lại.");
      return;
    }
    const body: CreateHireRequest = {
      tutorProfileId: tutor.id,
      subjectId: subject,
      ...(course ? { courseId: course } : {}),
      startDate,
      sessionsPerWeek: Number(frequency),
      durationMinutes: Number(duration),
      teachingMode: mode,
      expectedListedPriceVnd: listed,
      priceVnd: price ? Number(price) : listed,
      schedules,
      ...(mode !== "ONLINE"
        ? {
            provinceCode: province,
            districtCode: district,
            ...(location.trim() ? { locationDetail: location.trim() } : {}),
          }
        : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    const payload = JSON.stringify(body);
    if (identity.current?.payload !== payload)
      identity.current = { payload, key: crypto.randomUUID() };
    inFlight.current = true;
    onPendingChange(true);
    dispatch({
      type: "submissionChanged",
      submission: { status: "submitting" },
    });
    try {
      const result = await createHireRequest(body, identity.current.key);
      dispatch({
        type: "submissionChanged",
        submission: { status: "success", result },
      });
    } catch (failure) {
      if (failure instanceof ApiError) {
        dispatch({
          type: "submissionChanged",
          submission: {
            status: "error",
            message: failure.title,
            fieldErrors: failure.errors ?? {},
            conflict: failure.status === 409,
          },
        });
      } else
        setError(
          "Chưa nhận được xác nhận. Giữ nguyên nội dung và bấm gửi lại để kiểm tra kết quả, tránh tạo yêu cầu trùng."
        );
    } finally {
      inFlight.current = false;
      onPendingChange(false);
    }
  }
  async function refreshOffer() {
    if (inFlight.current || refreshing.current) return;
    refreshing.current = true;
    onPendingChange(true);
    dispatch({ type: "refreshStarted" });
    try {
      const offer = await refresh();
      dispatch(
        offer ? { type: "offerRefreshed", offer } : { type: "refreshFailed" }
      );
    } catch {
      dispatch({ type: "refreshFailed" });
    } finally {
      refreshing.current = false;
      onPendingChange(false);
    }
  }
  const actions = {
    changeField: (
      field: Exclude<keyof HireFormValues, "windows" | "subject" | "province">,
      value: string
    ) => dispatch({ type: "fieldChanged", field, value }),
    changeSubject: (subjectId: string) =>
      dispatch({ type: "subjectChanged", subjectId }),
    changeProvince: (provinceCode: string) =>
      dispatch({ type: "provinceChanged", provinceCode }),
    toggleSchedule: (slotId: string, checked: boolean) =>
      dispatch({ type: "scheduleToggled", slotId, checked }),
    changeScheduleTime: (
      slotId: string,
      field: "startTime" | "endTime",
      value: string
    ) => dispatch({ type: "scheduleTimeChanged", slotId, field, value }),
    refreshOffer,
  };
  return {
    tutor,
    values: state.values,
    submission: state.submission,
    busy: state.submission.status === "submitting" || state.refreshing,
    refreshMessage: state.refreshMessage,
    provinces,
    districts,
    listed,
    fieldError,
    actions,
    submit,
  };
}
