"use client";

import { useRef } from "react";
import { useHireRequestForm } from "@/hooks/use-hire-request-form";
import { usePublicTutorDetail } from "@/hooks/use-public-tutor-detail";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, Radio } from "@/components/ui/radio";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Spinner } from "@/components/ui/spinner";
import {
  type PublicTutorDetail,
  type TutorListItemResponse,
} from "@/lib/api/tutors";
import type { Tutor } from "./types";

export interface HireTutorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToDetail?: () => void;
  tutorId?: string | null;
  tutor?: Tutor | TutorListItemResponse | PublicTutorDetail | null;
}
const modes: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};
const money = (value: number) => `${value.toLocaleString("vi-VN")}đ/buổi`;

export function HireTutorDialog(props: HireTutorDialogProps) {
  const submitting = useRef(false);
  const close = () => {
    if (!submitting.current) props.onClose();
  };
  const id = props.tutorId ?? (props.tutor?.id ? String(props.tutor.id) : null);
  const detail = usePublicTutorDetail(id, props.isOpen);
  if (!props.isOpen) return null;
  return (
    <Dialog
      isOpen
      onClose={close}
      title={
        detail.data
          ? `Đăng ký học: ${detail.data.displayName}`
          : props.tutor && "displayName" in props.tutor
            ? `Đăng ký học: ${props.tutor.displayName}`
            : "Đăng ký học"
      }
      maxWidth="lg"
      className="max-h-[90dvh] overflow-y-auto"
    >
      {detail.isPending ? (
        <Spinner />
      ) : !detail.data ? (
        <div role="alert">
          Không tải được hồ sơ.{" "}
          <Button onClick={() => detail.refetch()}>Thử lại</Button>
        </div>
      ) : (
        <HireForm
          key={id}
          tutor={detail.data}
          onPendingChange={(value) => {
            submitting.current = value;
          }}
          onClose={close}
          refresh={async () => {
            const refreshed = await detail.refetch();
            return refreshed.isError ? undefined : refreshed.data;
          }}
        />
      )}
    </Dialog>
  );
}

function HireForm({
  tutor: initialTutor,
  onClose,
  refresh,
  onPendingChange,
}: {
  tutor: PublicTutorDetail;
  onClose: () => void;
  refresh: () => Promise<PublicTutorDetail | undefined>;
  onPendingChange: (pending: boolean) => void;
}) {
  const {
    tutor,
    values,
    submission,
    busy,
    refreshMessage,
    provinces,
    districts,
    listed,
    fieldError,
    actions,
    submit,
  } = useHireRequestForm({ initialTutor, refresh, onPendingChange });
  const {
    subject,
    course,
    startDate,
    frequency,
    duration,
    mode,
    province,
    district,
    location,
    windows,
    price,
    note,
  } = values;
  const result =
    submission.status === "success" ? submission.result : undefined;
  const error = submission.status === "error" ? submission.message : "";
  const conflict = submission.status === "error" && submission.conflict;
  if (result)
    return (
      <div className="space-y-4" role="status">
        <h3 className="text-lg font-semibold text-status-success">
          Đã gửi yêu cầu thuê gia sư!
        </h3>
        <p>
          Yêu cầu của bạn đã được gửi thành công.{" "}
          {result.status === "PENDING"
            ? "Đang chờ gia sư phản hồi."
            : "Đang thương lượng mức giá đề xuất."}
        </p>
        <p className="break-all text-sm text-content-secondary">
          Mã yêu cầu: {result.id}
        </p>
        <Button onClick={onClose}>Đóng</Button>
      </div>
    );
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="space-y-5"
    >
      <fieldset disabled={busy} className="space-y-5 min-w-0">
        <RadioGroup
          label="Môn học"
          value={subject}
          onChange={actions.changeSubject}
        >
          {tutor.subjects.map((s) => (
            <Radio key={s.subjectId} value={s.subjectId} label={s.name} />
          ))}
        </RadioGroup>
        <RadioGroup
          label="Khóa học"
          value={course}
          onChange={(value) => actions.changeField("course", value)}
        >
          <Radio value="" label={`Theo môn — ${money(tutor.sessionRateVnd)}`} />
          {tutor.courses
            .filter((c) => c.subjectId === subject)
            .map((c) => (
              <Radio
                key={c.id}
                value={c.id}
                label={`${c.name} — ${money(c.pricePerSessionVnd)}`}
              />
            ))}
        </RadioGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Ngày bắt đầu"
            type="date"
            required
            value={startDate}
            onChange={(e) => actions.changeField("startDate", e.target.value)}
            error={fieldError("startDate")}
          />
          <TextField
            label="Số buổi mỗi tuần"
            type="number"
            required
            min={1}
            max={21}
            step={1}
            value={frequency}
            onChange={(e) => actions.changeField("frequency", e.target.value)}
            error={fieldError("sessionsPerWeek")}
          />
          <TextField
            label="Thời lượng mỗi buổi (phút)"
            type="number"
            required
            min={30}
            max={240}
            step={1}
            value={duration}
            onChange={(e) => actions.changeField("duration", e.target.value)}
            error={fieldError("durationMinutes")}
          />
        </div>
        <RadioGroup
          label="Hình thức học"
          value={mode}
          onChange={(value) => actions.changeField("mode", value)}
          error={fieldError("teachingMode")}
        >
          {tutor.teachingModes.map((m) => (
            <Radio key={m} value={m} label={modes[m]} />
          ))}
        </RadioGroup>
        {mode !== "ONLINE" && (
          <div className="space-y-3">
            <Dropdown
              label="Tỉnh / thành phố"
              value={province}
              onChange={actions.changeProvince}
              options={(provinces.data ?? [])
                .filter((p) => p.isActive)
                .map((p) => ({ value: p.code, label: p.name }))}
              error={fieldError("provinceCode")}
            />
            <Dropdown
              label="Quận / huyện"
              value={district}
              onChange={(value) => actions.changeField("district", value)}
              options={(districts.data ?? [])
                .filter((d) => d.isActive && d.provinceCode === province)
                .map((d) => ({ value: d.code, label: d.name }))}
              error={fieldError("districtCode")}
            />
            {(provinces.isError || districts.isError) && (
              <p role="alert">
                Không tải được danh mục địa điểm.{" "}
                <Button
                  type="button"
                  onClick={() => {
                    void provinces.refetch();
                    void districts.refetch();
                  }}
                >
                  Tải lại địa điểm
                </Button>
              </p>
            )}
            <TextField
              label="Địa điểm chi tiết"
              maxLength={500}
              value={location}
              onChange={(e) => actions.changeField("location", e.target.value)}
              error={fieldError("locationDetail")}
            />
          </div>
        )}
        <fieldset className="space-y-3">
          <legend className="font-semibold">
            Khung giờ học (giờ Việt Nam)
          </legend>
          <p className="text-sm text-content-secondary">
            Chọn lịch rảnh và chỉnh khoảng giờ phù hợp. Tổng thời gian cần đủ số
            buổi đã chọn.
          </p>
          {tutor.availability.map((slot) => (
            <div key={slot.id} className="space-y-2">
              <Checkbox
                label={`${slot.dayOfWeek === 7 ? "Chủ nhật" : `Thứ ${slot.dayOfWeek + 1}`}: ${slot.startTime} – ${slot.endTime}`}
                checked={!!windows[slot.id]}
                onChange={(checked) => actions.toggleSchedule(slot.id, checked)}
              />
              {windows[slot.id] && (
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label={`Bắt đầu ${slot.dayOfWeek}`}
                    type="time"
                    required
                    min={slot.startTime}
                    max={slot.endTime}
                    value={windows[slot.id].startTime}
                    onChange={(e) =>
                      actions.changeScheduleTime(
                        slot.id,
                        "startTime",
                        e.target.value
                      )
                    }
                  />
                  <TextField
                    label={`Kết thúc ${slot.dayOfWeek}`}
                    type="time"
                    required
                    min={slot.startTime}
                    max={slot.endTime}
                    value={windows[slot.id].endTime}
                    onChange={(e) =>
                      actions.changeScheduleTime(
                        slot.id,
                        "endTime",
                        e.target.value
                      )
                    }
                  />
                </div>
              )}
            </div>
          ))}
          {!tutor.availability.length && (
            <p>Gia sư chưa có lịch rảnh để nhận yêu cầu.</p>
          )}
          {fieldError("schedules") && (
            <p role="alert" className="text-status-error">
              {fieldError("schedules")}
            </p>
          )}
        </fieldset>
        <TextField
          label="Giá đề xuất (VND/buổi)"
          type="number"
          min={1}
          max={2147483647}
          step={1}
          placeholder={String(listed)}
          value={price}
          onChange={(e) => actions.changeField("price", e.target.value)}
          helperText={`Giá niêm yết: ${money(listed)}. Để trống để dùng giá này.`}
          error={fieldError("priceVnd")}
        />
        <TextArea
          label="Ghi chú"
          maxLength={2000}
          value={note}
          onChange={(e) => actions.changeField("note", e.target.value)}
          error={fieldError("note")}
        />
      </fieldset>
      {refreshMessage && <p role="status">{refreshMessage}</p>}
      {error && (
        <p role="alert" className="text-status-error">
          {error}
        </p>
      )}
      {conflict && (
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() => void actions.refreshOffer()}
        >
          Cập nhật giá và lịch
        </Button>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={busy}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          variant="brand"
          disabled={busy || !tutor.availability.length}
        >
          {busy ? "Đang gửi…" : "Gửi yêu cầu thuê gia sư →"}
        </Button>
      </div>
    </form>
  );
}
