"use client";

import Link from "next/link";
import {
  IN_PROGRESS_PAGE_SIZE,
  useInProgressHires,
} from "@/hooks/use-in-progress-hires";
import type { HireDetail, HireSummary } from "@/lib/api/hire-requests";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const dayNames: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};
const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};
const paymentInfo: Record<string, { label: string; variant: BadgeVariant }> = {
  PAID: { label: "Đã thanh toán", variant: "success" },
  PENDING: { label: "Đang chờ thanh toán", variant: "warning" },
  UNPAID: { label: "Chưa thanh toán", variant: "gray" },
};

const formatVnd = (amount: number) =>
  `${new Intl.NumberFormat("vi-VN").format(amount)}đ/buổi`;
const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : isoDate;
};

export function MyTutorsClient() {
  const { list, items, details } = useInProgressHires();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            Gia sư của tôi
          </h1>
          <p className="mt-1 text-base text-content-secondary">
            Các gia sư đang nhận dạy kèm cho bạn.
          </p>
        </div>
        <Link
          href="/tutors"
          className="text-base font-medium text-brand hover:underline"
        >
          Tìm thêm gia sư →
        </Link>
      </div>

      {list.isPending ? (
        <div
          role="status"
          aria-label="Đang tải danh sách gia sư"
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
      ) : list.isError ? (
        <Card className="space-y-3">
          <p role="alert" className="text-status-error">
            Không thể tải danh sách gia sư của bạn.
          </p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <Card className="space-y-3 text-center">
          <h2 className="font-semibold text-content-primary">
            Bạn chưa có gia sư nào đang dạy
          </h2>
          <p className="text-content-secondary">
            Khi gia sư chấp nhận yêu cầu thuê, họ sẽ xuất hiện tại đây.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="brand">
              <Link href="/tutors">Tìm gia sư</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/learner/requests">Xem yêu cầu đã gửi</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item, index) => (
              <li key={item.id}>
                <TutorHireCard
                  summary={item}
                  detail={details[index]?.data}
                  isDetailLoading={details[index]?.isPending ?? true}
                  isDetailError={details[index]?.isError ?? false}
                />
              </li>
            ))}
          </ul>
          {list.data?.nextCursor && (
            <p className="text-sm text-content-secondary">
              Bạn có nhiều hơn {IN_PROGRESS_PAGE_SIZE} gia sư đang dạy.{" "}
              <Link href="/learner/requests" className="text-brand underline">
                Xem tất cả yêu cầu
              </Link>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function TutorHireCard({
  summary,
  detail,
  isDetailLoading,
  isDetailError,
}: {
  summary: HireSummary;
  detail?: HireDetail;
  isDetailLoading: boolean;
  isDetailError: boolean;
}) {
  const terms = detail?.finalAgreement?.terms ?? detail?.currentTerms;
  const payment = detail?.paymentStatus
    ? paymentInfo[detail.paymentStatus]
    : undefined;

  return (
    <Card className="flex h-full flex-col justify-between gap-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-content-primary">
            {summary.tutor.displayName}
          </h2>
          <Badge variant="success" appearance="subtitle" size="small">
            Đang học
          </Badge>
        </div>

        {isDetailLoading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : isDetailError || !terms ? (
          <p className="text-sm text-content-secondary">
            Không tải được chi tiết lịch học.
          </p>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-content-secondary">Bắt đầu</dt>
            <dd className="text-content-primary">
              {formatDate(terms.startDate)}
            </dd>
            <dt className="text-content-secondary">Lịch học</dt>
            <dd className="text-content-primary">
              {terms.sessionsPerWeek} buổi/tuần · {terms.durationMinutes}{" "}
              phút/buổi
            </dd>
            <dt className="text-content-secondary">Hình thức</dt>
            <dd className="text-content-primary">
              {modeNames[terms.teachingMode] ?? terms.teachingMode}
            </dd>
            <dt className="text-content-secondary">Học phí</dt>
            <dd className="font-semibold text-content-primary">
              {formatVnd(terms.priceVnd)}
            </dd>
            {terms.schedules.length > 0 && (
              <>
                <dt className="text-content-secondary">Khung giờ</dt>
                <dd className="text-content-primary">
                  {terms.schedules
                    .map(
                      (s) =>
                        `${dayNames[s.dayOfWeek] ?? `Thứ ${s.dayOfWeek}`} ${s.startTime}–${s.endTime}`
                    )
                    .join(", ")}
                </dd>
              </>
            )}
          </dl>
        )}

        {payment && (
          <Badge variant={payment.variant} appearance="outline" size="small">
            {payment.label}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border-default pt-3">
        <Button
          asChild
          variant="brand"
          size="small"
          className="flex-1"
          disabled={!detail?.conversationId}
        >
          <Link
            href={
              detail?.conversationId
                ? `/messages?conversationId=${detail.conversationId}`
                : "/messages"
            }
          >
            Nhắn tin
          </Link>
        </Button>
        <Button asChild variant="secondary" size="small" className="flex-1">
          <Link href={`/learner/requests/${summary.id}`}>Xem chi tiết</Link>
        </Button>
      </div>
    </Card>
  );
}
