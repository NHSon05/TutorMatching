import { http } from "./http";

export interface ExtractedDemandCriteria {
  subjectId: string | null;
  subjectName: string | null;
  gradeLevel: number | null;
  tuitionFeeVnd: number;
  feePeriod: string;
  isFeeNegotiable: boolean;
  sessionsPerWeek: number | null;
  teachingMode: string;
  provinceCode: string | null;
  provinceName: string | null;
  districtCode: string | null;
  districtName: string | null;
  rawAddress: string | null;
  isLocationAmbiguous: boolean;
  confidenceScore: number;
}

export interface MatchedTutorCardItem {
  tutorProfileId: string;
  displayName: string;
  avatarUrl: string | null;
  headline: string | null;
  listedPriceVnd: number;
  isNegotiable: boolean;
  teachingModeCode: string;
  provinceName: string | null;
  districtName: string | null;
  subjects: string[];
  matchScore: number;
  matchHighlights: string[];
  schoolName?: string | null;
  degree?: string | null;
  specialization?: string | null;
  educationType?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  teachingMethodology?: string | null;
  achievementsAndResults?: string | null;
  hourlyRateVnd?: number | null;
  sessionRateVnd?: number | null;
  monthlyRateVnd?: number | null;
  teachingModes?: string[] | null;
}

export interface SubmitTutorDemandResponse {
  demandPostId: string;
  isDeduplicatedHit: boolean;
  extractedCriteria: ExtractedDemandCriteria;
  matchedTutors: MatchedTutorCardItem[];
}

export interface TutorMatchingProfileDto {
  id: string;
  preferredSubjects: string[];
  preferredGrades: number[];
  minTuitionFeeVnd: number;
  maxTuitionFeeVnd: number | null;
  preferredProvinceCode: string | null;
  preferredDistrictCodes: string[];
  receiveAllDistricts: boolean;
  teachingModes: string[];
  isActive: boolean;
}

export interface MatchedPostNotificationItem {
  notificationId: string;
  demandPostId: string;
  subjectName: string;
  gradeLevel: number;
  tuitionFeeVnd: number;
  feePeriod: string;
  teachingMode: string;
  provinceName: string;
  districtName: string | null;
  rawAddress: string | null;
  rawContent: string;
  isLocationAmbiguous: boolean;
  matchScore: number;
  createdAt: string;
  isRead: boolean;
}

export interface PaginatedMatchedPostsDto {
  items: MatchedPostNotificationItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export async function submitPublicTutorDemand(
  queryText: string
): Promise<SubmitTutorDemandResponse> {
  const { data } = await http.post<SubmitTutorDemandResponse>(
    "/public/tutor-demands/match",
    { queryText }
  );
  return data;
}

export async function getTutorMatchingProfile(): Promise<TutorMatchingProfileDto> {
  const { data } = await http.get<TutorMatchingProfileDto>(
    "/tutors/me/matching-profile"
  );
  return data;
}

export async function updateTutorMatchingProfile(
  payload: Omit<TutorMatchingProfileDto, "id">
): Promise<TutorMatchingProfileDto> {
  const { data } = await http.put<TutorMatchingProfileDto>(
    "/tutors/me/matching-profile",
    payload
  );
  return data;
}

export async function getTutorMatchedPosts(
  page = 1,
  pageSize = 20,
  unreadOnly = false
): Promise<PaginatedMatchedPostsDto> {
  const { data } = await http.get<PaginatedMatchedPostsDto>(
    `/tutors/me/matched-posts?page=${page}&pageSize=${pageSize}&unreadOnly=${unreadOnly}`
  );
  return data;
}
