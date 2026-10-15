import type { TutorProfileStatus, UserRole } from "@/types";

export interface LoginCardProps {
  className?: string;
  onSuccess?: (role: UserRole, tutorProfileStatus?: TutorProfileStatus | null) => void;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
