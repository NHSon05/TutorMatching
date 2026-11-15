"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { TextField } from "@/components/ui/text-field";
import { ApiError } from "@/lib/api/http";
import {
  removeOffer,
  saveAvailability,
  type AvailabilityInput,
} from "@/lib/api/tutor-offers";

/** Availability days: 1 = Thứ 2 … 7 = Chủ nhật. */
export const AVAILABILITY_DAYS = Array.from({ length: 7 }, (_, i) => ({
  value: String(i + 1),
  label: i === 6 ? "Chủ nhật" : `Thứ ${i + 2}`,
}));

export const dayLabel = (day: number) =>
  AVAILABILITY_DAYS[day - 1]?.label ?? `Ngày ${day}`;

export interface AvailabilityDialogProps {
  /** Slot being edited; omit to create a new one. */
  slotId?: string;
  initial: AvailabilityInput;
  onClose: () => void;
  onSaved: () => void;
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409)
      return "Khung giờ trùng với lịch rảnh đã có. Hãy chọn giờ khác.";
    const details = Object.values(error.errors ?? {})
      .flat()
      .join(" ");
    return details || error.title;
  }
  return "Không lưu được. Nội dung đã nhập được giữ lại; hãy thử lại.";
}

export function AvailabilityDialog({
  slotId,
  initial,
  onClose,
  onSaved,
}: AvailabilityDialogProps) {
  const [slot, setSlot] = useState(initial);
  const invalidRange = slot.startTime >= slot.endTime;
  const mutation = useMutation({
    mutationFn: async (action: "save" | "delete") => {
      if (action === "delete") {
        if (slotId) await removeOffer("availability", slotId);
        return;
      }
      await saveAvailability(slot, slotId);
    },
    onSuccess: onSaved,
  });

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={slotId ? "Sửa lịch rảnh" : "Thêm lịch rảnh"}
      description="Khung giờ lặp lại hằng tuần, theo giờ Việt Nam. Học viên chỉ đặt lịch học trong lịch rảnh của bạn."
      footer={
        <div className="flex flex-wrap justify-between gap-2">
          <div>
            {slotId && (
              <Button
                type="button"
                variant="danger"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate("delete")}
              >
                Xóa khung giờ
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="tertiary" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="availability-form"
              variant="brand"
              disabled={invalidRange || mutation.isPending}
              isLoading={mutation.isPending}
            >
              Lưu lịch rảnh
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="availability-form"
        className="grid gap-3 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalidRange) mutation.mutate("save");
        }}
      >
        <Dropdown
          label="Ngày trong tuần"
          value={String(slot.dayOfWeek)}
          options={AVAILABILITY_DAYS}
          onChange={(value) => setSlot({ ...slot, dayOfWeek: Number(value) })}
          disabled={mutation.isPending}
        />
        <TextField
          label="Giờ bắt đầu"
          type="time"
          required
          value={slot.startTime}
          disabled={mutation.isPending}
          onChange={(e) => setSlot({ ...slot, startTime: e.target.value })}
        />
        <TextField
          label="Giờ kết thúc"
          type="time"
          required
          value={slot.endTime}
          disabled={mutation.isPending}
          onChange={(e) => setSlot({ ...slot, endTime: e.target.value })}
        />
      </form>
      {invalidRange && (
        <p className="mt-3 text-sm text-status-error">
          Giờ kết thúc phải sau giờ bắt đầu.
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="mt-3 text-sm text-status-error">
          {errorMessage(mutation.error)}
        </p>
      )}
    </Dialog>
  );
}

export default AvailabilityDialog;
