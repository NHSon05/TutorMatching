"use client";

import React from "react";
import { TextField } from "@/components/ui/text-field";
import { Checkbox } from "@/components/ui/checkbox";
import type { OnboardingFormState } from "./types";

interface Step6PricingProps {
  data: OnboardingFormState["pricing"];
  onChange: (updated: Partial<OnboardingFormState["pricing"]>) => void;
  errors: Record<string, string>;
  fullState: OnboardingFormState;
}

export function Step6Pricing({ data, onChange, errors, fullState }: Step6PricingProps) {
  const formatVnd = (num?: number) => {
    if (!num) return "";
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">6. Thiết lập mức giá học phí</h2>
        <p className="text-sm text-gray-500 mt-1">
          Thiết lập mức học phí mong muốn. Bạn có thể điều chỉnh linh hoạt theo từng buổi học hoặc gói tháng.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <TextField
            label="Học phí theo giờ (VNĐ/giờ)"
            type="number"
            placeholder="150000"
            value={data.hourlyRateVnd ?? ""}
            onChange={(e) =>
              onChange({
                hourlyRateVnd: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            helperText={data.hourlyRateVnd ? `~ ${formatVnd(data.hourlyRateVnd)} đ / giờ` : "Ví dụ: 150.000 đ"}
          />
        </div>

        <div>
          <TextField
            label="Học phí theo buổi (VNĐ/buổi)"
            type="number"
            placeholder="300000"
            value={data.sessionRateVnd ?? ""}
            onChange={(e) =>
              onChange({
                sessionRateVnd: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            helperText={data.sessionRateVnd ? `~ ${formatVnd(data.sessionRateVnd)} đ / buổi` : "Ví dụ: 300.000 đ (2 giờ)"}
          />
        </div>

        <div>
          <TextField
            label="Học phí theo tháng (VNĐ/tháng)"
            type="number"
            placeholder="2500000"
            value={data.monthlyRateVnd ?? ""}
            onChange={(e) =>
              onChange({
                monthlyRateVnd: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            helperText={data.monthlyRateVnd ? `~ ${formatVnd(data.monthlyRateVnd)} đ / tháng` : "Ví dụ: 2.500.000 đ (8-10 buổi)"}
          />
        </div>
      </div>

      {errors.pricing && (
        <p className="text-xs text-red-600 font-medium">{errors.pricing}</p>
      )}

      {/* Checkbox thương lượng */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
        <Checkbox
          variant="tutor"
          checked={data.isNegotiable}
          onChange={(checked) => onChange({ isNegotiable: checked })}
          label={<span className="text-sm font-semibold text-gray-800">Cho phép phụ huynh / học viên thương lượng học phí</span>}
          helperText="Bật tùy chọn này sẽ giúp bạn nhận được nhiều lời mời học thử hơn từ học viên có ngân sách linh hoạt."
        />
      </div>

      {/* Tóm tắt nhanh hồ sơ trước khi nộp */}
      <div className="p-5 bg-amber-50/60 rounded-xl border border-amber-200/70 space-y-3">
        <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
          <span>📋</span> Tóm tắt hồ sơ gia sư của bạn:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
          <div>• <strong>Họ tên:</strong> {fullState.about.fullName || "Chưa nhập"}</div>
          <div>• <strong>Điện thoại:</strong> {fullState.about.phoneNumber || "Chưa nhập"}</div>
          <div>• <strong>Môn dạy:</strong> {fullState.about.subjects.join(", ") || "Chưa chọn"}</div>
          <div>• <strong>Cấp học:</strong> {fullState.about.teachingLevels.join(", ") || "Chưa chọn"}</div>
          <div>• <strong>Học vấn:</strong> {fullState.education.schoolName || fullState.education.educationType}</div>
          <div>• <strong>Kinh nghiệm:</strong> {fullState.description.experienceYears ?? 0} năm</div>
        </div>
      </div>
    </div>
  );
}
