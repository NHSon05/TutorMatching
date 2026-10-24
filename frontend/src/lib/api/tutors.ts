import { http, API_BASE_URL } from "./http";
export interface PublicSubject {
  subjectId: string;
  name: string;
  levelCodes: string[];
  levelNames: string[];
}
export interface TutorListItemResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  qualification: string | null;
  schoolName: string | null;
  specialization: string | null;
  experienceYears: number | null;
  teachingMethodology: string | null;
  achievements: string | null;
  sessionRateVnd: number;
  teachingModes: string[];
  provinceCode: string | null;
  provinceName: string | null;
  districtCode: string | null;
  districtName: string | null;
  subjects: PublicSubject[];
  approvedAt: string | null;
}
export interface TutorQueryParameters {
  name?: string;
  subjectId?: string[];
  levelCode?: string[];
  qualification?: string;
  minPrice?: number;
  maxPrice?: number;
  mode?: string[];
  provinceCode?: string;
  districtCode?: string;
  sessionsPerWeek?: number;
  durationMinutes?: number;
  weeklyWindows?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}
export interface PagedTutorsResponse {
  items: TutorListItemResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}
export function serializeTutorQuery(params: TutorQueryParameters) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    for (const entry of Array.isArray(value) ? value : [value])
      query.append(key, String(entry));
  }
  return query;
}
export async function getTutors(
  params?: TutorQueryParameters | URLSearchParams,
  signal?: AbortSignal
): Promise<PagedTutorsResponse> {
  return (
    await http.get<PagedTutorsResponse>("/tutors", {
      params:
        params instanceof URLSearchParams
          ? params
          : serializeTutorQuery(params ?? {}),
      signal,
    })
  ).data;
}
export function publicAvatarUrl(value: string | null) {
  if (!value) return undefined;
  if (value.startsWith("/uploads/avatars/") && !value.includes(".."))
    return new URL(value, API_BASE_URL).href;
  return /^https?:\/\//.test(value) ? value : undefined;
}
export interface PublicTutorDetail extends TutorListItemResponse {
  availability: {
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timeZone: string;
  }[];
  courses: {
    id: string;
    subjectId: string;
    subjectName: string;
    name: string;
    content: string | null;
    sessionCount: number;
    pricePerSessionVnd: number;
  }[];
}
export async function getTutorById(
  id: string,
  signal?: AbortSignal
): Promise<PublicTutorDetail> {
  return (
    await http.get<PublicTutorDetail>(`/tutors/${encodeURIComponent(id)}`, {
      signal,
    })
  ).data;
}
