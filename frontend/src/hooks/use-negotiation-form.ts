"use client";

import { useReducer, useRef } from "react";
import type { HireDetail, HireSchedule } from "@/lib/api/hire-requests";
import { ApiError } from "@/lib/api/http";
import { sortWeeklySchedules } from "@/lib/date-time";
import { useProposeHireRequest } from "@/hooks/use-hire-requests";

type Draft = {
  version: string;
  price: string;
  note: string;
  schedules: HireSchedule[];
  editSchedules: boolean;
  error: string;
  conflict: boolean;
  success: boolean;
  refreshing: boolean;
};
type Action =
  { type: "edit"; patch: Partial<Draft> } | { type: "sent"; version: string };
function reducer(state: Draft, action: Action): Draft {
  if (action.type === "sent")
    return {
      ...state,
      version: action.version,
      price: "",
      note: "",
      editSchedules: false,
      error: "",
      conflict: false,
      success: true,
    };
  return { ...state, ...action.patch };
}

export function useNegotiationForm(
  detail: HireDetail,
  refresh: () => Promise<HireDetail | undefined>
) {
  const mutation = useProposeHireRequest(detail.id);
  const [draft, dispatch] = useReducer(reducer, {
    version: detail.version,
    price: "",
    note: "",
    schedules: detail.currentTerms.schedules.map((s) => ({ ...s })),
    editSchedules: false,
    error: "",
    conflict: false,
    success: false,
    refreshing: false,
  });
  const lock = useRef(false);
  const edit = (patch: Partial<Draft>) => dispatch({ type: "edit", patch });
  const busy = mutation.isPending || draft.refreshing;
  async function submit() {
    if (lock.current || draft.conflict) return;
    if (draft.version !== detail.version) {
      edit({
        conflict: true,
        error: "Điều khoản đã thay đổi. Làm mới và kiểm tra trước khi gửi lại.",
      });
      return;
    }
    const price = draft.price.trim() ? Number(draft.price) : undefined;
    const schedules = draft.editSchedules
      ? sortWeeklySchedules(draft.schedules)
      : undefined;
    if (
      (price !== undefined &&
        (!Number.isInteger(price) || price < 1 || price > 2147483647)) ||
      (schedules &&
        (!schedules.length ||
          schedules.some(
            (s) => !s.startTime || !s.endTime || s.startTime >= s.endTime
          )))
    ) {
      edit({
        error:
          "Nhập giá nguyên dương và khung giờ có giờ kết thúc sau giờ bắt đầu.",
      });
      return;
    }
    if (
      (price === undefined || price === detail.currentTerms.priceVnd) &&
      (!schedules ||
        JSON.stringify(schedules) ===
          JSON.stringify(sortWeeklySchedules(detail.currentTerms.schedules)))
    ) {
      edit({ error: "Cần thay đổi ít nhất giá hoặc lịch học." });
      return;
    }
    lock.current = true;
    edit({ error: "", success: false });
    try {
      const result = await mutation.mutateAsync({
        expectedVersion: draft.version,
        ...(price !== undefined ? { priceVnd: price } : {}),
        ...(schedules ? { schedules } : {}),
        ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
      });
      dispatch({ type: "sent", version: result.version });
    } catch (error) {
      edit({
        conflict: error instanceof ApiError && error.status === 409,
        error:
          error instanceof ApiError && error.status === 409
            ? "Yêu cầu đã thay đổi. Nội dung được giữ lại; hãy làm mới và kiểm tra trước khi gửi lại."
            : error instanceof ApiError
              ? Object.values(error.errors ?? {})
                  .flat()
                  .join(" ") || error.title
              : "Chưa nhận được xác nhận. Hãy làm mới để kiểm tra đề xuất trước khi thử lại.",
      });
    } finally {
      lock.current = false;
    }
  }
  async function refreshDraft() {
    if (lock.current) return;
    lock.current = true;
    edit({ refreshing: true });
    try {
      const latest = await refresh();
      if (latest)
        edit({
          version: latest.version,
          conflict: false,
          error: "",
          success: false,
          ...(!draft.editSchedules
            ? {
                schedules: latest.currentTerms.schedules.map((s) => ({ ...s })),
              }
            : {}),
        });
      else
        edit({ error: "Không thể làm mới. Nội dung đề xuất đã được giữ lại." });
    } catch {
      edit({ error: "Không thể làm mới. Nội dung đề xuất đã được giữ lại." });
    } finally {
      edit({ refreshing: false });
      lock.current = false;
    }
  }
  return { draft, edit, busy, submit, refreshDraft };
}
