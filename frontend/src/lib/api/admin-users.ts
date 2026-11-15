import { http } from "./http";

export type AdminUserRole = "LEARNER" | "TUTOR" | "ADMIN";
export type AdminUserStatus = "ACTIVE" | "LOCKED" | "INACTIVE";
export type AdminUserTargetStatus = "ACTIVE" | "LOCKED";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  tutorProfileId: string | null;
  tutorProfileStatus: string | null;
  version: string;
}

export interface AdminUsersPage {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AdminUsersFilter {
  q?: string;
  role?: AdminUserRole;
  status?: AdminUserTargetStatus;
  page: number;
  pageSize?: number;
}

export const ADMIN_USERS_QUERY_MAX = 100;

export async function searchAdminUsers(
  filter: AdminUsersFilter,
  signal?: AbortSignal
) {
  const q = filter.q?.trim();
  return (
    await http.get<AdminUsersPage>("/admin/users", {
      params: {
        page: filter.page,
        pageSize: filter.pageSize ?? 20,
        ...(q ? { q: q.slice(0, ADMIN_USERS_QUERY_MAX) } : {}),
        ...(filter.role ? { role: filter.role } : {}),
        ...(filter.status ? { status: filter.status } : {}),
      },
      signal,
    })
  ).data;
}

export async function getAdminUser(id: string, signal?: AbortSignal) {
  return (await http.get<AdminUser>(`/admin/users/${id}`, { signal })).data;
}

/** Sent only after the administrator has explicitly confirmed the action. */
export async function updateAdminUserStatus(
  id: string,
  input: { expectedVersion: string; status: AdminUserTargetStatus }
) {
  return (
    await http.post<AdminUser>(`/admin/users/${id}/status`, {
      expectedVersion: input.expectedVersion,
      confirmed: true,
      status: input.status,
    })
  ).data;
}
