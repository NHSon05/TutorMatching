"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/lib/api/admin-dashboard";
import { getReviewQueue } from "@/lib/api/tutor-reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BookOpenIcon,
  FileCheckIcon,
  GraduationCapIcon,
  RequestIcon,
  UsersIcon,
} from "@/components/icons";
import { formatVietnamDateTime } from "@/lib/date-time";

const numberFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", {
  style: "percent",
  maximumFractionDigits: 1,
});
const BAR_COLORS = [
  "bg-brand",
  "bg-admin-500",
  "bg-status-success",
  "bg-status-warning",
  "bg-status-info",
];
const TEXT_COLORS = [
  "text-brand",
  "text-admin-600",
  "text-status-success",
  "text-status-warning",
  "text-status-info",
];

const fmt = (value: number) => numberFormat.format(value);
const share = (part: number, total: number) =>
  total > 0 ? percentFormat.format(part / total) : "—";

export default function AdminDashboard() {
  const dashboard = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => getAdminDashboard(signal),
    staleTime: 30_000,
  });
  const queue = useQuery({
    queryKey: ["admin", "review-queue-count"],
    queryFn: ({ signal }) => getReviewQueue(1, signal),
    staleTime: 30_000,
  });

  const snapshot = dashboard.data;
  const users = snapshot?.usersByRole;
  const profiles = snapshot?.tutorProfilesByStatus;
  const requests = snapshot?.hireRequestsByStatus;
  const totalUsers = users ? users.LEARNER + users.TUTOR + users.ADMIN : 0;
  const totalRequests = requests
    ? Object.values(requests).reduce((sum, count) => sum + count, 0)
    : 0;
  const pendingReviews = queue.data?.totalCount ?? 0;
  const loading = dashboard.isPending;
  const show = (value: number | undefined) =>
    loading || value === undefined ? "—" : fmt(value);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-border-default pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-content-primary">
              Bảng Điều Khiển Quản Trị
            </h1>
            <Badge variant="admin">Admin Portal</Badge>
          </div>
          <p className="mt-1 text-sm text-content-secondary">
            Tổng quan chỉ số hoạt động toàn hệ thống Edora & vận hành ghép gia
            sư.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-content-secondary">
          {snapshot && (
            <span>
              Cập nhật lúc{" "}
              <time dateTime={snapshot.asOf}>
                {formatVietnamDateTime(snapshot.asOf)}
              </time>
            </span>
          )}
          <Button
            variant="tertiary"
            size="small"
            isLoading={dashboard.isFetching || queue.isFetching}
            onClick={() => {
              void dashboard.refetch();
              void queue.refetch();
            }}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {dashboard.isError && (
        <Card padding="small" className="border-status-error">
          <p role="alert" className="text-sm text-status-error">
            Không thể tải số liệu bảng điều khiển.
          </p>
          <Button
            size="small"
            className="mt-2"
            onClick={() => void dashboard.refetch()}
          >
            Thử lại
          </Button>
        </Card>
      )}

      {pendingReviews > 0 && (
        <div className="flex flex-col justify-between gap-3 rounded-xl border border-status-warning/40 bg-status-warning-bg p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-status-warning/15 text-status-warning">
              <AlertTriangleIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-status-warning-dark">
                Có {fmt(pendingReviews)} hồ sơ gia sư mới đang chờ xét duyệt
              </p>
              <p className="mt-0.5 text-xs text-status-warning-dark/80">
                Vui lòng kiểm tra bằng cấp, CCCD và thông tin giảng dạy để đảm
                bảo gia sư đủ điều kiện hiển thị trên sàn.
              </p>
            </div>
          </div>
          <Button
            asChild
            variant="danger"
            size="small"
            className="shrink-0"
            trailingIcon={<ArrowRightIcon className="h-4 w-4" />}
          >
            <Link href="/admin/tutor-approvals">Duyệt hồ sơ ngay</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng người dùng"
          value={show(users ? totalUsers : undefined)}
          icon={<UsersIcon className="h-4 w-4" />}
          iconClass="bg-brand-50 text-brand"
          footer={
            users && (
              <span>
                {fmt(users.LEARNER)} học viên • {fmt(users.TUTOR)} gia sư •{" "}
                {fmt(users.ADMIN)} quản trị
              </span>
            )
          }
        />
        <StatCard
          label="Hồ sơ gia sư chờ duyệt"
          value={show(profiles?.PENDING_REVIEW)}
          tone="warning"
          icon={<FileCheckIcon className="h-4 w-4" />}
          iconClass="bg-status-warning/15 text-status-warning"
          footer={
            profiles && (
              <>
                <span>{fmt(profiles.APPROVED)} hồ sơ đã duyệt</span>
                <Link
                  href="/admin/tutor-approvals"
                  className="font-semibold text-brand hover:underline"
                >
                  Xem chi tiết
                </Link>
              </>
            )
          }
        />
        <StatCard
          label="Lớp học đang diễn ra"
          value={show(requests?.ACCEPTED)}
          tone="success"
          icon={<GraduationCapIcon className="h-4 w-4" />}
          iconClass="bg-status-success-bg text-status-success"
          footer={
            requests && (
              <>
                <span className="font-semibold text-status-success">
                  {fmt(requests.COMPLETED)} đã hoàn thành
                </span>
                <span>
                  {share(requests.ACCEPTED + requests.COMPLETED, totalRequests)}{" "}
                  chốt lớp
                </span>
              </>
            )
          }
        />
        <StatCard
          label="Yêu cầu thuê chờ xử lý"
          value={show(
            requests ? requests.PENDING + requests.NEGOTIATING : undefined
          )}
          icon={<RequestIcon variant="inbox" className="h-4 w-4" />}
          iconClass="bg-admin-50 text-admin-600"
          footer={
            requests && (
              <span>
                {fmt(requests.PENDING)} chờ phản hồi •{" "}
                {fmt(requests.NEGOTIATING)} đang thương lượng
              </span>
            )
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padding="medium">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default pb-4">
              <div>
                <h2 className="text-base font-bold text-content-primary">
                  Hồ sơ gia sư mới gửi yêu cầu
                </h2>
                <p className="mt-0.5 text-xs text-content-secondary">
                  Danh sách gia sư đã hoàn thiện hồ sơ onboarding và đang chờ
                  duyệt lý lịch.
                </p>
              </div>
              <Link
                href="/admin/tutor-approvals"
                className="flex items-center gap-1 text-xs font-semibold text-status-error hover:underline"
              >
                Xem tất cả {fmt(pendingReviews)} hồ sơ
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table
                className="w-full text-left text-sm"
                aria-label="Bảng hồ sơ gia sư chờ duyệt"
              >
                <thead className="border-b border-border-default bg-surface-muted text-xs uppercase text-content-secondary">
                  <tr>
                    <th className="px-3 py-3">Gia sư</th>
                    <th className="px-3 py-3">Thời gian nộp</th>
                    <th className="px-3 py-3">Trạng thái</th>
                    <th className="px-3 py-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {queue.isPending ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center"
                        role="status"
                      >
                        Đang tải hồ sơ chờ duyệt...
                      </td>
                    </tr>
                  ) : queue.isError ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center">
                        <span role="alert" className="text-status-error">
                          Không thể tải hàng đợi duyệt hồ sơ.
                        </span>
                      </td>
                    </tr>
                  ) : queue.data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-content-secondary"
                      >
                        Không có hồ sơ nào đang chờ duyệt.
                      </td>
                    </tr>
                  ) : (
                    queue.data.items.slice(0, 5).map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-3">
                          <p className="font-semibold text-content-primary">
                            {item.displayName}
                          </p>
                          <p className="text-xs text-content-secondary">
                            Mã: {item.id.slice(0, 8)}...
                          </p>
                        </td>
                        <td className="px-3 py-3 text-xs text-content-secondary">
                          {item.submittedAt
                            ? formatVietnamDateTime(item.submittedAt)
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="warning" shape="pill">
                            Chờ duyệt
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Button asChild variant="tertiary" size="small">
                            <Link href="/admin/tutor-approvals">
                              Xem xét duyệt
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickLink
              href="/admin/tutor-approvals"
              icon={<FileCheckIcon className="h-5 w-5" />}
              iconClass="bg-status-error-bg text-status-error"
              title="Duyệt hồ sơ gia sư"
              description="Xác thực bằng cấp & lý lịch"
            />
            <QuickLink
              href="/admin/catalog"
              icon={<BookOpenIcon className="h-5 w-5" />}
              iconClass="bg-brand-50 text-brand"
              title="Quản lý danh mục"
              description="Môn học & khối lớp chuẩn"
            />
            <QuickLink
              href="/admin/users"
              icon={<UsersIcon className="h-5 w-5" />}
              iconClass="bg-admin-50 text-admin-600"
              title="Quản lý tài khoản"
              description="Tìm kiếm & khóa tài khoản"
            />
          </div>
        </div>

        <Card padding="medium" className="h-fit">
          <h2 className="text-base font-bold text-content-primary">
            Nhu cầu môn học hàng đầu
          </h2>
          <p className="mb-4 mt-0.5 text-xs text-content-secondary">
            Tỷ lệ yêu cầu thuê theo từng môn học trên tổng số yêu cầu.
          </p>
          {loading ? (
            <p role="status" className="text-sm text-content-secondary">
              Đang tải...
            </p>
          ) : !snapshot || snapshot.topSubjects.length === 0 ? (
            <p className="text-sm text-content-secondary">
              Chưa có yêu cầu thuê gia sư nào.
            </p>
          ) : (
            <ul className="space-y-4" aria-label="Nhu cầu theo môn học">
              {snapshot.topSubjects.map((subject, index) => {
                const ratio =
                  totalRequests > 0 ? subject.requestCount / totalRequests : 0;
                return (
                  <li key={subject.subjectId}>
                    <div className="mb-1 flex justify-between gap-3 text-xs font-semibold">
                      <span className="text-content-primary">
                        {subject.name}
                      </span>
                      <span
                        className={`shrink-0 ${TEXT_COLORS[index % TEXT_COLORS.length]}`}
                      >
                        {share(subject.requestCount, totalRequests)} (
                        {fmt(subject.requestCount)} yêu cầu)
                      </span>
                    </div>
                    <div
                      className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
                      role="progressbar"
                      aria-label={subject.name}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(ratio * 100)}
                    >
                      <div
                        className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-6 flex items-center justify-between border-t border-border-default pt-4 text-xs text-content-secondary">
            <span>
              Tổng:{" "}
              <strong className="text-content-primary">
                {show(snapshot ? totalRequests : undefined)}
              </strong>{" "}
              yêu cầu thuê
            </span>
            <Link
              href="/admin/catalog"
              className="flex items-center gap-1 font-semibold text-brand hover:underline"
            >
              Cập nhật danh mục
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
  footer,
  tone,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  iconClass: string;
  footer?: ReactNode;
  tone?: "warning" | "success";
}) {
  const accent =
    tone === "warning"
      ? "text-status-warning"
      : tone === "success"
        ? "text-status-success"
        : "text-content-primary";
  return (
    <Card
      padding="small"
      className={`flex flex-col justify-between ${tone === "warning" ? "border-status-warning/40 bg-status-warning-bg/40" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${tone === "warning" ? "text-status-warning-dark" : "text-content-secondary"}`}
        >
          {label}
        </span>
        <span className={`rounded-lg p-2 ${iconClass}`}>{icon}</span>
      </div>
      <div className="mt-3">
        <p className={`text-3xl font-extrabold tracking-tight ${accent}`}>
          {value}
        </p>
        <div className="mt-2 flex min-h-4 items-center justify-between gap-2 text-xs text-content-secondary">
          {footer}
        </div>
      </div>
    </Card>
  );
}

function QuickLink({
  href,
  icon,
  iconClass,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card
        padding="small"
        hoverable
        className="flex h-full items-center gap-3"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${iconClass}`}
        >
          {icon}
        </span>
        <div>
          <p className="text-sm font-semibold text-content-primary">{title}</p>
          <p className="mt-0.5 text-xs text-content-secondary">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
