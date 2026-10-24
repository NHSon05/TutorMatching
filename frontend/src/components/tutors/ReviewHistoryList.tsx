"use client";
import type { ReviewHistory } from "@/lib/api/tutor-reviews";
export const actionLabel = (action: string) =>
  ({
    APPROVE: "Đã duyệt",
    REQUEST_CHANGES: "Yêu cầu chỉnh sửa",
    REJECT: "Từ chối",
  })[action] ?? "Kết quả duyệt";
export function ReviewHistoryList({ items }: { items: ReviewHistory[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Lịch sử duyệt</h3>
      {items.length === 0 ? (
        <p>Chưa có kết quả duyệt.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="border-b border-border-default pb-3">
              <p className="font-semibold">{actionLabel(item.action)}</p>
              <time dateTime={item.reviewedAt}>
                {new Date(item.reviewedAt).toLocaleString("vi-VN")}
              </time>
              {item.note && <p className="whitespace-pre-wrap">{item.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
