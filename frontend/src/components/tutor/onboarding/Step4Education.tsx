"use client";

import React from "react";
import { TextField } from "@/components/ui/text-field";
import type { OnboardingFormState } from "./types";

interface Step4EducationProps {
  data: OnboardingFormState["education"];
  onChange: (updated: Partial<OnboardingFormState["education"]>) => void;
  errors: Record<string, string>;
}

export function Step4Education({ data, onChange, errors }: Step4EducationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">4. Trình độ học vấn & Bằng cấp</h2>
        <p className="text-sm text-gray-500 mt-1">
          Học vấn là tiêu chí hàng đầu giúp tạo dựng niềm tin vững chắc đối với phụ huynh và học viên.
        </p>
      </div>

      {/* Lựa chọn trạng thái học vấn */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-900 block">
          Trạng thái học vấn hiện tại <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              type: "STUDYING",
              label: "Đang là sinh viên",
              desc: "Đang theo học tại các trường Đại học / Cao đẳng",
            },
            {
              type: "GRADUATED",
              label: "Đã tốt nghiệp",
              desc: "Đã có bằng Cử nhân, Kỹ sư, Thạc sĩ hoặc Tiến sĩ",
            },
            {
              type: "NO_DEGREE",
              label: "Chưa có bằng cấp / Khác",
              desc: "Gia sư tự do, chuyên gia có kinh nghiệm thực tế",
            },
          ].map((item) => {
            const isSelected = data.educationType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() =>
                  onChange({
                    educationType: item.type as "GRADUATED" | "STUDYING" | "NO_DEGREE",
                  })
                }
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-amber-600 bg-amber-50/50 ring-1 ring-amber-600"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-amber-600 bg-amber-600 text-white text-xs"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  <span className="font-semibold text-sm text-gray-900">{item.label}</span>
                </div>
                <p className="text-xs text-gray-500 pl-6">{item.desc}</p>
              </button>
            );
          })}
        </div>
        {errors.educationType && (
          <p className="text-xs text-red-600 font-medium">{errors.educationType}</p>
        )}
      </div>

      {/* Chi tiết trường và chuyên ngành */}
      {data.educationType !== "NO_DEGREE" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div className="sm:col-span-2">
            <TextField
              label="Trường Đại học / Cao đẳng / Viện đào tạo"
              required
              placeholder="Ví dụ: Đại học Bách Khoa Hà Nội, Đại học Sư phạm TP.HCM"
              value={data.schoolName}
              onChange={(e) => onChange({ schoolName: e.target.value })}
              error={errors.schoolName}
            />
          </div>

          <div>
            <TextField
              label="Bằng cấp / Trình độ"
              placeholder={data.educationType === "STUDYING" ? "Ví dụ: Sinh viên năm 3" : "Ví dụ: Cử nhân, Thạc sĩ"}
              value={data.degree}
              onChange={(e) => onChange({ degree: e.target.value })}
            />
          </div>

          <div>
            <TextField
              label="Chuyên ngành đào tạo"
              placeholder="Ví dụ: Sư phạm Toán, Ngôn ngữ Anh, Công nghệ thông tin"
              value={data.specialization}
              onChange={(e) => onChange({ specialization: e.target.value })}
            />
          </div>

          <div>
            <TextField
              label={data.educationType === "STUDYING" ? "Sinh viên năm thứ mấy?" : "Năm tốt nghiệp"}
              type="number"
              placeholder={data.educationType === "STUDYING" ? "Ví dụ: 3" : "Ví dụ: 2023"}
              value={data.yearOfStudy ?? ""}
              onChange={(e) =>
                onChange({ yearOfStudy: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
