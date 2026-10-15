import { http } from "@/lib/api/http";
import type { TutorCertificationDto } from "@/lib/api/tutor-onboarding";

export interface TutorListItemResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  status: string;
  subjects: string[];
  languages: string[];
  teachingLevels: string[]; 
  educationType?: string;
  schoolName?: string;
  degree?: string;
  specialization?: string;
  yearOfStudy?: number;
  bio?: string;
  experienceYears: number;
  teachingMethodology?: string;
  achievementsAndResults?: string;
  hourlyRateVnd: number;
  sessionRateVnd?: number;
  monthlyRateVnd?: number;
  isNegotiable: boolean;
  rating: number;
  certifications: TutorCertificationDto[];
  createdAt: string;
  approvedAt?: string;
}

export interface TutorQueryParameters {
  search?: string;
  subject?: string;
  city?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedTutorsResponse {
  items: TutorListItemResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Lấy danh sách toàn bộ gia sư (hỗ trợ lọc theo tìm kiếm, môn học, khu vực, giá).
 */
export async function getTutors(params?: TutorQueryParameters): Promise<PagedTutorsResponse> {
  const res = await http.get<PagedTutorsResponse>("/tutors", { params });
  return res.data;
}

/**
 * Lấy thông tin chi tiết của một gia sư theo id hoặc userId.
 */
export async function getTutorById(id: string): Promise<TutorListItemResponse> {
  const res = await http.get<TutorListItemResponse>(`/tutors/${id}`);
  return res.data;
}
