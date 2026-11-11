"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/text-area";

export interface LeaveReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tutorName: string;
  onSubmit: (payload: {
    rating: number;
    comment?: string;
  }) => void | Promise<void>;
  isLoading?: boolean;
  externalError?: string | null;
}

const ratingLabels: Record<number, string> = {
  1: "Rất chưa hài lòng",
  2: "Chưa hài lòng",
  3: "Bình thường",
  4: "Hài lòng",
  5: "Rất hài lòng",
};

export function LeaveReviewDialog({
  isOpen,
  onClose,
  tutorName,
  onSubmit,
  isLoading = false,
  externalError = null,
}: LeaveReviewDialogProps) {
  const [rating, setRating] = React.useState<number>(5);
  const [comment, setComment] = React.useState("");
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Reset the form each time the dialog opens (state adjusted during render).
  const [wasOpen, setWasOpen] = React.useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setRating(5);
      setComment("");
      setValidationError(null);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setValidationError("Vui lòng chọn mức đánh giá từ 1 đến 5 sao.");
      return;
    }

    const trimmed = comment.trim();
    if (comment.length > 0 && !trimmed) {
      setValidationError("Nhận xét không được chỉ chứa khoảng trắng.");
      return;
    }
    if (trimmed.length > 1000) {
      setValidationError("Nhận xét không được vượt quá 1000 ký tự.");
      return;
    }

    setValidationError(null);
    await onSubmit({
      rating,
      comment: trimmed ? trimmed : undefined,
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isLoading ? () => {} : onClose}
      title={`Đánh giá gia sư ${tutorName}`}
      description="Chia sẻ trải nghiệm học tập của bạn sau khi khóa học hoàn tất."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {(validationError || externalError) && (
          <div
            role="alert"
            className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium"
          >
            {validationError || externalError}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-content-primary mb-2">
            Mức độ hài lòng của bạn
          </label>
          <div
            role="radiogroup"
            aria-label="Chọn số sao đánh giá"
            className="flex items-center gap-2"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`Chọn ${star} sao`}
                  data-testid={`review-star-${star}`}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    active
                      ? "bg-amber-50 border-amber-300 text-amber-500"
                      : "bg-gray-50 border-gray-200 text-gray-300 hover:text-amber-400"
                  }`}
                >
                  <svg
                    className="w-6 h-6 fill-current"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              );
            })}
            <span className="ml-2 text-sm font-medium text-content-secondary">
              {rating}/5 — {ratingLabels[rating]}
            </span>
          </div>
        </div>

        <TextArea
          label="Nhận xét chi tiết (không bắt buộc)"
          placeholder="Chia sẻ điểm bạn hài lòng về phương pháp giảng dạy, sự tận tâm của gia sư (tối đa 1000 ký tự)..."
          rows={4}
          maxLength={1000}
          showCount
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (validationError) setValidationError(null);
          }}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-default">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="brand"
            size="small"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Gửi đánh giá
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
export default LeaveReviewDialog;
