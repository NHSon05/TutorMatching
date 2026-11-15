"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useInProgressHires } from "@/hooks/use-in-progress-hires";
import type { HireDetail } from "@/lib/api/hire-requests";
import {
  getAvailability,
  type Availability,
  type AvailabilityInput,
} from "@/lib/api/tutor-offers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EventCalendar,
  type ScheduleEvent,
} from "@/components/ui/event-calendar";
import { PlusIcon } from "@/components/icons";
import { AvailabilityDialog, dayLabel } from "./AvailabilityDialog";

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 22;
const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

/** API days use 1 = Thứ 2 … 7 = Chủ nhật; the calendar uses 0 = Chủ nhật. */
const toCalendarDay = (day: number) =>
  (day === 7 ? 0 : day) as ScheduleEvent["dayOfWeek"];
const fromCalendarDay = (day: ScheduleEvent["dayOfWeek"]) =>
  day === 0 ? 7 : day;
const toMinutes = (time: string) => {
  const [h = "0", m = "0"] = time.split(":");
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};
const hhmm = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

interface CalendarItem extends ScheduleEvent {
  kind: "availability" | "lesson";
  /** Availability slot id, or hire request id for lessons. */
  refId: string;
}

export const availabilityQueryKey = (accountId: string) => [
  "tutor-offer-slots",
  accountId,
];

function lessonEvents(detail: HireDetail): CalendarItem[] {
  const terms = detail.finalAgreement?.terms ?? detail.currentTerms;
  if (!terms) return [];
  const mode = modeNames[terms.teachingMode] ?? terms.teachingMode;
  return terms.schedules.map((slot, index) => ({
    id: `lesson-${detail.id}-${index}`,
    kind: "lesson",
    refId: detail.id,
    dayOfWeek: toCalendarDay(slot.dayOfWeek),
    startTime: slot.startTime,
    endTime: slot.endTime,
    title: `HV. ${detail.learner.displayName}`,
    subtitle: mode,
    status: detail.paymentStatus === "PAID" ? "confirmed" : "pending",
  }));
}

function availabilityEvents(slots: Availability[]): CalendarItem[] {
  return slots.map((slot) => ({
    id: `availability-${slot.id}`,
    kind: "availability",
    refId: slot.id,
    dayOfWeek: toCalendarDay(slot.dayOfWeek),
    startTime: slot.startTime.slice(0, 5),
    endTime: slot.endTime.slice(0, 5),
    title: "Lịch rảnh",
    status: "available",
  }));
}

type DialogState = { slotId?: string; initial: AvailabilityInput } | undefined;

export function TutorScheduleClient({ accountId }: { accountId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState<DialogState>();
  const slots = useQuery({
    queryKey: availabilityQueryKey(accountId),
    queryFn: ({ signal }) => getAvailability(signal),
  });
  const { list, items, details } = useInProgressHires();

  const lessons = details.flatMap((q) => (q.data ? lessonEvents(q.data) : []));
  const free = availabilityEvents(slots.data ?? []);
  const events = [...free, ...lessons];
  const startHour = Math.min(
    DEFAULT_START_HOUR,
    ...events.map((e) => Math.floor(toMinutes(e.startTime) / 60))
  );
  const endHour = Math.max(
    DEFAULT_END_HOUR,
    ...events.map((e) => Math.ceil(toMinutes(e.endTime) / 60) - 1)
  );
  const freeHours =
    (slots.data ?? []).reduce(
      (sum, s) => sum + toMinutes(s.endTime) - toMinutes(s.startTime),
      0
    ) / 60;
  const failedLessons = details.filter((q) => q.isError).length;
  const loading =
    slots.isPending ||
    list.isPending ||
    (items.length > 0 && details.some((q) => q.isPending));

  const openNew = (initial?: Partial<AvailabilityInput>) =>
    setDialog({
      initial: {
        dayOfWeek: 1,
        startTime: "18:00",
        endTime: "20:00",
        ...initial,
      },
    });
  const openItem = (item: CalendarItem) => {
    if (item.kind === "lesson") {
      router.push(`/request/${item.refId}`);
      return;
    }
    setDialog({
      slotId: item.refId,
      initial: {
        dayOfWeek: fromCalendarDay(item.dayOfWeek),
        startTime: item.startTime,
        endTime: item.endTime,
      },
    });
  };

  return (
    <section className="space-y-6" aria-labelledby="tutor-schedule-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            id="tutor-schedule-heading"
            className="text-2xl font-bold text-content-primary"
          >
            Lịch dạy
          </h1>
          <p className="mt-1 text-base text-content-secondary">
            Lịch rảnh hằng tuần và các buổi dạy đã nhận (giờ Việt Nam). Bấm vào
            ô trống trên lịch để thêm giờ rảnh.
          </p>
        </div>
        <Button
          variant="brand"
          leadingIcon={<PlusIcon className="h-4 w-4" />}
          onClick={() => openNew()}
        >
          Thêm lịch rảnh
        </Button>
      </div>

      {loading ? (
        <div role="status" aria-label="Đang tải lịch dạy">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      ) : slots.isError || list.isError ? (
        <Card className="space-y-3">
          <p role="alert" className="text-status-error">
            Không tải được lịch dạy.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              void slots.refetch();
              void list.refetch();
            }}
          >
            Thử lại
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card padding="small">
              <p className="text-2xl font-bold text-status-success">
                {freeHours.toLocaleString("vi-VN", {
                  maximumFractionDigits: 1,
                })}{" "}
                giờ
              </p>
              <p className="text-sm text-content-secondary">
                rảnh mỗi tuần · {slots.data.length} khung giờ
              </p>
            </Card>
            <Card padding="small">
              <p className="text-2xl font-bold text-brand">{lessons.length}</p>
              <p className="text-sm text-content-secondary">
                buổi dạy mỗi tuần · {items.length} học viên
              </p>
            </Card>
            <Card padding="small">
              <p className="text-2xl font-bold text-status-warning">
                {lessons.filter((l) => l.status === "pending").length}
              </p>
              <p className="text-sm text-content-secondary">
                buổi chưa được thanh toán
              </p>
            </Card>
          </div>

          {failedLessons > 0 && (
            <p role="alert" className="text-sm text-status-error">
              Không tải được lịch của {failedLessons} yêu cầu thuê.{" "}
              <button
                type="button"
                className="underline"
                onClick={() =>
                  details.forEach((q) => {
                    if (q.isError) void q.refetch();
                  })
                }
              >
                Thử lại
              </button>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm text-content-secondary">
            <Badge variant="success" appearance="subtitle" size="small">
              Lịch rảnh
            </Badge>
            <Badge variant="brand" appearance="subtitle" size="small">
              Buổi dạy đã thanh toán
            </Badge>
            <Badge variant="warning" appearance="subtitle" size="small">
              Buổi dạy chưa thanh toán
            </Badge>
          </div>

          {/* Weekly grid on larger screens */}
          <EventCalendar
            className="hidden md:block"
            events={events}
            startHour={startHour}
            endHour={endHour}
            slotActionLabel="Thêm lịch rảnh"
            onSlotClick={(day, hour) =>
              openNew({
                dayOfWeek: fromCalendarDay(day),
                startTime: hhmm(hour),
                endTime: hour >= 23 ? "23:59" : hhmm(hour + 1),
              })
            }
            onEventClick={(event) => openItem(event as CalendarItem)}
          />

          {/* Day-by-day agenda on small screens */}
          <ol className="space-y-4 md:hidden" aria-label="Lịch dạy theo ngày">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const dayItems = events
                .filter((e) => fromCalendarDay(e.dayOfWeek) === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <li key={day} className="space-y-2">
                  <h2 className="text-sm font-semibold text-content-primary">
                    {dayLabel(day)}
                  </h2>
                  {dayItems.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openNew({ dayOfWeek: day })}
                      className="w-full rounded-xl border border-dashed border-border-default p-3 text-left text-sm text-content-secondary"
                    >
                      Chưa có lịch · Thêm lịch rảnh
                    </button>
                  ) : (
                    <ul className="space-y-2">
                      {(dayItems as CalendarItem[]).map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => openItem(item)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-card p-3 text-left"
                          >
                            <span>
                              <span className="block font-semibold text-content-primary">
                                {item.startTime} – {item.endTime}
                              </span>
                              <span className="block text-sm text-content-secondary">
                                {item.title}
                                {item.subtitle ? ` · ${item.subtitle}` : ""}
                              </span>
                            </span>
                            <Badge
                              variant={
                                item.kind === "availability"
                                  ? "success"
                                  : item.status === "confirmed"
                                    ? "brand"
                                    : "warning"
                              }
                              appearance="subtitle"
                              size="small"
                            >
                              {item.kind === "availability"
                                ? "Rảnh"
                                : item.status === "confirmed"
                                  ? "Đã thanh toán"
                                  : "Chưa thanh toán"}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>

          {events.length === 0 && (
            <Card className="space-y-2 text-center">
              <h2 className="font-semibold text-content-primary">
                Bạn chưa có lịch rảnh hay buổi dạy nào
              </h2>
              <p className="text-content-secondary">
                Thêm lịch rảnh để học viên có thể đặt lịch học với bạn.
              </p>
              <div>
                <Button asChild variant="secondary">
                  <Link href="/request">Xem yêu cầu thuê</Link>
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {dialog && (
        <AvailabilityDialog
          key={`${dialog.slotId ?? "new"}-${dialog.initial.dayOfWeek}-${dialog.initial.startTime}`}
          slotId={dialog.slotId}
          initial={dialog.initial}
          onClose={() => setDialog(undefined)}
          onSaved={() => {
            setDialog(undefined);
            void queryClient.invalidateQueries({
              queryKey: availabilityQueryKey(accountId),
            });
          }}
        />
      )}
    </section>
  );
}

export default TutorScheduleClient;
