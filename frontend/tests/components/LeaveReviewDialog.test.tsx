import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeaveReviewDialog } from "@/components/hiring/LeaveReviewDialog";
import { HireReviewCard } from "@/components/hiring/HireReviewCard";
import type { HireReviewDto } from "@/lib/api/hire-requests";

const sampleReview: HireReviewDto = {
  id: "rev-1",
  hireRequestId: "req-1",
  tutorProfileId: "prof-1",
  reviewerName: "Học viên Minh",
  subjectName: "Toán học",
  rating: 5,
  comment: "Gia sư giảng bài rất dễ hiểu và nhiệt tình!",
  tutorReply: null,
  tutorRepliedAt: null,
  createdAt: "2026-11-08T12:00:00Z",
};

describe("LeaveReviewDialog & HireReviewCard", () => {
  it("allows selecting star rating, entering comment, and submitting review", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <LeaveReviewDialog
        isOpen={true}
        onClose={onClose}
        tutorName="Gia sư Lan"
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText("Đánh giá gia sư Gia sư Lan")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("review-star-4"));
    const commentBox = screen.getByRole("textbox", {
      name: /Nhận xét chi tiết/i,
    });
    fireEvent.change(commentBox, {
      target: { value: "  Rất hài lòng với buổi học!  " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Gửi đánh giá" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        rating: 4,
        comment: "Rất hài lòng với buổi học!",
      });
    });
  });

  it("renders review card and allows tutor to submit a single reply", async () => {
    const onReplySubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <HireReviewCard
        review={sampleReview}
        canReply={true}
        onReplySubmit={onReplySubmit}
      />
    );

    expect(
      screen.getByText("Gia sư giảng bài rất dễ hiểu và nhiệt tình!")
    ).toBeInTheDocument();

    const replyBox = screen.getByRole("textbox", {
      name: /Phản hồi đánh giá của học viên/i,
    });
    fireEvent.change(replyBox, {
      target: { value: "  Cảm ơn bạn đã chăm chỉ học tập!  " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Gửi phản hồi" }));

    await waitFor(() => {
      expect(onReplySubmit).toHaveBeenCalledWith(
        "Cảm ơn bạn đã chăm chỉ học tập!"
      );
    });
  });
});
