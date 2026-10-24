import { http } from "./http";
import type { TutorOnboardingResponse } from "./tutor-onboarding";
export type ReviewAction = "APPROVE" | "REQUEST_CHANGES" | "REJECT";
export interface ReviewHistory {
  id: string;
  reviewerId: string;
  action: string;
  reviewedVersion: string | null;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  reviewedAt: string;
}
export interface ReviewQueueItem {
  id: string;
  displayName: string;
  accountStatus: string;
  submittedAt: string | null;
  version: string;
}
export interface ReviewQueuePage {
  items: ReviewQueueItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}
export interface ReviewDetail {
  id: string;
  accountStatus: string;
  profile: TutorOnboardingResponse;
  history: ReviewHistory[];
  subjects: { subjectId: string; name: string; levels: string[] }[];
  provinceName: string | null;
  districtName: string | null;
}
export async function getReviewQueue(page: number, signal?: AbortSignal) {
  return (
    await http.get<ReviewQueuePage>("/admin/tutor-reviews", {
      params: { page, pageSize: 20 },
      signal,
    })
  ).data;
}
export async function getReviewDetail(id: string, signal?: AbortSignal) {
  return (
    await http.get<ReviewDetail>(`/admin/tutor-reviews/${id}`, { signal })
  ).data;
}
export async function decideReview(
  id: string,
  input: { expectedVersion: string; action: ReviewAction; note?: string }
) {
  return (
    await http.post<{ status: string; version: string }>(
      `/admin/tutor-reviews/${id}`,
      input
    )
  ).data;
}
export async function getReviewHistory(signal?: AbortSignal) {
  return (await http.get<ReviewHistory[]>("/tutor/reviews", { signal })).data;
}
