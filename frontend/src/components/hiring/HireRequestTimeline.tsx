import type { HireDetail } from "@/lib/api/hire-requests";
import { formatVietnamDateTime } from "@/lib/date-time";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hireStatuses } from "./hire-status";

const days = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
export function HireRequestTimeline({ detail }: { detail: HireDetail }) {
  const actorName = (id?: string | null) =>
    id === detail.learner.id
      ? detail.learner.displayName
      : id === detail.tutor.id
        ? detail.tutor.displayName
        : "Không có thông tin người thực hiện";
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lịch sử yêu cầu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section aria-label="Lịch sử trạng thái">
          <h3 className="font-semibold mb-3">Lịch sử trạng thái</h3>
          <ol className="space-y-3">
            {[...detail.history]
              .sort((a, b) => a.sequence - b.sequence)
              .map((event) => {
                const status = hireStatuses[event.toStatus] ?? {
                  label: event.toStatus,
                  variant: "gray" as const,
                };
                return (
                  <li
                    key={event.sequence}
                    className="p-3 border border-border-default rounded-lg space-y-1"
                  >
                    <p>
                      <span>#{event.sequence}</span> —{" "}
                      {event.fromStatus
                        ? (hireStatuses[event.fromStatus]?.label ??
                          event.fromStatus)
                        : "Tạo yêu cầu"}{" "}
                      → <Badge variant={status.variant}>{status.label}</Badge>
                    </p>
                    <p className="text-sm text-content-secondary">
                      Người thực hiện: {actorName(event.actorId)}
                    </p>
                    <time
                      dateTime={event.createdAt}
                      className="text-sm text-content-secondary"
                    >
                      {formatVietnamDateTime(event.createdAt)}
                    </time>
                    {event.reason && (
                      <p className="whitespace-pre-wrap">
                        Lý do: {event.reason}
                      </p>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
        {detail.proposals.length > 0 && (
          <section>
            <h3 className="font-semibold mb-3">Lịch sử đề xuất</h3>
            <ol aria-label="Lịch sử đề xuất" className="space-y-3">
              {[...detail.proposals]
                .sort((a, b) => a.sequence - b.sequence)
                .map((proposal) => (
                  <li
                    key={proposal.sequence}
                    className="p-3 border border-border-default rounded-lg space-y-1"
                  >
                    <p className="font-semibold">
                      Đề xuất #{proposal.sequence} —{" "}
                      {actorName(proposal.senderId)}
                    </p>
                    <p>
                      {proposal.terms.priceVnd.toLocaleString("vi-VN")} đ/buổi
                    </p>
                    {proposal.terms.schedules.map((slot, i) => (
                      <p key={i}>
                        {days[slot.dayOfWeek - 1]}: {slot.startTime} –{" "}
                        {slot.endTime}
                      </p>
                    ))}
                    {proposal.note && (
                      <p className="whitespace-pre-wrap">{proposal.note}</p>
                    )}
                    <time
                      dateTime={proposal.createdAt}
                      className="text-sm text-content-secondary"
                    >
                      {formatVietnamDateTime(proposal.createdAt)}
                    </time>
                  </li>
                ))}
            </ol>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
