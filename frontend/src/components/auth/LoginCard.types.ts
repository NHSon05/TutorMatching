import type { UserRole } from "@/types";

export interface LoginCardProps {
  className?: string;
  onSuccess?: (role: UserRole) => void;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}
