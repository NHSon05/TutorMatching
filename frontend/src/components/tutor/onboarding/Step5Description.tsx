"use client";

import React from "react";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import type { OnboardingFormState } from "./types";

interface Step5DescriptionProps {
  data: OnboardingFormState["description"];
  onChange: (updated: Partial<OnboardingFormState["description"]>) => void;
  errors: Record<string, string>;
}

export function Step5Description({ data, onChange, errors }: Step5DescriptionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">5. Giới thiệu & Phương pháp giảng dạy</h2>
        <p className="text-sm text-gray-500 mt-1">
          Một bài giới thiệu chỉn chu và tâm huyết là chìa khóa để phụ huynh lựa chọn bạn thay vì hàng trăm gia sư khác.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <TextField
            label="Số năm kinh nghiệm gia sư / giảng dạy"
            type="number"
            required
            placeholder="Ví dụ: 2"
            value={data.experienceYears ?? ""}
            onChange={(e) =>
              onChange({
                experienceYears: e.target.value !== "" ? Number(e.target.value) : undefined,
              })
            }
            error={errors.experienceYears}
            helperText="Nhập 0 nếu bạn là gia sư mới bắt đầu."
          />
        </div>

        <div>
          <TextArea
            label="Giới thiệu bản thân (Bio)"
            required
            rows={4}
            placeholder="Hãy viết vài câu giới thiệu về tính cách, đam mê giảng dạy, thái độ trách nhiệm và tinh thần nhiệt huyết của bạn đối với học sinh..."
            value={data.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            error={errors.bio}
            helperText="Tối thiểu 20 ký tự."
          />
        </div>

        <div>
          <TextArea
            label="Phương pháp giảng dạy"
            rows={3}
            placeholder="Ví dụ: Bám sát sách giáo khoa, khơi gợi tư duy chủ động, kiên nhẫn giảng giải từ cơ bản đến nâng cao, kiểm tra tiến độ định kỳ hàng tuần..."
            value={data.teachingMethodology}
            onChange={(e) => onChange({ teachingMethodology: e.target.value })}
            helperText="Nêu rõ cách bạn tiếp cận và giúp học sinh hiểu bài nhanh."
          />
        </div>

        <div>
          <TextArea
            label="Thành tích cá nhân & Kết quả học sinh đã đạt được"
            rows={3}
            placeholder="Ví dụ: 95% học sinh đỗ trường chuyên hoặc tăng từ 2-3 điểm môn Toán sau 2 tháng học kèm; Giải Ba HSG cấp Tỉnh môn Ngữ văn..."
            value={data.achievementsAndResults}
            onChange={(e) => onChange({ achievementsAndResults: e.target.value })}
            helperText="Các dẫn chứng và số liệu cụ thể sẽ tạo ấn tượng mạnh."
          />
        </div>
      </div>
    </div>
  );
}
