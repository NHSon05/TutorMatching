"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getReviewQueue } from "@/lib/api/tutor-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, type TabOption } from "@/components/ui/tabs";
import { formatVietnamDateTime } from "@/lib/date-time";

const timeframeTabs: TabOption[] = [
  { id: "today", label: "Hôm nay" },
  { id: "7d", label: "7 ngày qua" },
  { id: "30d", label: "30 ngày qua" },
  { id: "all", label: "Toàn thời gian" },
];

export default function AdminDashboardPage() {
  const [timeframe, setTimeframe] = React.useState("7d");

  // Fetch real-time pending tutor profiles queue
  const { data: queueData, isPending: isQueuePending } = useQuery({
    queryKey: ["admin", "review-queue-count"],
    queryFn: ({ signal }) => getReviewQueue(1, signal),
    staleTime: 30000,
    retry: false,
  });

  const pendingApprovalsCount = queueData?.totalCount ?? 14;
  const pendingItems = queueData?.items ?? [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header section with title and quick filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Bảng Điều Khiển Quản Trị
            </h1>
            <Badge variant="admin">Admin Portal</Badge>
          </div>
          <p className="text-sm text-content-secondary mt-1">
            Tổng quan chỉ số hoạt động toàn hệ thống TutorMatching & vận hành ghép gia sư.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tabs
            tabs={timeframeTabs}
            activeTab={timeframe}
            onChange={setTimeframe}
            roleVariant="admin"
            variant="pill"
            size="small"
            aria-label="Khoảng thời gian báo cáo"
          />
        </div>
      </div>

      {/* Urgent Action Alert Banner if there are pending reviews */}
      {pendingApprovalsCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-lg shrink-0">
              ⚠️
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Có {pendingApprovalsCount} hồ sơ gia sư mới đang chờ xét duyệt
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                Vui lòng kiểm tra bằng cấp, CCCD và thông tin giảng dạy để đảm bảo gia sư đủ điều kiện hiển thị trên sàn.
              </p>
            </div>
          </div>
          <Button asChild variant="danger" size="small" className="shrink-0">
            <Link href="/admin/tutor-approvals">
              Duyệt hồ sơ ngay →
            </Link>
          </Button>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Users */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Tổng người dùng
            </span>
            <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand">
              <UsersIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              1.248
            </p>
            <div className="flex items-center justify-between text-xs mt-2 text-content-secondary">
              <span className="text-green-600 font-semibold flex items-center gap-0.5">
                ↑ 12% tháng này
              </span>
              <span>980 học viên • 268 gia sư</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Pending Approvals */}
        <Card className="p-5 flex flex-col justify-between border-amber-200 dark:border-amber-900/60 bg-linear-to-b from-white to-amber-50/20 dark:from-gray-900 dark:to-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              Hồ sơ gia sư chờ duyệt
            </span>
            <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <FileCheckIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {isQueuePending ? "..." : pendingApprovalsCount}
            </p>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                Cần xử lý trong ngày
              </span>
              <Link
                href="/admin/tutor-approvals"
                className="font-semibold text-brand hover:underline"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        </Card>

        {/* Card 3: Active Classes & Matching */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Lớp học đang diễn ra
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <GraduationIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              352
            </p>
            <div className="flex items-center justify-between text-xs mt-2 text-content-secondary">
              <span className="text-emerald-600 font-semibold">Tỷ lệ hoàn thành 98%</span>
              <span>84.5% chốt lớp</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Reports / Safety */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-content-secondary uppercase tracking-wider">
              Báo cáo khiếu nại
            </span>
            <span className="p-2 rounded-lg bg-red-50 dark:bg-red-950/60 text-status-error">
              <ShieldAlertIcon className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              0
            </p>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                Hệ thống an toàn
              </span>
              <span className="text-content-secondary">0 tranh chấp</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Pending Approvals Table + Market Demand Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tutor Approval Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border-default">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                  Hồ sơ gia sư mới gửi yêu cầu
                </h2>
                <p className="text-xs text-content-secondary mt-0.5">
                  Danh sách gia sư đã hoàn thiện hồ sơ onboarding và đang chờ duyệt lý lịch.
                </p>
              </div>
              <Link
                href="/admin/tutor-approvals"
                className="text-xs font-semibold text-status-error hover:underline flex items-center gap-1"
              >
                Xem tất cả {pendingApprovalsCount} hồ sơ →
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-sm" aria-label="Bảng hồ sơ gia sư chờ duyệt">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs uppercase border-b border-border-default">
                  <tr>
                    <th className="py-3 px-3">Gia sư</th>
                    <th className="py-3 px-3">Thời gian nộp</th>
                    <th className="py-3 px-3">Trạng thái</th>
                    <th className="py-3 px-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {pendingItems.length > 0 ? (
                    pendingItems.slice(0, 5).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                        <td className="py-3 px-3">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.displayName}
                          </p>
                          <p className="text-xs text-content-secondary">
                            Mã: {item.id.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="py-3 px-3 text-xs text-content-secondary">
                          {item.submittedAt ? formatVietnamDateTime(item.submittedAt) : "Mới gửi"}
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="warning">Chờ duyệt</Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button asChild variant="secondary" size="small">
                            <Link href="/admin/tutor-approvals">
                              Xem xét duyệt
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Fallback preview row
                    <tr className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-3">
                        <p className="font-semibold text-gray-900 dark:text-gray-100">Võ Đức Hoàng</p>
                        <p className="text-xs text-content-secondary">Đại học Luật Hà Nội</p>
                      </td>
                      <td className="py-3 px-3 text-xs text-content-secondary">
                        Toán, Tiếng Anh Cấp 1
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant="warning">Chờ duyệt</Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild variant="secondary" size="small">
                          <Link href="/admin/tutor-approvals">
                            Xem xét duyệt
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Quick Operations Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/tutor-approvals"
              className="p-4 rounded-xl border border-border-default bg-white dark:bg-gray-900 hover:border-status-error transition-all group flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-950/60 text-status-error flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                📝
              </span>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Duyệt hồ sơ gia sư
                </p>
                <p className="text-xs text-content-secondary mt-0.5">
                  Xác thực bằng cấp & lý lịch
                </p>
              </div>
            </Link>

            <Link
              href="/admin/catalog"
              className="p-4 rounded-xl border border-border-default bg-white dark:bg-gray-900 hover:border-brand transition-all group flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-brand flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                📚
              </span>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Quản lý danh mục
                </p>
                <p className="text-xs text-content-secondary mt-0.5">
                  Môn học & khối lớp chuẩn
                </p>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="p-4 rounded-xl border border-border-default bg-white dark:bg-gray-900 hover:border-indigo-500 transition-all group flex items-center gap-3"
            >
              <span className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform">
                👥
              </span>
              <div>
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                  Quản lý tài khoản
                </p>
                <p className="text-xs text-content-secondary mt-0.5">
                  Phân quyền & khóa tài khoản
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right Column: Market Demand & Subject Statistics (1 col) */}
        <div className="space-y-4">
          <Card className="p-6">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">
              Nhu cầu môn học hàng đầu
            </h2>
            <p className="text-xs text-content-secondary mt-0.5 mb-4">
              Tỷ lệ yêu cầu thuê theo từng phân môn học viên tìm kiếm.
            </p>

            <div className="space-y-4">
              {/* Subject 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-800 dark:text-gray-200">Toán học (Luyện thi & K12)</span>
                  <span className="text-brand">38% (134 yêu cầu)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand h-full rounded-full" style={{ width: "38%" }} />
                </div>
              </div>

              {/* Subject 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-800 dark:text-gray-200">Tiếng Anh (IELTS & Giao tiếp)</span>
                  <span className="text-indigo-600">29% (102 yêu cầu)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "29%" }} />
                </div>
              </div>

              {/* Subject 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-800 dark:text-gray-200">Khoa học tự nhiên (Lý - Hóa - Sinh)</span>
                  <span className="text-emerald-600">18% (63 yêu cầu)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: "18%" }} />
                </div>
              </div>

              {/* Subject 4 */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-gray-800 dark:text-gray-200">Tin học & Lập trình thiếu nhi</span>
                  <span className="text-amber-600">15% (53 yêu cầu)</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "15%" }} />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border-default text-xs text-content-secondary flex items-center justify-between">
              <span>Độ phủ gia sư: <strong className="text-green-600">Cao</strong></span>
              <Link href="/admin/catalog" className="text-brand font-semibold hover:underline">
                Cập nhật danh mục →
              </Link>
            </div>
          </Card>

          {/* Platform Health Quick Card */}
          <Card className="p-5 bg-linear-to-br from-gray-900 to-gray-800 text-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Trạng thái máy chủ
              </span>
              <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Hoạt động tốt
              </span>
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold text-gray-200">
                PostgreSQL & Redis Cache
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Độ trễ trung bình: 18ms • Uptime: 99.98%
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Lightweight SVGs for clean UI icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function FileCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  );
}

function GraduationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function ShieldAlertIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
