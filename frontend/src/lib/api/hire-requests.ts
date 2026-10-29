import { http } from "./http";

export interface HireSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}
export interface CreateHireRequest {
  tutorProfileId: string;
  subjectId: string;
  courseId?: string;
  expectedListedPriceVnd: number;
  priceVnd: number;
  startDate: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  teachingMode: string;
  provinceCode?: string;
  districtCode?: string;
  locationDetail?: string;
  schedules: HireSchedule[];
  note?: string;
}
export interface HireCreated {
  id: string;
  version: string;
  status: "PENDING" | "NEGOTIATING";
  conversationId: string;
}
export async function createHireRequest(
  body: CreateHireRequest,
  key: string
): Promise<HireCreated> {
  return (
    await http.post<HireCreated>("/hire-requests", body, {
      headers: { "Idempotency-Key": key },
    })
  ).data;
}
