import { http } from "@/lib/api/http";
import type { TutorProfileStatus } from "@/types/user";

export interface TutorCertificationDto {
  name: string;
  issuer: string;
  issueYear?: number;
  fileUrl: string;
}

export interface TutorAboutDto {
  fullName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  subjects?: string[];
  languages?: string[];
  teachingLevels?: string[];
}

export interface TutorEducationDto {
  educationType?: "GRADUATED" | "STUDYING" | "NO_DEGREE" | string;
  schoolName?: string;
  degree?: string;
  specialization?: string;
  yearOfStudy?: number;
}

export interface TutorDescriptionDto {
  bio?: string;
  experienceYears?: number;
  teachingMethodology?: string;
  achievementsAndResults?: string;
}

export interface TutorPricingDto {
  hourlyRateVnd?: number;
  sessionRateVnd?: number;
  monthlyRateVnd?: number;
  isNegotiable: boolean;
}

export interface TutorDiscoveryData { subjects?: { subjectId: string; levelCodes: string[] }[]; teachingModes?: string[]; provinceCode?: string | null; districtCode?: string | null }

export interface TutorOnboardingResponse {
  version?: string;
  discovery?: TutorDiscoveryData;
  status: TutorProfileStatus;
  currentStep: number;
  about: TutorAboutDto;
  avatarUrl?: string;
  hasCertifications: boolean;
  certifications: TutorCertificationDto[];
  education: TutorEducationDto;
  description: TutorDescriptionDto;
  pricing: TutorPricingDto;
  submittedAt?: string;
  approvedAt?: string;
}

export interface SaveOnboardingDraftRequest {
  expectedVersion?: string;
  discovery?: TutorDiscoveryData;
  currentStep?: number;
  about?: TutorAboutDto;
  avatarUrl?: string;
  hasCertifications?: boolean;
  certifications?: TutorCertificationDto[];
  education?: TutorEducationDto;
  description?: TutorDescriptionDto;
  pricing?: TutorPricingDto;
}

export interface UploadFileResponse {
  fileUrl: string;
  fileName: string;
}

export interface SubmitOnboardingResponse {
  status: TutorProfileStatus;
  submittedAt: string;
  message: string;
}

/**
 * Lấy dữ liệu hồ sơ Onboarding hiện tại của Gia sư
 */
export async function getTutorOnboarding(signal?: AbortSignal): Promise<TutorOnboardingResponse> {
  const { data } = await http.get<TutorOnboardingResponse>("/tutor/onboarding/me", { signal });
  return data;
}

/**
 * Lưu nháp tiến độ Onboarding (hỗ trợ autosave từng bước)
 */
export async function saveTutorOnboardingDraft(
  draft: SaveOnboardingDraftRequest
): Promise<TutorOnboardingResponse> {
  const { data } = await http.put<TutorOnboardingResponse>("/tutor/onboarding/draft", draft);
  return data;
}

/**
 * Tải lên ảnh đại diện của Gia sư
 */
export async function uploadTutorAvatar(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post<UploadFileResponse>("/tutor/onboarding/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Tải lên file chứng chỉ/bằng cấp (PDF hoặc ảnh)
 */
export async function uploadTutorCertificate(file: File): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post<UploadFileResponse>("/tutor/onboarding/certificates/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Nộp hồ sơ Onboarding chính thức để chuyển sang trạng thái chờ duyệt (PENDING_REVIEW)
 */
export async function submitTutorOnboarding(expectedVersion?: string): Promise<SubmitOnboardingResponse> {
  const { data } = await http.post<SubmitOnboardingResponse>("/tutor/onboarding/submit", expectedVersion ? { expectedVersion } : undefined);
  return data;
}
