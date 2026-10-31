"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { IconButton } from "@/components/ui/icon-button";
import type { AccountResponse } from "@/lib/api/auth";

function BellIcon({
  className = "w-5 h-5 text-content-primary",
}: {
  className?: string;
}) {
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

function MoreHorizontalIcon({
  className = "w-5 h-5 text-content-secondary",
}: {
  className?: string;
}) {
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
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

function ChevronDownIcon({
  className = "w-4 h-4 text-content-secondary ml-1.5",
}: {
  className?: string;
}) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export interface CompletedProfileDashboardProps {
  account?: AccountResponse | null;
}

export function CompletedProfileDashboard({
  account,
}: CompletedProfileDashboardProps) {
  const tutorDisplayName = account?.fullName
    ? account.fullName.split(" ").slice(-1)[0]
    : "Minh";

  const [todoTasks, setTodoTasks] = React.useState({
    task1: false,
    task2: false,
  });

  const [savedOpportunities, setSavedOpportunities] = React.useState<
    Record<string, boolean>
  >({
    opp1: false,
    opp2: true, // Wireframe 2: Bài Vật lý 10 là "Đã lưu"
    opp3: false,
  });

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------------------------
          HEADER KHU VỰC TỔNG QUAN (WIREFRAME 2)
      ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-content-primary">
            Tổng quan
          </h1>
          <p className="text-base text-content-secondary mt-1">
            Chào {tutorDisplayName}, hôm nay bạn có 2 buổi học
          </p>
        </div>

        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="text-right">
            <p className="text-base font-semibold text-content-primary">
              27/10/2026
            </p>
            <p className="text-sm font-medium text-content-secondary">
              Thứ Ba · 18:45
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

          <div
            title={`Gia sư ${account?.fullName || "Minh"}`}
            className="w-11 h-11 rounded-full border border-tutor-200 bg-tutor-50 flex items-center justify-center font-bold text-sm text-tutor-900 select-none shadow-2xs"
          >
            MN
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          4 THẺ THỐNG KÊ (METRIC CARDS) - ÁP DỤNG MÀU TUTOR & BRAND
      ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-role-tutor">12</p>
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
            <p className="text-3xl font-bold text-role-tutor">2</p>
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

        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-brand">8</p>
            <p className="text-base text-content-secondary mt-2">
              cơ hội mới phù hợp
            </p>
          </div>
          <Link
            href="/tutors"
            className="text-sm font-medium text-brand hover:text-brand-hover underline mt-4 inline-block transition-colors"
          >
            Xem chi tiết
          </Link>
        </Card>

        <Card padding="medium" className="flex flex-col justify-between">
          <div>
            <p className="text-3xl font-bold text-role-tutor">3</p>
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
          Cột trái: Lịch dạy hôm nay & Việc cần làm
          Cột phải: Cơ hội phù hợp với bạn
      ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ====================================================================
            CỘT TRÁI (LỊCH DẠY & VIỆC CẦN LÀM)
        ==================================================================== */}
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
              Thứ Ba, 27/10 · 1 buổi đã hoàn thành, 1 buổi sắp diễn ra
            </p>
          </div>

          {/* Card Buổi 1: Đã hoàn thành */}
          <Card padding="medium" className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-content-primary">
                17:00–18:30
              </span>
              <Badge variant="success" appearance="subtitle" size="small">
                Đã hoàn thành
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-base text-content-primary">
                Hoàng Nam
              </h3>
              <p className="text-sm text-content-secondary">
                Vật lý 10 · Trực tiếp
              </p>
            </div>

            <p className="text-base text-content-primary leading-relaxed">
              Nội dung đã học: Ôn chuyển động thẳng biến đổi đều; chữa 5 bài tập
              về gia tốc.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button variant="secondary" size="small">
                Xem buổi học
              </Button>
              <Button variant="secondary" size="small">
                Ghi chú buổi học
              </Button>
            </div>
          </Card>

          {/* Card Buổi 2: Sắp diễn ra */}
          <Card
            padding="medium"
            className="space-y-3 border-tutor-200 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-base text-content-primary">
                19:00–20:30
              </span>
              <Badge variant="tutor" appearance="subtitle" size="small">
                Sắp diễn ra · còn 15 phút
              </Badge>
            </div>

            <div>
              <h3 className="font-bold text-base text-content-primary">
                Minh Anh
              </h3>
              <p className="text-sm text-content-secondary">Toán 9 · Online</p>
            </div>

            <p className="text-base text-content-primary leading-relaxed">
              Nội dung dự kiến: Rút gọn căn thức bậc hai; luyện 6 bài vận dụng
              và kiểm tra bài về nhà.
            </p>

            <div className="pt-1">
              <Button variant="tutor" size="small">
                Xem buổi học
              </Button>
            </div>
          </Card>

          {/* Box: Việc cần làm */}
          <Card padding="medium">
            <h3 className="font-bold text-base text-content-primary mb-3">
              Việc cần làm
            </h3>

            <div className="space-y-4">
              {/* Task 1 */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="task-minh-anh"
                  checked={todoTasks.task1}
                  onChange={(checked) =>
                    setTodoTasks((prev) => ({ ...prev, task1: checked }))
                  }
                  variant="tutor"
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="task-minh-anh"
                    className={`text-base font-semibold block cursor-pointer ${
                      todoTasks.task1
                        ? "line-through text-content-muted"
                        : "text-content-primary"
                    }`}
                  >
                    Cập nhật tiến độ học của Minh Anh
                  </label>
                  <p className="text-sm text-content-secondary mt-0.5">
                    Sau buổi học lúc 19:00 hôm nay
                  </p>
                  <Link
                    href="/tutor/teaching-classes"
                    className="text-sm font-medium text-brand hover:text-brand-hover underline mt-1 inline-block"
                  >
                    Cập nhật tiến độ
                  </Link>
                </div>
              </div>

              <div className="border-t border-border-subtle" />

              {/* Task 2 */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="task-bao-ngoc"
                  checked={todoTasks.task2}
                  onChange={(checked) =>
                    setTodoTasks((prev) => ({ ...prev, task2: checked }))
                  }
                  variant="tutor"
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="task-bao-ngoc"
                    className={`text-base font-semibold block cursor-pointer ${
                      todoTasks.task2
                        ? "line-through text-content-muted"
                        : "text-content-primary"
                    }`}
                  >
                    Xác nhận lịch học thử với phụ huynh Bảo Ngọc
                  </label>
                  <p className="text-sm text-content-secondary mt-0.5">
                    Dự kiến 28/10, 18:00 · Chưa xác nhận
                  </p>
                  <a
                    href="#contacts-section"
                    className="text-sm font-medium text-brand hover:text-brand-hover underline mt-1 inline-block"
                  >
                    Mở liên hệ
                  </a>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ====================================================================
            CỘT PHẢI (CƠ HỘI PHÙ HỢP VỚI BẠN)
        ==================================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-content-primary">
                Cơ hội phù hợp với bạn
              </h2>
              <Link
                href="/tutors"
                className="text-sm font-medium text-brand hover:text-brand-hover underline transition-colors"
              >
                Xem tất cả
              </Link>
            </div>
            <p className="text-sm text-content-muted mt-1 leading-relaxed">
              Bài đăng tiềm năng từ Facebook, không phải học sinh đã nhận. Phù
              hợp với Toán, Vật lý - khu vực Cầu Giấy.
            </p>
          </div>

          {/* Bộ lọc Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="small" shape="rounded">
              <span>Môn học</span>
              <ChevronDownIcon />
            </Button>
            <Button variant="secondary" size="small" shape="rounded">
              <span>Khu vực</span>
              <ChevronDownIcon />
            </Button>
            <Button variant="secondary" size="small" shape="rounded">
              <span>Hình thức</span>
              <ChevronDownIcon />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Cơ hội 1: Toán lớp 9 */}
            <Card padding="medium" className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-content-primary">
                  Tìm gia sư Toán lớp 9
                </h3>
                <Badge variant="brand" appearance="subtitle" size="small">
                  Mới
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-content-secondary">
                <p>Cầu Giấy, Hà Nội · Trực tiếp</p>
                <p>Tần suất: 2 buổi/tuần · Ngân sách: 200.000–250.000đ/buổi</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="tutor" appearance="outline" size="small">
                  Đúng môn
                </Badge>
                <Badge variant="brand" appearance="outline" size="small">
                  Gần bạn
                </Badge>
              </div>

              <p className="text-base text-content-primary italic leading-relaxed">
                &ldquo;Cần gia sư củng cố đại số, ôn thi vào lớp 10. Ưu tiên dạy
                buổi tối trong tuần.&rdquo;
              </p>

              <p className="text-xs text-content-muted">
                Facebook · Gia sư Hà Nội · 1 giờ trước
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="small">
                    Xem bài gốc
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      setSavedOpportunities((prev) => ({
                        ...prev,
                        opp1: !prev.opp1,
                      }))
                    }
                  >
                    {savedOpportunities.opp1 ? "Đã lưu" : "Lưu"}
                  </Button>
                </div>
                <IconButton
                  variant="secondary"
                  size="small"
                  shape="rounded"
                  aria-label="Tùy chọn khác"
                >
                  <MoreHorizontalIcon className="w-4 h-4 text-content-primary" />
                </IconButton>
              </div>
            </Card>

            {/* Cơ hội 2: Vật lý lớp 10 */}
            <Card padding="medium" className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-content-primary">
                  Tìm gia sư Vật lý lớp 10
                </h3>
                <Badge variant="tutor" appearance="subtitle" size="small">
                  Đã lưu
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-content-secondary">
                <p>Nam Từ Liêm, Hà Nội · Online</p>
                <p>Tần suất: 2 buổi/tuần · Ngân sách: Chưa rõ</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="tutor" appearance="outline" size="small">
                  Đúng môn
                </Badge>
              </div>

              <p className="text-base text-content-primary italic leading-relaxed">
                &ldquo;Cần hỗ trợ phần động học và luyện bài tập cơ bản. Có thể
                học trực tuyến buổi tối.&rdquo;
              </p>

              <p className="text-xs text-content-muted">
                Facebook · Tìm gia sư tại Hà Nội · 3 giờ trước
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="small">
                    Xem bài gốc
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      setSavedOpportunities((prev) => ({
                        ...prev,
                        opp2: !prev.opp2,
                      }))
                    }
                  >
                    {savedOpportunities.opp2 ? "Đã lưu" : "Lưu"}
                  </Button>
                </div>
                <IconButton
                  variant="secondary"
                  size="small"
                  shape="rounded"
                  aria-label="Tùy chọn khác"
                >
                  <MoreHorizontalIcon className="w-4 h-4 text-content-primary" />
                </IconButton>
              </div>
            </Card>

            {/* Cơ hội 3: Toán lớp 8 */}
            <Card padding="medium" className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-content-primary">
                  Tìm gia sư Toán lớp 8
                </h3>
                <Badge variant="gray" appearance="subtitle" size="small">
                  Đã liên hệ
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-content-secondary">
                <p>Cầu Giấy, Hà Nội · Trực tiếp</p>
                <p>Tần suất: Chưa rõ · Ngân sách: 180.000–220.000đ/buổi</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="tutor" appearance="outline" size="small">
                  Đúng môn
                </Badge>
                <Badge variant="brand" appearance="outline" size="small">
                  Gần bạn
                </Badge>
              </div>

              <p className="text-base text-content-primary italic leading-relaxed">
                &ldquo;Tìm người kèm Toán căn bản, kiên nhẫn, có kế hoạch theo
                tuần. Lịch học sẽ trao đổi thêm.&rdquo;
              </p>

              <p className="text-xs text-content-muted">
                Facebook · Gia sư Hà Nội · 5 giờ trước
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="small">
                    Xem bài gốc
                  </Button>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() =>
                      setSavedOpportunities((prev) => ({
                        ...prev,
                        opp3: !prev.opp3,
                      }))
                    }
                  >
                    {savedOpportunities.opp3 ? "Đã lưu" : "Lưu"}
                  </Button>
                </div>
                <IconButton
                  variant="secondary"
                  size="small"
                  shape="rounded"
                  aria-label="Tùy chọn khác"
                >
                  <MoreHorizontalIcon className="w-4 h-4 text-content-primary" />
                </IconButton>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------------
          PHẦN DƯỚI: BẢNG "LIÊN HỆ CẦN THEO DÕI" (WIREFRAME 2)
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

          <div>
            {/* Row 1: Toán 8 · Cầu Giấy */}
            <div className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border-subtle items-center hover:bg-surface-subtle/60 transition-colors">
              <div className="col-span-3">
                <h4 className="font-bold text-base text-content-primary">
                  Toán 8 · Cầu Giấy
                </h4>
                <p className="text-sm text-content-secondary mt-0.5">
                  Trực tiếp · 2 buổi/tuần
                </p>
              </div>
              <div className="col-span-2">
                <Badge variant="gray" appearance="subtitle" size="small">
                  Đã liên hệ
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-content-secondary">
                27/10/2026 · 14:20
              </div>
              <div className="col-span-3 text-base text-content-primary leading-relaxed">
                Chờ phản hồi; nhắn lại vào 28/10 nếu chưa có trả lời.
              </div>
              <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button variant="secondary" size="small">
                  Cập nhật
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled
                  className="opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-border-default"
                >
                  Chuyển thành học sinh
                </Button>
              </div>
            </div>

            {/* Row 2: Toán 9 · Bảo Ngọc */}
            <div className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border-subtle items-center hover:bg-surface-subtle/60 transition-colors">
              <div className="col-span-3">
                <h4 className="font-bold text-base text-content-primary">
                  Toán 9 · Bảo Ngọc
                </h4>
                <p className="text-sm text-content-secondary mt-0.5">
                  Phụ huynh đang trao đổi
                </p>
              </div>
              <div className="col-span-2">
                <Badge variant="warning" appearance="subtitle" size="small">
                  Đang trao đổi
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-content-secondary">
                27/10/2026 · 16:10
              </div>
              <div className="col-span-3 text-base text-content-primary leading-relaxed">
                Xác nhận với phụ huynh lịch học thử dự kiến 28/10, 18:00.
              </div>
              <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button variant="secondary" size="small">
                  Cập nhật
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled
                  className="opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-border-default"
                >
                  Chuyển thành học sinh
                </Button>
              </div>
            </div>

            {/* Row 3: Vật lý 10 · Thanh Xuân */}
            <div className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border-subtle items-center hover:bg-surface-subtle/60 transition-colors">
              <div className="col-span-3">
                <h4 className="font-bold text-base text-content-primary">
                  Vật lý 10 · Thanh Xuân
                </h4>
                <p className="text-sm text-content-secondary mt-0.5">
                  Trực tiếp · Học thử
                </p>
              </div>
              <div className="col-span-2">
                <Badge variant="tutor" appearance="subtitle" size="small">
                  Đã hẹn học thử
                </Badge>
              </div>
              <div className="col-span-2 text-sm text-content-secondary">
                26/10/2026 · 20:15
              </div>
              <div className="col-span-3 text-base text-content-primary leading-relaxed">
                Dạy thử 29/10, 19:00; chuẩn bị bài kiểm tra đầu vào.
              </div>
              <div className="col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <Button variant="secondary" size="small">
                  Xem lịch học thử
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled
                  className="opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-border-default"
                >
                  Chuyển thành học sinh
                </Button>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-surface-subtle text-sm text-content-muted leading-relaxed">
              Chỉ chuyển thành học sinh khi đã xác nhận nhận học. Cả 3 liên hệ
              chưa đủ điều kiện; đã hẹn học thử không đồng nghĩa với đã nhận
              học.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CompletedProfileDashboard;
