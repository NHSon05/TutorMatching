import { http } from "./http";

export interface HireSchedule {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface HireTermsDto {
  startDate: string;
  sessionsPerWeek: number;
  durationMinutes: number;
  teachingMode: "ONLINE" | "OFFLINE" | "HYBRID" | string;
  provinceCode?: string;
  districtCode?: string;
  locationDetail?: string;
  priceVnd: number;
  schedules: HireSchedule[];
}

export interface HireIdentity {
  id: string;
  displayName: string;
}

export interface HireProposal {
  sequence: number;
  senderId: string;
  terms: HireTermsDto;
  note?: string;
  createdAt: string;
}

export interface HireAgreement {
  terms: HireTermsDto;
  acceptedBy: string;
  acceptedAt: string;
  proposalSequence?: number | null;
  provinceName?: string;
  districtName?: string;
}

export interface HireEvent {
  sequence: number;
  actorId?: string | null;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  createdAt: string;
}

export interface HireSummary {
  id: string;
  version: string;
  status:
    | "PENDING"
    | "NEGOTIATING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED"
    | string;
  learner: HireIdentity;
  tutor: HireIdentity;
  createdAt: string;
}

export interface HireDetail {
  id: string;
  version: string;
  status:
    | "PENDING"
    | "NEGOTIATING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED"
    | "COMPLETED"
    | string;
  learner: HireIdentity;
  tutor: HireIdentity;
  createdAt: string;
  initialTerms: HireTermsDto;
  currentTerms: HireTermsDto;
  finalAgreement?: HireAgreement | null;
  proposals: HireProposal[];
  history: HireEvent[];
  conversationId: string;
  allowedActions: Array<
    "accept" | "reject" | "propose" | "cancel" | "complete" | string
  >;
}

export interface HirePage {
  items: HireSummary[];
  nextCursor?: string | null;
}

export interface HireResult {
  id: string;
  version: string;
  status: string;
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

export interface AcceptHireRequest {
  expectedVersion: string;
  proposalSequence: number | null;
}

export interface RejectHireRequest {
  expectedVersion: string;
  reason: string;
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

export async function listHireRequests(
  params?: { status?: string; cursor?: string; pageSize?: number },
  signal?: AbortSignal
): Promise<HirePage> {
  return (
    await http.get<HirePage>("/hire-requests", {
      params,
      signal,
    })
  ).data;
}

export async function getHireRequest(
  id: string,
  signal?: AbortSignal
): Promise<HireDetail> {
  return (
    await http.get<HireDetail>(`/hire-requests/${id}`, {
      signal,
    })
  ).data;
}

export async function acceptHireRequest(
  id: string,
  body: AcceptHireRequest
): Promise<HireResult> {
  return (await http.post<HireResult>(`/hire-requests/${id}/accept`, body))
    .data;
}

export async function rejectHireRequest(
  id: string,
  body: RejectHireRequest
): Promise<HireResult> {
  return (await http.post<HireResult>(`/hire-requests/${id}/reject`, body))
    .data;
}

export interface ProposeHireRequest {
  expectedVersion: string;
  priceVnd?: number;
  schedules?: HireSchedule[];
  note?: string;
}

export async function proposeHireRequest(
  id: string,
  body: ProposeHireRequest
): Promise<HireResult> {
  return (await http.post<HireResult>(`/hire-requests/${id}/proposals`, body))
    .data;
}

export interface CloseHireRequest {
  expectedVersion: string;
  confirmed: true;
  reason?: string;
}

export async function cancelHireRequest(
  id: string,
  body: CloseHireRequest
): Promise<HireResult> {
  return (await http.post<HireResult>(`/hire-requests/${id}/cancel`, body)).data;
}

export async function completeHireRequest(
  id: string,
  body: CloseHireRequest
): Promise<HireResult> {
  return (await http.post<HireResult>(`/hire-requests/${id}/complete`, body))
    .data;
}
