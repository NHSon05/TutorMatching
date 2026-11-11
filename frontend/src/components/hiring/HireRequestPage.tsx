"use client";

import * as React from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api/http";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import {
  useHireRequestDetail,
  useAcceptHireRequest,
  useRejectHireRequest,
  useCancelHireRequest,
  useCompleteHireRequest,
  useInitiateHirePayment,
  useConfirmHirePayment,
  useSubmitHireReview,
  useReplyHireReview,
} from "@/hooks/use-hire-requests";
import { HireRequestDetail } from "@/components/hiring/HireRequestDetail";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HireRequestPage({
  id,
  backHref,
}: {
  id: string;
  backHref: string;
}) {
  const { data: account } = useSession();
  return (
    <HireRequestPageContent
      key={`${account?.id}:${id}`}
      id={id}
      backHref={backHref}
    />
  );
}

function HireRequestPageContent({
  id,
  backHref,
}: {
  id: string;
  backHref: string;
}) {
  const { data: detail, isLoading, error, refetch } = useHireRequestDetail(id);

  const acceptMutation = useAcceptHireRequest(id);
  const rejectMutation = useRejectHireRequest(id);
  const cancelMutation = useCancelHireRequest(id);
  const completeMutation = useCompleteHireRequest(id);
  const initiatePaymentMutation = useInitiateHirePayment(id);
  const confirmPaymentMutation = useConfirmHirePayment(id);
  const submitReviewMutation = useSubmitHireReview(id);
  const replyReviewMutation = useReplyHireReview(id);

  const [reasonDraft, setReasonDraft] = React.useState("");
  const [isConflict, setIsConflict] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleRefresh = async () => {
    const result = await refetch();
    if (result.isError) {
      setErrorMessage(
        "Không thể làm mới dữ liệu. Nội dung đang nhập đã được giữ lại."
      );
      return;
    }
    setIsConflict(false);
    setErrorMessage(null);
    return result.data;
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
        proposalSequence: detail.proposals.at(-1)?.sequence ?? null,
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

  const handleCancel = async (reason?: string) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await cancelMutation.mutateAsync({
        expectedVersion: detail.version,
        confirmed: true,
        reason,
      });
    } catch (e) {
      extractError(e);
    }
  };

  const handleComplete = async (reason?: string) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await completeMutation.mutateAsync({
        expectedVersion: detail.version,
        confirmed: true,
        reason,
      });
    } catch (e) {
      extractError(e);
    }
  };

  const handleInitiatePayment = async () => {
    if (!detail || isConflict) return undefined;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      const key = createIdempotencyKey();
      return await initiatePaymentMutation.mutateAsync(key);
    } catch (e) {
      extractError(e);
      return undefined;
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await confirmPaymentMutation.mutateAsync(paymentId);
    } catch (e) {
      extractError(e);
    }
  };

  const handleSubmitReview = async (payload: {
    rating: number;
    comment?: string;
  }) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await submitReviewMutation.mutateAsync(payload);
    } catch (e) {
      extractError(e);
    }
  };

  const handleReplyReview = async (reply: string) => {
    if (!detail || isConflict) return;
    setIsConflict(false);
    setErrorMessage(null);
    try {
      await replyReviewMutation.mutateAsync({ reply });
    } catch (e) {
      extractError(e);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className=" py-12">
        <Card className="p-8 text-center border-rose-200 bg-rose-50/50">
          <p className="text-sm text-rose-800 font-semibold mb-3">
            {error instanceof Error
              ? error.message
              : "Không tìm thấy yêu cầu thuê hoặc bạn không có quyền xem."}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" size="small" onClick={() => refetch()}>
              Thử lại
            </Button>
            <Link href={backHref}>
              <Button variant="brand" size="small">
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
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center text-base text-content-secondary hover:text-content-primary transition-colors"
        >
          ← Quay lại
        </Link>
      </div>

      <HireRequestDetail
        detail={detail}
        onAccept={handleAccept}
        onReject={handleReject}
        onCancel={handleCancel}
        onComplete={handleComplete}
        onInitiatePayment={handleInitiatePayment}
        onConfirmPayment={handleConfirmPayment}
        onSubmitReview={handleSubmitReview}
        onReplyReview={handleReplyReview}
        onRefresh={handleRefresh}
        isAccepting={acceptMutation.isPending}
        isRejecting={rejectMutation.isPending}
        isCancelling={cancelMutation.isPending}
        isCompleending={completeMutation.isPending}
        isInitiatingPayment={initiatePaymentMutation.isPending}
        isConfirmingPayment={confirmPaymentMutation.isPending}
        isSubmittingReview={submitReviewMutation.isPending}
        isReplyingReview={replyReviewMutation.isPending}
        errorMessage={errorMessage}
        isConflict={isConflict}
        reasonDraft={reasonDraft}
        onReasonDraftChange={setReasonDraft}
      />
    </div>
  );
}

// crypto.randomUUID is missing in non-secure contexts (plain HTTP on a LAN IP),
// so fall back to a valid RFC 4122 v4 UUID built from getRandomValues/Math.random.
function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
