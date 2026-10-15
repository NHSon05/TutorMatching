import { http } from "@/lib/api/http";
import type { TutorProfileStatus } from "@/types/user";
export type { ApiProblemDetails } from "@/types/api";

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: "LEARNER" | "TUTOR";
}

export interface AccountResponse {
  id: string;
  email: string;
  fullName: string;
  role: "LEARNER" | "TUTOR" | "ADMIN";
  status: "ACTIVE" | "LOCKED" | "INACTIVE";
  tutorProfileStatus?: TutorProfileStatus | null;
}

export async function registerAccount(request: RegisterRequest): Promise<AccountResponse> {
  const { data } = await http.post<AccountResponse>("/auth/register", request);
  return data;
}
