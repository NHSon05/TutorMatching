"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInProgressHires } from "@/hooks/use-in-progress-hires";
import type { HireDetail } from "@/lib/api/hire-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EventCalendar,
  type ScheduleEvent,
} from "@/components/ui/event-calendar";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 22;
/** Hire terms use 1 = Thứ 2 … 7 = Chủ nhật; the calendar uses 0 = Chủ nhật. */
const toCalendarDay = (day: number) =>
  (day === 7 ? 0 : day) as ScheduleEvent["dayOfWeek"];
/** Agenda order, Monday first. */
const AGENDA_DAYS = [
  { key: 1, label: "Thứ 2" },
  { key: 2, label: "Thứ 3" },
  { key: 3, label: "Thứ 4" },
  { key: 4, label: "Thứ 5" },
  { key: 5, label: "Thứ 6" },
  { key: 6, label: "Thứ 7" },
  { key: 0, label: "Chủ nhật" },
];
const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

interface LessonEvent extends ScheduleEvent {
  hireId: string;
}

function toEvents(detail: HireDetail): LessonEvent[] {
  const terms = detail.finalAgreement?.terms ?? detail.currentTerms;
  if (!terms) return [];
  const mode = modeNames[terms.teachingMode] ?? terms.teachingMode;
  return terms.schedules.map((slot, index) => ({
    id: `${detail.id}-${index}`,
    hireId: detail.id,
    dayOfWeek: toCalendarDay(slot.dayOfWeek),
    startTime: slot.startTime,
    endTime: slot.endTime,
    title: `GS. ${detail.tutor.displayName}`,
    subtitle: mode,
    // Unpaid lessons are shown as pending until tuition is paid.
    status: detail.paymentStatus === "PAID" ? "confirmed" : "pending",
  }));
}

const hourOf = (time: string) => parseInt(time.split(":")[0] ?? "0", 10);

export function LearnerScheduleClient() {
  const router = useRouter();
  const { list, items, details } = useInProgressHires();
  const events = details
    .flatMap((query) => (query.data ? toEvents(query.data) : []))
    .sort(
      (a, b) =>
        AGENDA_DAYS.findIndex((d) => d.key === a.dayOfWeek) -
          AGENDA_DAYS.findIndex((d) => d.key === b.dayOfWeek) ||
        a.startTime.localeCompare(b.startTime)
    );
  const isDetailLoading = details.some((query) => query.isPending);
  const failedCount = details.filter((query) => query.isError).length;
  // Widen the visible hours so early or late lessons are never cut off.
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...events.map((e) => hourOf(e.startTime))
  );
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...events.map((e) => hourOf(e.startTime))
  );
  const openHire = (hireId: string) =>
    router.push(`/learner/requests/${hireId}`);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">
          Thời khóa biểu học tập
        </h1>
        <p className="mt-1 text-base text-content-secondary">
          Lịch học hằng tuần với các gia sư đang dạy kèm cho bạn (giờ Việt
          Nam).
        </p>
      </div>

      {list.isPending || (items.length > 0 && isDetailLoading) ? (
        <div role="status" aria-label="Đang tải thời khóa biểu">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : list.isError ? (
        <Card className="space-y-3">
          <p role="alert" className="text-status-error">
            Không thể tải thời khóa biểu của bạn.
          </p>
          <Button variant="secondary" onClick={() => void list.refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : events.length === 0 && failedCount === 0 ? (
        <Card className="space-y-3 text-center">
          <h2 className="font-semibold text-content-primary">
            Bạn chưa có lịch học nào
          </h2>
          <p className="text-content-secondary">
            Lịch học sẽ hiển thị khi gia sư chấp nhận yêu cầu thuê của bạn.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="brand">
              <Link href="/tutors">Tìm gia sư</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/learner/requests">Xem yêu cầu đã gửi</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {failedCount > 0 && (
            <p role="alert" className="text-sm text-status-error">
              Không tải được lịch của {failedCount} yêu cầu.{" "}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  details.forEach((query) => {
                    if (query.isError) void query.refetch();
                  })
                }
              >
                Thử lại
              </button>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-content-secondary">
            <Badge variant="brand" appearance="subtitle" size="small">
              Đã thanh toán
            </Badge>
            <Badge variant="warning" appearance="subtitle" size="small">
              Chưa thanh toán
            </Badge>
            <span>Bấm vào buổi học để xem chi tiết yêu cầu.</span>
          </div>

          {/* Weekly grid on larger screens */}
          <EventCalendar
            className="hidden md:block"
            events={events}
            startHour={startHour}
            endHour={endHour}
            onEventClick={(event) => openHire((event as LessonEvent).hireId)}
          />

          {/* Day-by-day agenda on small screens */}
          <ol className="space-y-4 md:hidden" aria-label="Lịch học theo ngày">
            {AGENDA_DAYS.map((day) => {
              const dayEvents = events.filter((e) => e.dayOfWeek === day.key);
              if (dayEvents.length === 0) return null;
              return (
                <li key={day.key} className="space-y-2">
                  <h2 className="text-sm font-semibold text-content-primary">
                    {day.label}
                  </h2>
                  <ul className="space-y-2">
                    {dayEvents.map((event) => (
                      <li key={event.id}>
                        <Link
                          href={`/learner/requests/${event.hireId}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-card p-3"
                        >
                          <span>
                            <span className="block font-semibold text-content-primary">
                              {event.startTime} – {event.endTime}
                            </span>
                            <span className="block text-sm text-content-secondary">
                              {event.title} · {event.subtitle}
                            </span>
                          </span>
                          <Badge
                            variant={
                              event.status === "confirmed" ? "brand" : "warning"
                            }
                            appearance="subtitle"
                            size="small"
                          >
                            {event.status === "confirmed"
                              ? "Đã thanh toán"
                              : "Chưa thanh toán"}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
