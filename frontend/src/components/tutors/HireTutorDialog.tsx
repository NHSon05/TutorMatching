"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { RadioGroup, Radio } from "@/components/ui/radio";
import { TextField } from "@/components/ui/text-field";
import { TextArea } from "@/components/ui/text-area";
import { Spinner } from "@/components/ui/spinner";
import {
  getTutorById,
  publicAvatarUrl,
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

const POPULAR_FREQUENCIES = [
  "1 buổi/tuần",
  "2 buổi/tuần",
  "3 buổi/tuần",
  "4 buổi/tuần",
];

const DAYS_OF_WEEK = [
  { id: "T2", label: "Thứ 2" },
  { id: "T3", label: "Thứ 3" },
  { id: "T4", label: "Thứ 4" },
  { id: "T5", label: "Thứ 5" },
  { id: "T6", label: "Thứ 6" },
  { id: "T7", label: "Thứ 7" },
  { id: "CN", label: "Chủ nhật" },
];

const TIME_SLOTS = [
  { id: "morning", label: "Sáng (08:00 - 11:00)" },
  { id: "afternoon", label: "Chiều (14:00 - 17:00)" },
  { id: "evening", label: "Tối (18:30 - 21:00)" },
];

const modeNames: Record<string, string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  HYBRID: "Kết hợp",
};

export function HireTutorDialog({
  isOpen,
  onClose,
  onBackToDetail,
  tutor,
  tutorId,
}: HireTutorDialogProps) {
  const router = useRouter();

  // Xác định ID gia sư mục tiêu
  const targetId = tutorId ?? (tutor?.id ? String(tutor.id) : null);

  // Gọi API /api/v1/tutors/{id} khi mở dialog
  const {
    data: tutorDetail,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["public-tutor-detail", targetId],
    queryFn: ({ signal }) => getTutorById(targetId!, signal),
    enabled: isOpen && !!targetId,
    staleTime: 60 * 1000,
  });

  // Form State
  const [frequency, setFrequency] = useState<string>("2 buổi/tuần");
  const [selectedDays, setSelectedDays] = useState<string[]>(["T2", "T4", "T6"]);
  const [timeSlot, setTimeSlot] = useState<string>("evening");
  const [isNegotiating, setIsNegotiating] = useState<string>("standard");
  const [proposedPrice, setProposedPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [priceError, setPriceError] = useState<string | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  // Dữ liệu gia sư hợp nhất từ API chi tiết và prop ban đầu
  const name: string =
    tutorDetail?.displayName ??
    (tutor &&
    "displayName" in tutor &&
    typeof (tutor as TutorListItemResponse).displayName === "string"
      ? (tutor as TutorListItemResponse).displayName
      : tutor && "name" in tutor && typeof (tutor as Tutor).name === "string"
      ? (tutor as Tutor).name
      : "Gia sư");

  const avatarSrc: string | undefined =
    tutorDetail?.avatarUrl !== undefined
      ? publicAvatarUrl(tutorDetail.avatarUrl)
      : tutor && "avatarUrl" in tutor
      ? publicAvatarUrl((tutor as TutorListItemResponse).avatarUrl)
      : tutor && "avatar" in tutor && typeof (tutor as Tutor).avatar === "string"
      ? (tutor as Tutor).avatar
      : undefined;

  const title: string = tutorDetail
    ? [
        tutorDetail.qualification,
        tutorDetail.schoolName || tutorDetail.specialization,
      ]
        .filter(Boolean)
        .join(" • ")
    : tutor && "qualification" in tutor
    ? [
        (tutor as TutorListItemResponse).qualification,
        (tutor as TutorListItemResponse).schoolName ||
          (tutor as TutorListItemResponse).specialization,
      ]
        .filter(Boolean)
        .join(" • ")
    : tutor && "title" in tutor && typeof (tutor as Tutor).title === "string"
    ? (tutor as Tutor).title!
    : "Gia sư chuyên môn";

  const priceFormatted: string = tutorDetail
    ? `${tutorDetail.sessionRateVnd.toLocaleString("vi-VN")}đ/buổi`
    : tutor &&
      "sessionRateVnd" in tutor &&
      typeof (tutor as TutorListItemResponse).sessionRateVnd === "number"
    ? `${(tutor as TutorListItemResponse).sessionRateVnd.toLocaleString("vi-VN")}đ/buổi`
    : tutor &&
      "priceFormatted" in tutor &&
      typeof (tutor as Tutor).priceFormatted === "string"
    ? (tutor as Tutor).priceFormatted!
    : "Đang cập nhật";

  const mode: string = tutorDetail
    ? tutorDetail.teachingModes.map((m) => modeNames[m] || m).join(" / ")
    : tutor &&
      "teachingModes" in tutor &&
      Array.isArray((tutor as TutorListItemResponse).teachingModes)
    ? (tutor as TutorListItemResponse).teachingModes
        .map((m) => modeNames[m] || m)
        .join(" / ")
    : tutor && "mode" in tutor && typeof (tutor as Tutor).mode === "string"
    ? (tutor as Tutor).mode!
    : "Trực tuyến / Trực tiếp";

  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleReset = () => {
    setFrequency("2 buổi/tuần");
    setSelectedDays(["T2", "T4", "T6"]);
    setTimeSlot("evening");
    setIsNegotiating("standard");
    setProposedPrice("");
    setNotes("");
    setPriceError(undefined);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isNegotiating === "negotiate") {
      const priceNum = Number(proposedPrice.replace(/\D/g, ""));
      if (!priceNum || priceNum < 10000) {
        setPriceError(
          "Vui lòng nhập mức giá đề xuất hợp lệ (tối thiểu 10.000 VNĐ)."
        );
        return;
      }
    }

    setPriceError(undefined);
    setIsSubmitted(true);
  };

  const handleGoToMessages = () => {
    handleClose();
    router.push("/messages");
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="lg"
      className="p-6 sm:p-7"
    >
      {/* Loading state khi đang tải dữ liệu gia sư từ API và chưa có cache */}
      {isPending && !tutorDetail && !tutor ? (
        <div className="py-12 text-center space-y-3" role="status">
          <Spinner label="Đang tải thông tin gia sư..." size="large" />
          <p className="text-sm text-content-secondary font-medium">
            Đang tải thông tin gia sư...
          </p>
        </div>
      ) : isError && !tutorDetail && !tutor ? (
        <div className="py-8 text-center space-y-3">
          <p role="alert" className="text-status-error font-medium">
            Không thể tải thông tin hồ sơ gia sư. Vui lòng thử lại.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              shape="pill"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="brand"
              shape="pill"
              onClick={() => void refetch()}
            >
              Thử lại
            </Button>
          </div>
        </div>
      ) : isSubmitted ? (
        // =========================================================================
        // MÀN HÌNH THÀNH CÔNG SAU KHI GỬI YÊU CẦU THUÊ
        // =========================================================================
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 bg-status-success-bg text-status-success rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
            ✓
          </div>
          <h3 className="text-2xl font-extrabold text-content-primary tracking-tight">
            Đã gửi yêu cầu thuê gia sư!
          </h3>
          <p className="text-sm text-content-secondary max-w-md mx-auto leading-relaxed">
            Yêu cầu của bạn đã được gửi thành công đến gia sư{" "}
            <strong className="text-content-primary">{name}</strong>. Gia sư sẽ
            nhận được thông báo và liên hệ lại với bạn trong thời gian sớm nhất.
          </p>

          <div className="bg-surface-subtle border border-border-default rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-1.5 text-content-secondary">
            <p>
              📅 <strong className="text-content-primary">Lịch học:</strong> {frequency} ({selectedDays.join(", ")})
            </p>
            <p>
              ⏰ <strong className="text-content-primary">Khung giờ:</strong>{" "}
              {TIME_SLOTS.find((s) => s.id === timeSlot)?.label}
            </p>
            <p>
              💰 <strong className="text-content-primary">Mức học phí:</strong>{" "}
              {isNegotiating === "negotiate" && proposedPrice
                ? `${Number(proposedPrice.replace(/\D/g, "")).toLocaleString("vi-VN")}đ/buổi (Đề xuất thương lượng)`
                : priceFormatted}
            </p>
            {notes.trim() && (
              <p>
                📝 <strong className="text-content-primary">Nhắc nhở:</strong> {notes}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              shape="pill"
              size="medium"
              onClick={handleClose}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="brand"
              shape="pill"
              size="medium"
              onClick={handleGoToMessages}
            >
              Đến Hộp thư trao đổi →
            </Button>
          </div>
        </div>
      ) : (
        // =========================================================================
        // FORM NHẬP THÔNG TIN YÊU CẦU THUÊ GIA SƯ
        // =========================================================================
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Header Thông tin gia sư */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-border-subtle">
            <Avatar
              size="large"
              src={avatarSrc}
              alt={name}
              fallbackText={name}
              shape="rounded"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-content-primary truncate">
                Đăng ký học: {name}
              </h3>
              <p className="text-xs text-content-secondary truncate">{title}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-brand block">
                {priceFormatted}
              </span>
              <span className="text-[11px] text-content-muted">{mode}</span>
            </div>
          </div>

          {/* Vùng nội dung cuộn */}
          <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-5">
            {/* Lịch rảnh khai báo của gia sư nếu có từ api/v1/tutors/{id} */}
            {tutorDetail?.availability && tutorDetail.availability.length > 0 && (
              <div className="bg-brand-50/70 border border-brand-200/70 rounded-2xl p-3 text-xs space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-brand-900">
                  <span>📅</span> Lịch rảnh gia sư đã khai báo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tutorDetail.availability.map((a) => {
                    const dayLabels: Record<number, string> = {
                      1: "Thứ 2",
                      2: "Thứ 3",
                      3: "Thứ 4",
                      4: "Thứ 5",
                      5: "Thứ 6",
                      6: "Thứ 7",
                      7: "Chủ nhật",
                    };
                    return (
                      <span
                        key={a.id}
                        className="bg-white px-2 py-0.5 rounded-md border border-brand-200 text-[11px] font-medium text-brand-800 shadow-2xs"
                      >
                        {dayLabels[a.dayOfWeek] || `T${a.dayOfWeek}`}: {a.startTime} – {a.endTime}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 1. CHỌN BUỔI HỌC */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-content-primary">
                1. Chọn lịch & buổi học mong muốn <span className="text-status-error">*</span>
              </label>

              {/* Tần suất buổi học / tuần */}
              <div>
                <span className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Số buổi mỗi tuần:
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_FREQUENCIES.map((freq) => (
                    <button
                      type="button"
                      key={freq}
                      onClick={() => setFrequency(freq)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        frequency === freq
                          ? "bg-brand text-white shadow-xs"
                          : "bg-surface-subtle border border-border-default text-content-secondary hover:bg-surface-muted"
                      }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chọn các thứ trong tuần */}
              <div>
                <span className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Chọn các thứ học trong tuần:
                </span>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        type="button"
                        key={day.id}
                        onClick={() => toggleDay(day.id)}
                        className={`py-1.5 text-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-brand text-white shadow-xs"
                            : "bg-surface-subtle border border-border-default text-content-secondary hover:bg-surface-muted"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chọn ca học */}
              <div>
                <span className="block text-xs font-semibold text-content-secondary mb-1.5">
                  Ca học phù hợp:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => setTimeSlot(slot.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                        timeSlot === slot.id
                          ? "border-brand bg-brand-50/50 text-brand-900 font-semibold ring-1 ring-brand"
                          : "border-border-default hover:bg-surface-subtle text-content-secondary"
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. GIÁ TIỀN & THƯƠNG LƯỢNG */}
            <div className="space-y-3 pt-3 border-t border-border-subtle">
              <label className="block text-sm font-bold text-content-primary">
                2. Học phí & Thương lượng giá
              </label>

              {/* Thẻ hiển thị giá niêm yết */}
              <div className="bg-surface-subtle rounded-2xl p-3 border border-border-default flex items-center justify-between">
                <div>
                  <span className="text-xs text-content-muted block">
                    Giá niêm yết của gia sư
                  </span>
                  <span className="text-base font-bold text-content-primary">
                    {priceFormatted}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 bg-status-success-bg text-status-success-dark rounded-full font-semibold">
                  {mode}
                </span>
              </div>

              {/* Radio Tôi muốn thương lượng */}
              <RadioGroup
                name="pricingMode"
                value={isNegotiating}
                onChange={(val) => {
                  setIsNegotiating(val);
                  if (val === "standard") {
                    setPriceError(undefined);
                  }
                }}
                className="pt-1"
              >
                <Radio
                  value="standard"
                  label={`Đồng ý học theo giá niêm yết (${priceFormatted})`}
                  helperText="Học phí được áp dụng theo mức giá gia sư đã công khai."
                />
                <Radio
                  value="negotiate"
                  label="Tôi muốn thương lượng giá"
                  helperText="Bạn có thể đề xuất mức học phí phù hợp với ngân sách của gia đình."
                />
              </RadioGroup>

              {/* Input Giá đề xuất khi chọn Thương lượng */}
              {isNegotiating === "negotiate" && (
                <div className="pl-6 pt-1 animate-in fade-in slide-in-from-top-1">
                  <TextField
                    label="Mức giá đề xuất của bạn (VNĐ/buổi)"
                    required
                    placeholder="Ví dụ: 180000"
                    value={proposedPrice}
                    onChange={(e) => {
                      setProposedPrice(e.target.value);
                      if (priceError) setPriceError(undefined);
                    }}
                    error={priceError}
                    helperText="Gia sư sẽ xem xét đề xuất này và phản hồi lại bạn."
                    suffix="VNĐ"
                  />
                </div>
              )}
            </div>

            {/* 3. NHẮC NHỞ THÊM */}
            <div className="space-y-2 pt-3 border-t border-border-subtle">
              <TextArea
                label="3. Nhắc nhở thêm cho gia sư"
                placeholder="Nhập mục tiêu học tập, yêu cầu về tài liệu, trình độ hiện tại của học sinh hoặc lưu ý về địa điểm học..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                helperText="Ghi chú thêm giúp gia sư chuẩn bị giáo án và phản hồi chính xác hơn."
              />
            </div>
          </div>

          {/* Footer nút hành động */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              shape="pill"
              size="medium"
              onClick={onBackToDetail || handleClose}
            >
              {onBackToDetail ? "← Xem lại hồ sơ" : "Hủy"}
            </Button>

            <Button
              type="submit"
              variant="brand"
              shape="pill"
              size="medium"
              className="font-bold shadow-md hover:shadow-lg transition-shadow"
            >
              Gửi yêu cầu thuê gia sư →
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

export default HireTutorDialog;
