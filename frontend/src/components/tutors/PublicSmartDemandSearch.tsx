"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchedTutorsDialog } from "./MatchedTutorsDialog";
import {
  submitPublicTutorDemand,
  type SubmitTutorDemandResponse,
} from "@/lib/api/tutor-demands";
import { ApiError } from "@/lib/api/http";

export interface PublicSmartDemandSearchProps {
  onHireClick?: (tutorId: string) => void;
}

export function PublicSmartDemandSearch({
  onHireClick,
}: PublicSmartDemandSearchProps = {}) {
  const [queryText, setQueryText] = useState("");
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitTutorDemandResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = queryText.trim();
    if (trimmed.length < 10) {
      setErrorMessage("Vui lòng nhập mô tả nhu cầu ít nhất 10 ký tự.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLastSubmittedQuery(trimmed);

    try {
      const response = await submitPublicTutorDemand(trimmed);
      setResult(response);
      setIsDialogOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.title);
      } else {
        setErrorMessage("Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card padding="medium" className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="public-demand-query"
            className="block text-xl font-semibold text-neutral-900 dark:text-gray-100"
          >
            Nhập nhu cầu tìm gia sư
          </label>
          <textarea
            id="public-demand-query"
            rows={3}
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Ví dụ: Cần tìm gia sư dạy Toán lớp 9 ôn thi vào 10 gần ĐH Bách Khoa, học phí 400k/buổi tuần 2 buổi..."
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4 text-base text-neutral-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-base text-neutral-700 dark:text-gray-400">
            Hệ thống tự động bóc tách môn học, lớp, học phí, khu vực và mở hộp
            thoại danh sách gia sư khớp nối chi tiết.
          </p>
          <div className="flex items-center gap-2">
            {result && (
              <Button
                type="button"
                variant="secondary"
                size="large"
                onClick={() => setIsDialogOpen(true)}
              >
                {`Xem lại kết quả (${result.matchedTutors.length})`}
              </Button>
            )}
            <Button
              type="submit"
              variant="brand"
              isLoading={isLoading}
              size="medium"
            >
              Tìm & Khớp nối gia sư
            </Button>
          </div>
        </div>
      </form>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
        >
          {errorMessage}
        </div>
      )}

      <MatchedTutorsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        queryText={lastSubmittedQuery}
        result={result}
        onHireClick={onHireClick}
      />
    </Card>
  );
}

export default PublicSmartDemandSearch;
