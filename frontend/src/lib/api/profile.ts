import type { AccountResponse } from "@/lib/api/auth";
import { API_BASE_URL, http } from "@/lib/api/http";

export interface PersonalProfileResponse extends AccountResponse {
  phoneNumber: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
}

export async function updateCurrentProfile(request: UpdateProfileRequest): Promise<PersonalProfileResponse> {
  const { fullName, phoneNumber, dateOfBirth, avatarUrl } = request;
  const { data } = await http.put<PersonalProfileResponse>("/users/me", {
    fullName, phoneNumber, dateOfBirth, avatarUrl,
  });
  return data;
}

export function resolveAvatarUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("/uploads/avatars/")) {
    return new URL(value, new URL(API_BASE_URL, typeof window === "undefined" ? "http://localhost:3000" : window.location.origin).origin).href;
  }
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function validateProfile(request: UpdateProfileRequest): Partial<Record<keyof UpdateProfileRequest, string>> {
  const errors: Partial<Record<keyof UpdateProfileRequest, string>> = {};
  if (request.fullName.trim().length < 2 || request.fullName.trim().length > 100) {
    errors.fullName = "Họ và tên phải có từ 2 đến 100 ký tự.";
  }
  if (request.phoneNumber && request.phoneNumber.trim().length > 32) {
    errors.phoneNumber = "Số điện thoại không được vượt quá 32 ký tự.";
  }
  if (request.dateOfBirth) {
    const date = new Date(`${request.dateOfBirth}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(request.dateOfBirth) || Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== request.dateOfBirth ||
        request.dateOfBirth >= new Date().toISOString().slice(0, 10)) {
      errors.dateOfBirth = "Ngày sinh phải là ngày hợp lệ trong quá khứ.";
    }
  }
  if (request.avatarUrl) {
    const value = request.avatarUrl.trim();
    const local = value.startsWith("/uploads/avatars/") && !/\.\.|[%?#]/.test(value);
    let remote = false;
    try {
      const url = new URL(value);
      remote = ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
    } catch { /* Local upload paths do not have a URL scheme. */ }
    if (value.length > 2048 || /[\x00-\x1f\x7f\\]/.test(value) || (!local && !remote)) {
      errors.avatarUrl = "Dùng URL HTTP(S) hoặc đường dẫn /uploads/avatars/, tối đa 2.048 ký tự.";
    }
  }
  return errors;
}
