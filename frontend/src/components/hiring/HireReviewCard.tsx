"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-area";
import { Badge } from "@/components/ui/badge";
import { formatVietnamDateTime } from "@/lib/date-time";
import type { HireReviewDto } from "@/lib/api/hire-requests";

export interface HireReviewCardProps {
  review: HireReviewDto;
  canReply?: boolean;
  onReplySubmit?: (reply: string) => void | Promise<void>;
  isReplying?: boolean;
  replyError?: string | null;
}

export function HireReviewCard({
  review,
  canReply = false,
  onReplySubmit,
  isReplying = false,
  replyError = null,
}: HireReviewCardProps) {
  const [replyText, setReplyText] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  const handleReply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) {
      setValidationError(
        "Phản hồi phải từ 1 đến 1000 ký tự và không chỉ chứa khoảng trắng."
      );
      return;
    }
    if (trimmed.length > 1000) {
      setValidationError("Phản hồi không được vượt quá 1000 ký tự.");
      return;
    }
    setValidationError(null);
    await onReplySubmit?.(trimmed);
    setReplyText("");
  };

  return (
    <Card className="border-amber-200 bg-amber-50/30">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg font-semibold text-content-primary">
            Đánh giá sau khóa học
          </CardTitle>
          <Badge variant="warning" appearance="solid" shape="pill">
            {`${review.rating} / 5 ★`}
          </Badge>
        </div>
        <p className="text-xs text-content-secondary">
          Đánh giá bởi{" "}
          <span className="font-semibold">{review.reviewerName}</span> vào{" "}
          {formatVietnamDateTime(review.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <p className="text-content-primary whitespace-pre-wrap">
          {review.comment || "Học viên không để lại nhận xét văn bản."}
        </p>

        {review.tutorReply && (
          <div className="p-3.5 rounded-xl bg-white border border-border-default space-y-1">
            <div className="flex items-center justify-between text-xs text-content-secondary">
              <span className="font-semibold text-brand">
                Phản hồi từ gia sư
              </span>
              {review.tutorRepliedAt && (
                <span>{formatVietnamDateTime(review.tutorRepliedAt)}</span>
              )}
            </div>
            <p className="text-content-primary whitespace-pre-wrap">
              {review.tutorReply}
            </p>
          </div>
        )}

        {canReply && !review.tutorReply && onReplySubmit && (
          <form
            onSubmit={handleReply}
            className="p-4 rounded-xl bg-white border border-border-default space-y-3"
          >
            {(validationError || replyError) && (
              <div
                role="alert"
                className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs"
              >
                {validationError || replyError}
              </div>
            )}
            <TextArea
              label="Phản hồi đánh giá của học viên"
              placeholder="Gửi lời cảm ơn hoặc phản hồi tới học viên (1–1000 ký tự)..."
              rows={3}
              maxLength={1000}
              showCount
              value={replyText}
              onChange={(e) => {
                setReplyText(e.target.value);
                if (validationError) setValidationError(null);
              }}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="brand"
                size="small"
                isLoading={isReplying}
                disabled={isReplying}
              >
                Gửi phản hồi
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
export default HireReviewCard;
