"use client";

import * as React from "react";
import { use } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/http";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import {
  useHireRequestDetail,
  useAcceptHireRequest,
  useRejectHireRequest,
} from "@/hooks/use-hire-requests";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TutorRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: account } = useSession();
  return <TutorRequestDetailContent key={`${account?.id}:${id}`} id={id} />;
}

function TutorRequestDetailContent({ id }: { id: string }) {
  const { data: detail, isLoading, error, refetch } = useHireRequestDetail(id);

  const acceptMutation = useAcceptHireRequest(id);
  const rejectMutation = useRejectHireRequest(id);

  const [reasonDraft, setReasonDraft] = React.useState("");
  const [isConflict, setIsConflict] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.isError) {
      setErrorMessage("Không thể làm mới dữ liệu. Nội dung đang nhập đã được giữ lại.");
      return;
    }
    setIsConflict(false);
    setErrorMessage(null);
  };

  const extractError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 409) {
      setIsConflict(true);
      return;
    }
    setErrorMessage(err instanceof Error ? err.message : "Đã có lỗi xảy ra.");
  };

  const handleAccept = async () => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await acceptMutation.mutateAsync({
        expectedVersion: detail.version,
        proposalSequence: null,
      });
    } catch (e) {
      extractError(e);
    }
  };

  const handleReject = async (reason: string) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    setReasonDraft(reason);
    try {
      await rejectMutation.mutateAsync({
        expectedVersion: detail.version,
        reason,
      });
      setReasonDraft("");
    } catch (e) {
      extractError(e);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <Card className="p-8 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-800 font-semibold mb-3">
            {error instanceof Error ? error.message : "Không tìm thấy yêu cầu thuê hoặc bạn không có quyền xem."}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
            <Link href="/tutor/requests">
              <Button variant="tutor" size="small">
                ← Quay lại danh sách
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/tutor/requests"
          className="inline-flex items-center text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
        >
          ← Quay lại danh sách yêu cầu
        </Link>
      </div>

      <HireRequestDetail
        detail={detail}
        onAccept={handleAccept}
        onReject={handleReject}
        onRefresh={handleRefresh}
        isAccepting={acceptMutation.isPending}
        isRejecting={rejectMutation.isPending}
        errorMessage={errorMessage}
        isConflict={isConflict}
        reasonDraft={reasonDraft}
        onReasonDraftChange={setReasonDraft}
      />
    </div>
  );
}
