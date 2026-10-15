"use client";

import React, { useState } from "react";
import { TextField } from "@/components/ui/text-field";
import type { OnboardingFormState } from "./types";

interface Step1AboutProps {
  data: OnboardingFormState["about"];
  onChange: (updated: Partial<OnboardingFormState["about"]>) => void;
  errors: Record<string, string>;
}

const POPULAR_SUBJECTS = [
  "Toán học",
  "Tiếng Anh",
  "Ngữ văn",
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Lịch sử",
  "Địa lý",
  "Tin học / Lập trình",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Tiếng Trung",
  "Tiếng Pháp",
  "Toán tư duy",
  "Rèn chữ đẹp",
];

const POPULAR_LANGUAGES = [
  "Tiếng Việt",
  "Tiếng Anh",
  "Tiếng Nhật",
  "Tiếng Hàn",
  "Tiếng Trung",
  "Tiếng Pháp",
];

const POPULAR_LEVELS = [
  "Tiểu học (Lớp 1 - 5)",
  "THCS (Lớp 6 - 9)",
  "THPT (Lớp 10 - 12)",
  "Luyện thi vào 10",
  "Luyện thi tốt nghiệp & ĐH",
  "Sinh viên đại học",
  "Người đi làm",
];

export function Step1About({ data, onChange, errors }: Step1AboutProps) {
  const [customSubject, setCustomSubject] = useState("");

  const toggleItem = (list: string[], item: string): string[] => {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  };

  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubject.trim();
    if (!trimmed) return;
    if (!data.subjects.includes(trimmed)) {
      onChange({ subjects: [...data.subjects, trimmed] });
    }
    setCustomSubject("");
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

      {/* Môn học nhận dạy */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-900">
            Môn học nhận dạy <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-gray-500">Đã chọn: {data.subjects.length} môn</span>
        </div>
        <p className="text-xs text-gray-500">Nhấp vào môn học bạn có thể giảng dạy tốt nhất:</p>

        <div className="flex flex-wrap gap-2 pt-1">
          {POPULAR_SUBJECTS.map((subject) => {
            const isSelected = data.subjects.includes(subject);
            return (
              <button
                key={subject}
                type="button"
                onClick={() => onChange({ subjects: toggleItem(data.subjects, subject) })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isSelected ? `✓ ${subject}` : `+ ${subject}`}
              </button>
            );
          })}
        </div>

        {/* Nhập thêm môn khác */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Nhập môn học khác..."
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomSubject(e);
              }
            }}
            className="text-xs border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleAddCustomSubject}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
          >
            Thêm
          </button>
        </div>
        {errors.subjects && <p className="text-xs text-red-600 font-medium">{errors.subjects}</p>}
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

      {/* Cấp học nhận dạy */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="text-sm font-semibold text-gray-900 block">
          Cấp học nhận dạy <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_LEVELS.map((level) => {
            const isSelected = data.teachingLevels.includes(level);
            return (
              <button
                key={level}
                type="button"
                onClick={() => onChange({ teachingLevels: toggleItem(data.teachingLevels, level) })}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isSelected ? `✓ ${level}` : `+ ${level}`}
              </button>
            );
          })}
        </div>
        {errors.teachingLevels && (
          <p className="text-xs text-red-600 font-medium">{errors.teachingLevels}</p>
        )}
      </div>
    </div>
  );
}
