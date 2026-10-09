"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ROLE_CARD_OPTIONS,
  type RoleId,
  type SelectRoleCardProps,
} from "./SelectRoleCard.types";

export type * from "./SelectRoleCard.types";

export default function SelectRoleCard({ className = "", onRoleSelected }: SelectRoleCardProps = {}) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleId>("TUTOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmRole = () => {
    setIsSubmitting(true);
    onRoleSelected?.(selectedRole);

    // Lưu token mô phỏng (nếu chưa có) và role vào cookie
    const userRole = selectedRole === "TUTOR" ? "TUTOR" : "LEARNER";
    document.cookie = `auth_token=oauth_google_verified; path=/; max-age=86400`;
    document.cookie = `user_role=${userRole}; path=/; max-age=86400`;

    // Hiển thị thông báo và điều hướng theo vai trò
    setTimeout(() => {
      if (userRole === "TUTOR") {
        router.push("/tutor/dashboard");
      } else {
        router.push("/learner/dashboard");
      }
    }, 300);
  };

  return (
    <div className={`min-h-screen bg-[#18181b] flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans ${className}`.trim()}>
      <div className="bg-white rounded-[32px] shadow-2xl max-w-4xl w-full p-6 sm:p-10 border border-gray-100">
        
        {/* Header Section */}
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-base font-medium mb-3">
            <span>✨</span>
            <span>Bước cuối hoàn tất đăng ký</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
            Chọn vai trò của bạn
          </h1>

          <p className="text-base text-gray-600 leading-relaxed">
            Bạn vừa đăng nhập qua Google OAuth. Vui lòng chọn vai trò để hệ thống thiết lập không gian và tính năng phù hợp nhất cho bạn.
          </p>
        </div>

        {/* 3 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {ROLE_CARD_OPTIONS.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <Card
                key={role.id}
                hoverable
                padding="medium"
                onClick={() => setSelectedRole(role.id)}
                className={`relative border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "!border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/20"
                    : "!border-gray-200 bg-white hover:!border-gray-300 hover:shadow-sm"
                }`}
              >
                {/* Active Indicator Radio */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{role.icon}</span>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-blue-600 bg-blue-600" : "border-gray-300 bg-white"
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <h2 className="text-xl font-bold text-gray-900">{role.title}</h2>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                      {role.badge}
                    </span>
                  </div>

                  <p className="text-base text-gray-600 mb-4 leading-normal">
                    {role.description}
                  </p>

                  <ul className="space-y-2 border-t border-gray-100 pt-3">
                    {role.highlights.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Selected Role Summary & Submit CTA */}
        <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-base text-gray-600 text-center sm:text-left">
            Vai trò đã chọn:{" "}
            <strong className="text-blue-600 font-semibold">
              {ROLE_CARD_OPTIONS.find((r) => r.id === selectedRole)?.title}
            </strong>
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="large"
                shape="rounded"
                className="w-full sm:w-auto text-base font-semibold"
                type="button"
              >
                Quay lại
              </Button>
            </Link>

            <Button
              variant="brand"
              size="large"
              shape="rounded"
              className="w-full sm:w-auto text-base font-semibold"
              onClick={handleConfirmRole}
              disabled={isSubmitting}
              type="button"
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận & Tiếp tục"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
