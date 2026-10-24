"use client";

import React from "react";
import { TextField } from "@/components/ui/text-field";
import type { OnboardingFormState } from "./types";

interface Step1AboutProps {
  data: OnboardingFormState["about"];
  onChange: (updated: Partial<OnboardingFormState["about"]>) => void;
  errors: Record<string, string>;
}

const POPULAR_LANGUAGES = [
  "Tiếng Việt",
  "Tiếng Anh",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Tiếng Trung",
  "Tiếng Pháp",
];

export function Step1About({ data, onChange, errors }: Step1AboutProps) {

  const toggleItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">1. Thông tin cá nhân & Chuyên môn dạy</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cung cấp thông tin cơ bản giúp học viên và phụ huynh dễ dàng tìm thấy và liên hệ với bạn.
        </p>
      </div>

      {/* Thông tin liên hệ cơ bản */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <TextField
            label="Họ và tên đầy đủ"
            required
            placeholder="Ví dụ: Nguyễn Văn An"
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            error={errors.fullName}
            helperText="Tên thật sẽ hiển thị trên hồ sơ gia sư đã duyệt."
          />
        </div>

        <div>
          <TextField
            label="Ngày sinh"
            type="date"
            required
            value={data.dateOfBirth}
            onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            error={errors.dateOfBirth}
          />
        </div>

        <div>
          <TextField
            label="Số điện thoại liên hệ"
            type="tel"
            required
            placeholder="0912345678"
            value={data.phoneNumber}
            onChange={(e) => onChange({ phoneNumber: e.target.value })}
            error={errors.phoneNumber}
            helperText="Số điện thoại dùng để nhận thông báo nhận lớp."
          />
        </div>
      </div>

      {/* Ngôn ngữ giảng dạy */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="text-sm font-semibold text-gray-900 block">
          Ngôn ngữ giảng dạy <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LANGUAGES.map((lang) => {
            const isSelected = data.languages.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onChange({ languages: toggleItem(data.languages, lang) })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isSelected ? `✓ ${lang}` : `+ ${lang}`}
              </button>
            );
          })}
        </div>
        {errors.languages && <p className="text-xs text-red-600 font-medium">{errors.languages}</p>}
      </div>

    </div>
  );
}
