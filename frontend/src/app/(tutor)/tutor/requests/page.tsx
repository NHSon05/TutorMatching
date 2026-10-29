"use client";

import * as React from "react";
import Link from "next/link";
import { useHireRequests } from "@/hooks/use-hire-requests";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Chờ phản hồi", variant: "warning" },
  NEGOTIATING: { label: "Đang thương lượng", variant: "brand" },
  ACCEPTED: { label: "Đã chấp nhận", variant: "success" },
  REJECTED: { label: "Đã từ chối", variant: "error" },
  CANCELLED: { label: "Đã hủy", variant: "gray" },
  COMPLETED: { label: "Đã hoàn thành", variant: "success" },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function TutorRequestsPage() {
  const [cursors, setCursors] = React.useState<(string | undefined)[]>([undefined]);
  const cursor = cursors[cursors.length - 1];
  const { data, isLoading, isError, error, refetch } = useHireRequests({ cursor });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">
            Yêu cầu thuê gia sư
          </h1>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý các yêu cầu học và phản hồi từ học viên gửi đến bạn
          </p>
        </div>
        <Button variant="secondary" size="small" onClick={() => refetch()}>
          Tải lại
        </Button>
      </div>

      {cursors.length > 1 && (
        <nav aria-label="Phân trang yêu cầu" className="flex gap-3">
          <Button variant="secondary" size="small" onClick={() => setCursors((previous) => previous.slice(0, -1))}>
            Trang trước
          </Button>
          <Button variant="secondary" size="small" onClick={() => setCursors([undefined])}>
            Về trang đầu
          </Button>
        </nav>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-800 font-medium mb-3">
            {error instanceof Error ? error.message : "Không thể tải danh sách yêu cầu thuê."}
          </p>
          <Button variant="secondary" size="small" onClick={() => refetch()}>
            Thử lại
          </Button>
        </Card>
      )}

      {!isLoading && !isError && data?.items.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <p className="text-content-secondary text-base">
            Bạn chưa nhận được yêu cầu thuê gia sư nào.
          </p>
        </Card>
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="space-y-3">
          {data.items.map((item) => {
            const statusInfo = statusConfig[item.status] || {
              label: item.status,
              variant: "gray" as BadgeVariant,
            };
            return (
              <Card
                key={item.id}
                className="hover:border-role-tutor/60 transition-all p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-base text-content-primary">
                        {item.learner.displayName}
                      </span>
                      <Badge variant={statusInfo.variant} appearance="solid" shape="pill" size="small">
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <div className="text-xs text-content-muted">
                      Gửi lúc: {formatDate(item.createdAt)} • Mã: {item.id}
                    </div>
                  </div>

                  <Link href={`/tutor/requests/${item.id}`}>
                    <Button variant="tutor" size="small">
                      Xem chi tiết →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}

          {data.nextCursor && (
            <div className="pt-4 flex justify-center">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => setCursors((previous) => [...previous, data.nextCursor!])}
              >
                Tải trang tiếp theo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
