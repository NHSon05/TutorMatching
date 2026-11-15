import { http } from "./http";

export type UserRoleKey = "LEARNER" | "TUTOR" | "ADMIN";
export type TutorProfileStatusKey =
  "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type HireRequestStatusKey =
  | "PENDING"
  | "NEGOTIATING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export interface SubjectDemand {
  subjectId: string;
  name: string;
  requestCount: number;
}

/** One consistent database snapshot; every canonical key is present, zeros included. */
export interface DashboardSnapshot {
  asOf: string;
  usersByRole: Record<UserRoleKey, number>;
  tutorProfilesByStatus: Record<TutorProfileStatusKey, number>;
  hireRequestsByStatus: Record<HireRequestStatusKey, number>;
  topSubjects: SubjectDemand[];
}

export async function getAdminDashboard(signal?: AbortSignal) {
  return (await http.get<DashboardSnapshot>("/admin/dashboard", { signal }))
    .data;
}
