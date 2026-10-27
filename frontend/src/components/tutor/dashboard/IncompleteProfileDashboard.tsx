"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import type { AccountResponse } from "@/lib/api/auth";

function BellIcon({ className = "w-5 h-5 text-content-primary" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export interface IncompleteProfileDashboardProps {
  account?: AccountResponse | null;
}

export function IncompleteProfileDashboard({ account }: IncompleteProfileDashboardProps) {
  const tutorDisplayName = account?.fullName
    ? account.fullName.split(" ").slice(-1)[0]
    : "Minh";

  const [steps, setSteps] = React.useState({
    subjects: false,
    locations: false,
    times: false,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ----------------------------------------------------------------------
          HEADER KHU VỰC TỔNG QUAN (WIREFRAME 1)
      ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content-primary">
            Tổng quan
          </h1>
          <p className="text-base text-content-secondary mt-1">
            Chào {tutorDisplayName}, bắt đầu hành trình dạy học của bạn.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="text-right">
            <p className="text-base font-semibold text-content-primary">
              27/10/2026
            </p>
            <p className="text-sm font-medium text-content-secondary">
              Thứ Ba
            </p>
          </div>

          <IconButton
            variant="secondary"
            size="medium"
            shape="rounded"
            aria-label="Thông báo hệ thống"
            className="border-border-default hover:bg-tutor-50 hover:text-role-tutor"
          >
            <BellIcon className="w-5 h-5 text-content-primary" />
          </IconButton>

          {/* Avatar mang phong cách Tutor Warm Gold */}
          <div
            title={`Gia sư ${account?.fullName || "Minh"}`}
            className="w-11 h-11 rounded-full border border-tutor-200 bg-tutor-50 flex items-center justify-center font-bold text-sm text-tutor-900 select-none shadow-2xs"
          >
            MN
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          4 THẺ THỐNG KÊ (METRIC CARDS) - TOÀN BỘ CHƯA CÓ SỐ LIỆU (0, 0, —, 0)
      ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-content-primary">0</p>
            <p className="text-base text-content-secondary mt-2">
              học sinh đang dạy
            </p>
          </div>
          <Link
            href="/tutor/teaching-classes"
            className="text-sm font-medium text-brand hover:text-brand-hover underline mt-4 inline-block transition-colors"
          >
            Xem chi tiết
          </Link>
        </Card>

        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-content-primary">0</p>
            <p className="text-base text-content-secondary mt-2">
              buổi học hôm nay
            </p>
          </div>
          <Link
            href="/tutor/offers"
            className="text-sm font-medium text-brand hover:text-brand-hover underline mt-4 inline-block transition-colors"
          >
            Xem chi tiết
          </Link>
        </Card>

        <Card padding="medium" className="flex flex-col justify-between border-tutor-200/80 bg-tutor-50/20">
          <div>
            <p className="text-3xl font-bold text-role-tutor">—</p>
            <p className="text-base text-content-secondary mt-2">
              cơ hội mới phù hợp
            </p>
          </div>
          <Link
            href="/tutor/onboarding"
            className="text-sm font-semibold text-role-tutor hover:text-tutor-700 underline mt-4 inline-block transition-colors"
          >
            Hoàn thiện hồ sơ
          </Link>
        </Card>

        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-content-primary">0</p>
            <p className="text-base text-content-secondary mt-2">
              liên hệ cần theo dõi
            </p>
          </div>
          <a
            href="#contacts-section"
            className="text-sm font-medium text-brand hover:text-brand-hover underline mt-4 inline-block transition-colors"
          >
            Xem chi tiết
          </a>
        </Card>
      </div>

      {/* ----------------------------------------------------------------------
          GRID 2 CỘT CHÍNH
          Cột trái: Lịch dạy hôm nay & Việc cần làm (Trạng thái rỗng)
          Cột phải: Nhắc nhở hoàn thiện hồ sơ với 3 Checklist
      ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-content-primary">
                Lịch dạy hôm nay
              </h2>
              <Link
                href="/tutor/offers"
                className="text-sm font-medium text-brand hover:text-brand-hover underline transition-colors"
              >
                Xem lịch
              </Link>
            </div>
            <p className="text-sm text-content-muted mt-1">
              Thứ Ba, 27/10 · Chưa có buổi học nào
            </p>
          </div>

          {/* Box 1: Chưa có lịch dạy */}
          <Card padding="medium">
            <h3 className="font-bold text-base text-content-primary">
              Chưa có lịch dạy
            </h3>
            <p className="text-base text-content-secondary mt-1 leading-relaxed">
              Sau khi thêm học sinh, bạn có thể tạo buổi học và quản lý lịch dạy tại đây.
            </p>
          </Card>

          {/* Box 2: Chưa có học sinh */}
          <Card padding="medium">
            <h3 className="font-bold text-base text-content-primary">
              Chưa có học sinh
            </h3>
            <p className="text-base text-content-secondary mt-1 mb-4 leading-relaxed">
              Thêm học sinh bạn đã xác nhận nhận dạy để quản lý lịch học, nội dung và tiến độ.
            </p>
            <Button asChild variant="tutor" size="medium">
              <Link href="/tutor/teaching-classes">Thêm học sinh</Link>
            </Button>
          </Card>

          {/* Box 3: Việc cần làm */}
          <Card padding="medium">
            <h3 className="font-bold text-base text-content-primary mb-2">
              Việc cần làm
            </h3>
            <p className="text-base text-content-secondary leading-relaxed">
              Chưa có việc theo dõi buổi học hoặc liên hệ. Hoàn thiện hồ sơ để bắt đầu tìm cơ hội phù hợp.
            </p>
          </Card>
        </div>

        {/* CỘT PHẢI: NHẮC NHỞ HOÀN THIỆN HỒ SƠ */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-content-primary">
              Cơ hội phù hợp với bạn
            </h2>
            <p className="text-sm text-content-muted mt-1 leading-relaxed">
              Đề xuất sẽ xuất hiện sau khi bạn hoàn thiện hồ sơ. Chưa có cơ hội được đề xuất cho tài khoản này.
            </p>
          </div>

          <Card padding="large" className="space-y-5 border-tutor-200 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant="tutor" size="small" appearance="subtitle">
                    Cần hoàn thiện
                  </Badge>
                </div>
                <h3 className="font-bold text-lg text-tutor-900">
                  Hoàn thiện hồ sơ để nhận cơ hội phù hợp
                </h3>
                <p className="text-base text-content-secondary mt-1.5 leading-relaxed">
                  Bổ sung 3 thông tin dưới đây để TutorMatching hiểu nhu cầu giảng dạy của bạn.
                </p>
              </div>
            </div>

            {/* 3 Mục Checklist theo Wireframe 1 với variant Tutor */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="incomplete-step-subjects"
                  checked={steps.subjects}
                  onChange={(checked) =>
                    setSteps((prev) => ({ ...prev, subjects: checked }))
                  }
                  variant="tutor"
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="incomplete-step-subjects"
                    className="font-semibold text-base text-content-primary block cursor-pointer"
                  >
                    Môn dạy và khối lớp
                  </label>
                  <p className="text-base text-content-secondary mt-0.5">
                    Chọn môn học, khối lớp bạn có thể giảng dạy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="incomplete-step-locations"
                  checked={steps.locations}
                  onChange={(checked) =>
                    setSteps((prev) => ({ ...prev, locations: checked }))
                  }
                  variant="tutor"
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="incomplete-step-locations"
                    className="font-semibold text-base text-content-primary block cursor-pointer"
                  >
                    Khu vực nhận dạy
                  </label>
                  <p className="text-base text-content-secondary mt-0.5">
                    Chọn quận tại Hà Nội và hình thức dạy phù hợp.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="incomplete-step-times"
                  checked={steps.times}
                  onChange={(checked) =>
                    setSteps((prev) => ({ ...prev, times: checked }))
                  }
                  variant="tutor"
                  className="mt-1"
                />
                <div>
                  <label
                    htmlFor="incomplete-step-times"
                    className="font-semibold text-base text-content-primary block cursor-pointer"
                  >
                    Khung giờ có thể dạy
                  </label>
                  <p className="text-base text-content-secondary mt-0.5">
                    Cập nhật ngày và giờ bạn sẵn sàng nhận lớp.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border-default pt-4">
              <Button asChild variant="tutor" size="medium">
                <Link href="/tutor/onboarding">Hoàn thiện hồ sơ</Link>
              </Button>
            </div>
          </Card>

          <p className="text-sm text-content-muted leading-relaxed">
            Cơ hội là bài đăng tiềm năng từ Facebook, không phải học sinh đã nhận.
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          PHẦN DƯỚI: BẢNG "LIÊN HỆ CẦN THEO DÕI" (TRẠNG THÁI RỖNG)
      ---------------------------------------------------------------------- */}
      <section id="contacts-section" className="space-y-3 pt-2">
        <h2 className="text-lg font-bold text-content-primary">
          Liên hệ cần theo dõi
        </h2>

        <div className="border border-border-default rounded-xl overflow-hidden bg-surface-base shadow-2xs">
          <div className="grid grid-cols-12 gap-4 px-5 py-3.5 bg-surface-subtle border-b border-border-default text-sm font-semibold text-content-primary">
            <div className="col-span-3">Nhu cầu</div>
            <div className="col-span-2">Trạng thái</div>
            <div className="col-span-2">Lần liên hệ gần nhất</div>
            <div className="col-span-3">Việc tiếp theo</div>
            <div className="col-span-2 text-right sm:text-left">Thao tác</div>
          </div>

          <div className="p-8 text-left space-y-1.5">
            <h3 className="font-bold text-base text-content-primary">
              Chưa có liên hệ nào
            </h3>
            <p className="text-base text-content-secondary leading-relaxed">
              Khi bạn đánh dấu &ldquo;Đã liên hệ&rdquo; ở một cơ hội, liên hệ sẽ xuất hiện tại đây để theo dõi. Hiện chưa có lịch sử liên hệ.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default IncompleteProfileDashboard;
