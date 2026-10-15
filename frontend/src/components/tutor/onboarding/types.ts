import type { TutorCertificationDto } from "@/lib/api/tutor-onboarding";

export interface OnboardingFormState {
  currentStep: number;
  about: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    subjects: string[];
    languages: string[];
    teachingLevels: string[];
  };
  avatarUrl: string;
  hasCertifications: boolean;
  certifications: TutorCertificationDto[];
  education: {
    educationType: "GRADUATED" | "STUDYING" | "NO_DEGREE";
    schoolName: string;
    degree: string;
    specialization: string;
    yearOfStudy?: number;
  };
  description: {
    bio: string;
    experienceYears?: number;
    teachingMethodology: string;
    achievementsAndResults: string;
  };
  pricing: {
    hourlyRateVnd?: number;
    sessionRateVnd?: number;
    monthlyRateVnd?: number;
    isNegotiable: boolean;
  };
}

export const INITIAL_FORM_STATE: OnboardingFormState = {
  currentStep: 1,
  about: {
    fullName: "",
    dateOfBirth: "",
    phoneNumber: "",
    subjects: [],
    languages: ["Tiếng Việt"],
    teachingLevels: [],
  },
  avatarUrl: "",
  hasCertifications: false,
  certifications: [],
  education: {
    educationType: "STUDYING",
    schoolName: "",
    degree: "",
    specialization: "",
    yearOfStudy: undefined,
  },
  description: {
    bio: "",
    experienceYears: 1,
    teachingMethodology: "",
    achievementsAndResults: "",
  },
  pricing: {
    hourlyRateVnd: 150000,
    sessionRateVnd: undefined,
    monthlyRateVnd: undefined,
    isNegotiable: true,
  },
};

export const STEPS = [
  { id: 1, title: "Thông tin cá nhân", shortTitle: "Cá nhân", description: "Họ tên, ngày sinh & chuyên môn" },
  { id: 2, title: "Ảnh đại diện", shortTitle: "Ảnh thẻ", description: "Tải lên ảnh chân dung rõ nét" },
  { id: 3, title: "Chứng chỉ / Bằng cấp", shortTitle: "Chứng chỉ", description: "Bằng ngoại ngữ & chuyên môn" },
  { id: 4, title: "Học vấn & Trường học", shortTitle: "Học vấn", description: "Trường đại học, chuyên ngành" },
  { id: 5, title: "Mô tả & Kinh nghiệm", shortTitle: "Giới thiệu", description: "Bio & phương pháp giảng dạy" },
  { id: 6, title: "Thiết lập học phí", shortTitle: "Học phí", description: "Học phí theo giờ, buổi, tháng" },
] as const;
