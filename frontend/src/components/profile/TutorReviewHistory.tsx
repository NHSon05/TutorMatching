"use client";
import { useQuery } from "@tanstack/react-query";
import { getReviewHistory } from "@/lib/api/tutor-reviews";
import { ReviewHistoryList } from "@/components/tutors/ReviewHistoryList";
import { Button } from "@/components/ui/button";
export function TutorReviewHistory({ accountId }: { accountId: string }) {
  const query = useQuery({
    queryKey: ["tutor-review-history", accountId],
    queryFn: ({ signal }) => getReviewHistory(signal),
  });
  if (query.isPending) return <p role="status">Đang tải lịch sử duyệt...</p>;
  if (query.isError)
    return (
      <div>
        <p role="alert">Không thể tải lịch sử duyệt.</p>
        <Button onClick={() => void query.refetch()}>
          Thử lại lịch sử duyệt
        </Button>
      </div>
    );
  return <ReviewHistoryList items={query.data} />;
}
